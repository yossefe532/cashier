from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import json
import shutil
from pathlib import Path
from datetime import datetime

from database import SessionLocal, engine
from models import (
    Base,
    Book,
    Student,
    Transaction,
    TransactionItem,
    Reservation,
    SafeTransaction,
    AuditLog,
    InventorySession,
    Supply,
    ReceiptArchive,
)
from schemas import (
    BookCreate,
    BookUpdate,
    BookOut,
    StudentCreate,
    StudentUpdate,
    StudentOut,
    TransactionCreate,
    TransactionOut,
    ReservationCreate,
    ReservationUpdate,
    ReservationOut,
    SafeTransactionOut,
    AuditLogCreate,
    AuditLogOut,
    InventorySessionCreate,
    InventorySessionOut,
    EmergencyWithdrawalCreate,
    SupplyCreate,
    SupplyOut,
    ReceiptArchiveCreate,
    ReceiptArchiveOut,
    FinanceReportOut,
    BookStatsOut,
)

Base.metadata.create_all(bind=engine)

is_sqlite = engine.dialect.name == "sqlite"
db_file = Path("app.db")
if is_sqlite and db_file.exists():
    backup_dir = Path("db_backups")
    backup_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_file = backup_dir / f"app-{stamp}.db"
    shutil.copy2(db_file, backup_file)

def _ensure_column(table: str, column: str, ddl: str):
    with engine.begin() as conn:
        cols = conn.exec_driver_sql(f"PRAGMA table_info({table})").fetchall()
        existing = {row[1] for row in cols}
        if column in existing:
            return
        conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {ddl}")


if is_sqlite:
    _ensure_column("students", "balance", "balance REAL NOT NULL DEFAULT 0")
    _ensure_column("reservations", "quantity", "quantity INTEGER NOT NULL DEFAULT 1")
    _ensure_column("transaction_items", "cost_at_sale", "cost_at_sale REAL NOT NULL DEFAULT 0")
    _ensure_column("books", "estimated_cost_price", "estimated_cost_price REAL")
    _ensure_column("books", "estimated_selling_price", "estimated_selling_price REAL")

    with engine.begin() as conn:
        conn.exec_driver_sql(
            "UPDATE transaction_items SET cost_at_sale = (SELECT cost_price FROM books WHERE books.id = transaction_items.book_id) "
            "WHERE cost_at_sale = 0"
        )

