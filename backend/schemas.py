from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class BookBase(BaseModel):
    title: str
    author: str
    isbn_barcode: Optional[str] = None
    price: float
    stock: int


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn_barcode: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None


class BookOut(BookBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class StudentBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class StudentOut(StudentBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class TransactionItemCreate(BaseModel):
    book_id: int
    quantity: int


class TransactionItemOut(BaseModel):
    id: int
    book_id: int
    quantity: int
    price_at_sale: float
    model_config = ConfigDict(from_attributes=True)


class TransactionCreate(BaseModel):
    student_id: int
    discount: float = 0.0
    items: List[TransactionItemCreate]


class TransactionOut(BaseModel):
    id: int
    student_id: int
    total_amount: float
    discount: float
    date: datetime
    items: List[TransactionItemOut]
    model_config = ConfigDict(from_attributes=True)
