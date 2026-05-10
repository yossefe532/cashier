from sqlalchemy.orm import Session

from app.models import Book


class BookRepository:
    """Example repository abstraction for incremental migration."""

    def __init__(self, db: Session):
        self.db = db

    def list(self, skip: int = 0, limit: int = 100) -> list[Book]:
        return self.db.query(Book).offset(skip).limit(limit).all()

    def get(self, book_id: int) -> Book | None:
        return self.db.query(Book).filter(Book.id == book_id).first()

