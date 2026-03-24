from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    author = Column(String, nullable=False, index=True)
    isbn_barcode = Column(String, nullable=True, unique=True, index=True)
    cost_price = Column(Float, nullable=False, default=0.0)
    selling_price = Column(Float, nullable=False, default=0.0)
    estimated_cost_price = Column(Float, nullable=True)
    estimated_selling_price = Column(Float, nullable=True)
    total_stock = Column(Integer, nullable=False, default=0)
    reserved_stock = Column(Integer, nullable=False, default=0)
    is_arriving = Column(Boolean, nullable=False, default=False)

    items = relationship("TransactionItem", back_populates="book")
    reservations = relationship("Reservation", back_populates="book")

    @property
    def available_stock(self) -> int:
        return self.total_stock - self.reserved_stock


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True, index=True)
    gender = Column(String, nullable=True)
    grade = Column(String, nullable=True)
    system = Column(String, nullable=True)
    specialty = Column(String, nullable=True)
    balance = Column(Float, nullable=False, default=0.0)

    transactions = relationship("Transaction", back_populates="student")
    reservations = relationship("Reservation", back_populates="student")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    total_amount = Column(Float, nullable=False)
    discount = Column(Float, nullable=False, default=0.0)
    staff_name = Column(String, nullable=False)
    date = Column(DateTime, nullable=False, default=datetime.utcnow)

    student = relationship("Student", back_populates="transactions")
    items = relationship("TransactionItem", back_populates="transaction", cascade="all, delete-orphan")


class TransactionItem(Base):
    __tablename__ = "transaction_items"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_at_sale = Column(Float, nullable=False)
    cost_at_sale = Column(Float, nullable=False, default=0.0)

    transaction = relationship("Transaction", back_populates="items")
    book = relationship("Book", back_populates="items")


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    deposit_amount = Column(Float, nullable=False, default=0.0)
    status = Column(String, nullable=False, default="pending")
    staff_name = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    student = relationship("Student", back_populates="reservations")
    book = relationship("Book", back_populates="reservations")


class SafeTransaction(Base):
    __tablename__ = "safe_transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False)
    reason = Column(String, nullable=True)
    staff_name = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)
    details = Column(String, nullable=True)
    staff_name = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)


class InventorySession(Base):
    __tablename__ = "inventory_sessions"

    id = Column(Integer, primary_key=True, index=True)
    staff_name = Column(String, nullable=False)
    total_cash_found = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)


class Supply(Base):
    __tablename__ = "supplies"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    paid_amount = Column(Float, nullable=False, default=0.0)
    supplier_name = Column(String, nullable=True)
    staff_name = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)

    book = relationship("Book")


class ReceiptArchive(Base):
    __tablename__ = "receipt_archives"

    id = Column(Integer, primary_key=True, index=True)
    transaction_code = Column(String, nullable=True, index=True)
    receipt_type = Column(String, nullable=False)
    staff_name = Column(String, nullable=True)
    payload = Column(Text, nullable=False)
    printed_at = Column(DateTime, nullable=False, default=datetime.utcnow)