app = FastAPI(title="Educon POS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def calculate_safe_balance(db: Session) -> float:
    total_sales = db.query(func.coalesce(func.sum(SafeTransaction.amount), 0.0)).filter(SafeTransaction.type == "sale").scalar()
    total_withdrawals = db.query(func.coalesce(func.sum(SafeTransaction.amount), 0.0)).filter(
        SafeTransaction.type.in_(["withdrawal", "emergency", "supply"])
    ).scalar()
    return float(total_sales or 0.0) - float(total_withdrawals or 0.0)


def validate_book_stock(total_stock: int, reserved_stock: int, is_arriving: bool):
    if total_stock < 0 or reserved_stock < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid stock values")
    if not is_arriving and reserved_stock > total_stock:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reserved stock exceeds total stock")


@app.get("/books", response_model=list[BookOut])
def list_books(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Book).offset(skip).limit(limit).all()


@app.get("/books/{book_id}", response_model=BookOut)
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return book


@app.post("/books", response_model=BookOut, status_code=status.HTTP_201_CREATED)
def create_book(payload: BookCreate, db: Session = Depends(get_db)):
    if payload.cost_price < 0 or payload.selling_price < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid price values")
    if payload.estimated_cost_price is not None and payload.estimated_cost_price < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid estimated cost price")
    if payload.estimated_selling_price is not None and payload.estimated_selling_price < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid estimated selling price")
    validate_book_stock(payload.total_stock, payload.reserved_stock, payload.is_arriving)
    book = Book(**payload.model_dump())
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


@app.put("/books/{book_id}", response_model=BookOut)
def update_book(book_id: int, payload: BookUpdate, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    update_data = payload.model_dump(exclude_unset=True)
    if "cost_price" in update_data and update_data["cost_price"] is not None and update_data["cost_price"] < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid cost price")
    if "selling_price" in update_data and update_data["selling_price"] is not None and update_data["selling_price"] < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid selling price")
    if "estimated_cost_price" in update_data and update_data["estimated_cost_price"] is not None and update_data["estimated_cost_price"] < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid estimated cost price")
    if "estimated_selling_price" in update_data and update_data["estimated_selling_price"] is not None and update_data["estimated_selling_price"] < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid estimated selling price")

    total_stock = update_data.get("total_stock", book.total_stock)
    reserved_stock = update_data.get("reserved_stock", book.reserved_stock)
    is_arriving = update_data.get("is_arriving", book.is_arriving)
    validate_book_stock(total_stock, reserved_stock, is_arriving)
    for key, value in update_data.items():
        setattr(book, key, value)
    db.commit()
    db.refresh(book)
    return book


@app.delete("/books/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: int, db: Session = Depends(get_db)):
    raise HTTPException(status_code=status.HTTP_405_METHOD_NOT_ALLOWED, detail="Deleting books is disabled to protect production data")


@app.get("/students", response_model=list[StudentOut])
def list_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Student).offset(skip).limit(limit).all()


@app.get("/students/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student


@app.post("/students", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    student = Student(**payload.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@app.put("/students/{student_id}", response_model=StudentOut)
def update_student(student_id: int, payload: StudentUpdate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    update_data = payload.model_dump(exclude_unset=True)
    grade = update_data.get("grade", student.grade)
    specialty = update_data.get("specialty", student.specialty)
    if grade == "3rd Sec" and not specialty:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Specialty is required for 3rd Sec students")
    if grade in {"1st Sec", "2nd Sec"} and specialty:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Specialty is only allowed for 3rd Sec students")
    for key, value in update_data.items():
        setattr(student, key, value)
    db.commit()
    db.refresh(student)
    return student


@app.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    raise HTTPException(status_code=status.HTTP_405_METHOD_NOT_ALLOWED, detail="Deleting students is disabled to protect production data")


@app.post("/transactions", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    if payload.discount < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid discount")
    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No items provided")

    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    subtotal = 0.0
    reservation_discount = 0.0
    items = []

    try:
        for item in payload.items:
            if item.quantity <= 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid quantity")
            book = db.query(Book).filter(Book.id == item.book_id).with_for_update().first()
            if not book:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Book {item.book_id} not found")
            reservation = None
            if item.reservation_id is not None:
                reservation = (
                    db.query(Reservation)
                    .filter(Reservation.id == item.reservation_id)
                    .with_for_update()
                    .first()
                )
                if not reservation:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
                if reservation.status != "pending":
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reservation is not pending")
                if reservation.student_id != payload.student_id:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reservation student mismatch")
                if reservation.book_id != book.id:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reservation book mismatch")
            reserved_units = int(reservation.quantity) if reservation else 0
            available_units = (book.total_stock - book.reserved_stock + reserved_units) if reservation else (book.total_stock - book.reserved_stock)
            if available_units < item.quantity:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Insufficient stock for book {book.id}")

            line_total = book.selling_price * item.quantity
            subtotal += line_total
            book.total_stock -= item.quantity
            if reservation:
                consume_qty = min(int(reservation.quantity), item.quantity)
                book.reserved_stock = max(0, book.reserved_stock - consume_qty)
                if item.quantity >= int(reservation.quantity):
                    reservation.status = "completed"
                    reservation_discount += reservation.deposit_amount
                else:
                    reservation.quantity = int(reservation.quantity) - item.quantity

            items.append(
                TransactionItem(
                    book_id=book.id,
                    quantity=item.quantity,
                    price_at_sale=book.selling_price,
                    cost_at_sale=book.cost_price,
                )
            )

        total_discount = payload.discount + reservation_discount
        total_amount = subtotal - total_discount
        if total_amount < 0:
            total_amount = 0.0

        transaction = Transaction(
            student_id=payload.student_id,
            total_amount=total_amount,
            discount=total_discount,
            staff_name=payload.staff_name,
        )
        transaction.items = items
        db.add(transaction)
        if total_amount > 0:
            db.add(
                SafeTransaction(
                    amount=total_amount,
                    type="sale",
                    reason="Sale transaction",
                    staff_name=payload.staff_name,
                )
            )
        db.commit()
        db.refresh(transaction)
        return transaction
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Transaction failed")


@app.get("/reservations", response_model=list[ReservationOut])
def list_reservations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return (
        db.query(Reservation)
        .order_by(Reservation.deposit_amount.desc(), Reservation.created_at.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@app.post("/reservations", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
def create_reservation(payload: ReservationCreate, db: Session = Depends(get_db)):
    if payload.deposit_amount < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid deposit amount")
    if payload.quantity <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid quantity")
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    book = db.query(Book).filter(Book.id == payload.book_id).with_for_update().first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    existing = (
        db.query(Reservation)
        .filter(
            Reservation.student_id == payload.student_id,
            Reservation.book_id == payload.book_id,
            Reservation.status == "pending",
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reservation already exists")
    if not book.is_arriving and book.available_stock < payload.quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No available stock to reserve")

    reservation = Reservation(**payload.model_dump())
    reservation.status = "pending"
    book.reserved_stock += payload.quantity
    db.add(reservation)
    if payload.deposit_amount > 0:
        db.add(
            SafeTransaction(
                amount=payload.deposit_amount,
                type="sale",
                reason="Reservation deposit",
                staff_name=payload.staff_name,
            )
        )
    db.commit()
    db.refresh(reservation)
    return reservation


@app.put("/reservations/{reservation_id}", response_model=ReservationOut)
def update_reservation(reservation_id: int, payload: ReservationUpdate, db: Session = Depends(get_db)):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
    if reservation.status == "completed" and payload.status == "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot revert a completed reservation")
    if reservation.status == "pending" and payload.status == "completed":
        book = db.query(Book).filter(Book.id == reservation.book_id).with_for_update().first()
        if book:
            book.reserved_stock = max(0, book.reserved_stock - int(reservation.quantity))
    if reservation.status == "pending" and payload.status == "cancelled":
        book = db.query(Book).filter(Book.id == reservation.book_id).with_for_update().first()
        if book:
            book.reserved_stock = max(0, book.reserved_stock - int(reservation.quantity))
    reservation.status = payload.status
    db.commit()
    db.refresh(reservation)
    return reservation


@app.delete("/reservations/{reservation_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_reservation(reservation_id: int, db: Session = Depends(get_db)):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
    if reservation.status == "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot cancel a completed reservation")
    book = db.query(Book).filter(Book.id == reservation.book_id).with_for_update().first()
    if book:
        book.reserved_stock = max(0, book.reserved_stock - int(reservation.quantity))
    reservation.status = "cancelled"
    db.commit()
    return None


@app.get("/safe/transactions", response_model=list[SafeTransactionOut])
def list_safe_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(SafeTransaction).order_by(SafeTransaction.timestamp.desc()).offset(skip).limit(limit).all()


@app.get("/transactions", response_model=list[TransactionOut])
def list_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Transaction).order_by(Transaction.date.desc()).offset(skip).limit(limit).all()


@app.post("/supplies", response_model=SupplyOut, status_code=status.HTTP_201_CREATED)
def create_supply(payload: SupplyCreate, db: Session = Depends(get_db)):
    if payload.quantity <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid quantity")
    if payload.unit_cost < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid unit cost")
    if payload.paid_amount < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid paid amount")

    book = db.query(Book).filter(Book.id == payload.book_id).with_for_update().first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    total_cost = float(payload.unit_cost) * int(payload.quantity)
    if payload.paid_amount > total_cost:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Paid amount exceeds total cost")

    supply = Supply(
        book_id=payload.book_id,
        quantity=payload.quantity,
        unit_cost=payload.unit_cost,
        total_cost=total_cost,
        paid_amount=payload.paid_amount,
        supplier_name=payload.supplier_name,
        staff_name=payload.staff_name,
    )
    book.total_stock += payload.quantity
    db.add(supply)
    if payload.paid_amount > 0:
        db.add(
            SafeTransaction(
                amount=payload.paid_amount,
                type="supply",
                reason="Supply payment",
                staff_name=payload.staff_name,
            )
        )
    db.commit()
    db.refresh(supply)
    return supply


@app.get("/supplies", response_model=list[SupplyOut])
def list_supplies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Supply).order_by(Supply.timestamp.desc()).offset(skip).limit(limit).all()


@app.post("/receipt-archive", response_model=ReceiptArchiveOut, status_code=status.HTTP_201_CREATED)
def archive_receipt(payload: ReceiptArchiveCreate, db: Session = Depends(get_db)):
    try:
        serialized = json.dumps(payload.payload, ensure_ascii=False)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload")
    entry = ReceiptArchive(
        transaction_code=payload.transaction_code,
        receipt_type=payload.receipt_type,
        staff_name=payload.staff_name,
        payload=serialized,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return ReceiptArchiveOut(
        id=entry.id,
        transaction_code=entry.transaction_code,
        receipt_type=entry.receipt_type,
        staff_name=entry.staff_name,
        payload=payload.payload,
        printed_at=entry.printed_at,
    )


@app.get("/receipt-archive", response_model=list[ReceiptArchiveOut])
def list_receipt_archive(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    items = db.query(ReceiptArchive).order_by(ReceiptArchive.printed_at.desc()).offset(skip).limit(limit).all()
    result: list[ReceiptArchiveOut] = []
    for entry in items:
        try:
            payload = json.loads(entry.payload)
        except Exception:
            payload = {}
        result.append(
            ReceiptArchiveOut(
                id=entry.id,
                transaction_code=entry.transaction_code,
                receipt_type=entry.receipt_type,
                staff_name=entry.staff_name,
                payload=payload,
                printed_at=entry.printed_at,
            )
        )
    return result


@app.get("/reports/finance", response_model=FinanceReportOut)
def finance_report(db: Session = Depends(get_db)):
    revenue = float(
        db.query(func.coalesce(func.sum(SafeTransaction.amount), 0.0)).filter(SafeTransaction.type == "sale").scalar()
        or 0.0
    )
    withdrawals = float(
        db.query(func.coalesce(func.sum(SafeTransaction.amount), 0.0))
        .filter(SafeTransaction.type.in_(["withdrawal", "emergency", "supply"]))
        .scalar()
        or 0.0
    )
    cogs = float(
        db.query(func.coalesce(func.sum(TransactionItem.quantity * TransactionItem.cost_at_sale), 0.0)).scalar() or 0.0
    )
    gross_profit = revenue - cogs
    safe_balance = revenue - withdrawals
    supplier_due = float(db.query(func.coalesce(func.sum(Supply.total_cost - Supply.paid_amount), 0.0)).scalar() or 0.0)
    return FinanceReportOut(
        revenue=revenue,
        cogs=cogs,
        gross_profit=gross_profit,
        withdrawals=withdrawals,
        safe_balance=safe_balance,
        supplier_due=supplier_due,
    )


@app.get("/reports/books", response_model=list[BookStatsOut])
def books_report(db: Session = Depends(get_db)):
    sold = (
        db.query(TransactionItem.book_id, func.coalesce(func.sum(TransactionItem.quantity), 0).label("sold_qty"))
        .group_by(TransactionItem.book_id)
        .subquery()
    )
    reserved = (
        db.query(Reservation.book_id, func.coalesce(func.sum(Reservation.quantity), 0).label("pending_reserved_qty"))
        .filter(Reservation.status == "pending")
        .group_by(Reservation.book_id)
        .subquery()
    )
    rows = (
        db.query(
            Book.id.label("book_id"),
            func.coalesce(sold.c.sold_qty, 0).label("sold_qty"),
            func.coalesce(reserved.c.pending_reserved_qty, 0).label("pending_reserved_qty"),
        )
        .outerjoin(sold, sold.c.book_id == Book.id)
        .outerjoin(reserved, reserved.c.book_id == Book.id)
        .all()
    )
    return [BookStatsOut(book_id=r.book_id, sold_qty=int(r.sold_qty), pending_reserved_qty=int(r.pending_reserved_qty)) for r in rows]


@app.post("/safe/emergency-withdrawals", response_model=SafeTransactionOut, status_code=status.HTTP_201_CREATED)
def emergency_withdrawal(payload: EmergencyWithdrawalCreate, db: Session = Depends(get_db)):
    if payload.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid withdrawal amount")
    transaction = SafeTransaction(
        amount=payload.amount,
        type="emergency",
        reason=payload.reason,
        staff_name=payload.staff_name,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@app.post("/audit-logs", response_model=AuditLogOut, status_code=status.HTTP_201_CREATED)
def create_audit_log(payload: AuditLogCreate, db: Session = Depends(get_db)):
    log = AuditLog(**payload.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@app.get("/inventory-sessions", response_model=list[InventorySessionOut])
def list_inventory_sessions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(InventorySession).order_by(InventorySession.timestamp.desc()).offset(skip).limit(limit).all()


@app.post("/inventory-sessions", response_model=InventorySessionOut, status_code=status.HTTP_201_CREATED)
def create_inventory_session(payload: InventorySessionCreate, db: Session = Depends(get_db)):
    if payload.total_cash_found < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid cash amount")
    current_balance = calculate_safe_balance(db)
    session = InventorySession(**payload.model_dump())
    db.add(session)
    if current_balance > 0:
        db.add(
            SafeTransaction(
                amount=current_balance,
                type="withdrawal",
                reason="Inventory audit reset",
                staff_name=payload.staff_name,
            )
        )
    db.commit()
    db.refresh(session)
    return session


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
