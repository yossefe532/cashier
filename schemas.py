from datetime import datetime
from typing import List, Optional, Literal

from pydantic import BaseModel, ConfigDict, model_validator


class BookBase(BaseModel):
    title: str
    author: str
    isbn_barcode: Optional[str] = None
    cost_price: float
    selling_price: float
    estimated_cost_price: Optional[float] = None
    estimated_selling_price: Optional[float] = None
    total_stock: int
    reserved_stock: int = 0
    is_arriving: bool = False


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn_barcode: Optional[str] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    estimated_cost_price: Optional[float] = None
    estimated_selling_price: Optional[float] = None
    total_stock: Optional[int] = None
    reserved_stock: Optional[int] = None
    is_arriving: Optional[bool] = None


class BookOut(BookBase):
    id: int
    available_stock: int
    model_config = ConfigDict(from_attributes=True)


class StudentBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    gender: Optional[Literal["male", "female"]] = None
    grade: Optional[Literal["1st Sec", "2nd Sec", "3rd Sec"]] = None
    system: Optional[Literal["General", "Azhar"]] = None
    specialty: Optional[Literal["Scientific", "Math", "Literary"]] = None
    balance: float = 0.0


class StudentCreate(StudentBase):
    @model_validator(mode="after")
    def validate_specialty(self):
        if self.grade == "3rd Sec" and not self.specialty:
            raise ValueError("Specialty is required for 3rd Sec students")
        if self.grade in {"1st Sec", "2nd Sec"} and self.specialty:
            raise ValueError("Specialty is only allowed for 3rd Sec students")
        return self


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gender: Optional[Literal["male", "female"]] = None
    grade: Optional[Literal["1st Sec", "2nd Sec", "3rd Sec"]] = None
    system: Optional[Literal["General", "Azhar"]] = None
    specialty: Optional[Literal["Scientific", "Math", "Literary"]] = None
    balance: Optional[float] = None


class StudentOut(StudentBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class TransactionItemCreate(BaseModel):
    book_id: int
    quantity: int
    reservation_id: Optional[int] = None


class TransactionItemOut(BaseModel):
    id: int
    book_id: int
    quantity: int
    price_at_sale: float
    cost_at_sale: float
    model_config = ConfigDict(from_attributes=True)


class TransactionCreate(BaseModel):
    student_id: int
    discount: float = 0.0
    staff_name: str
    items: List[TransactionItemCreate]


class TransactionOut(BaseModel):
    id: int
    student_id: int
    total_amount: float
    discount: float
    staff_name: str
    date: datetime
    items: List[TransactionItemOut]
    model_config = ConfigDict(from_attributes=True)


class ReservationBase(BaseModel):
    student_id: int
    book_id: int
    quantity: int = 1
    deposit_amount: float = 0.0
    status: Literal["pending", "completed", "cancelled"] = "pending"
    staff_name: str


class ReservationCreate(ReservationBase):
    pass


class ReservationUpdate(BaseModel):
    status: Literal["pending", "completed", "cancelled"]


class ReservationOut(ReservationBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SafeTransactionCreate(BaseModel):
    amount: float
    type: Literal["sale", "withdrawal", "emergency", "supply"]
    reason: Optional[str] = None
    staff_name: str


class SafeTransactionOut(SafeTransactionCreate):
    id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)


class AuditLogCreate(BaseModel):
    action: str
    details: Optional[str] = None
    staff_name: str


class AuditLogOut(AuditLogCreate):
    id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)


class InventorySessionCreate(BaseModel):
    staff_name: Literal["Heba", "Mariam"]
    total_cash_found: float


class InventorySessionOut(InventorySessionCreate):
    id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)


class EmergencyWithdrawalCreate(BaseModel):
    amount: float
    reason: Optional[str] = None
    staff_name: str


class SupplyCreate(BaseModel):
    book_id: int
    quantity: int
    unit_cost: float
    paid_amount: float = 0.0
    supplier_name: Optional[str] = None
    staff_name: str


class SupplyOut(SupplyCreate):
    id: int
    total_cost: float
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)


class ReceiptArchiveCreate(BaseModel):
    transaction_code: Optional[str] = None
    receipt_type: str
    staff_name: Optional[str] = None
    payload: dict


class ReceiptArchiveOut(BaseModel):
    id: int
    transaction_code: Optional[str] = None
    receipt_type: str
    staff_name: Optional[str] = None
    payload: dict
    printed_at: datetime
    model_config = ConfigDict(from_attributes=True)


class FinanceReportOut(BaseModel):
    revenue: float
    cogs: float
    gross_profit: float
    withdrawals: float
    safe_balance: float
    supplier_due: float


class BookStatsOut(BaseModel):
    book_id: int
    sold_qty: int
    pending_reserved_qty: int
