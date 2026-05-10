from app.repositories.book_repository import BookRepository


class BookService:
    """Example service wrapper keeping domain logic outside route handlers."""

    def __init__(self, repo: BookRepository):
        self.repo = repo

    def list_books(self, skip: int = 0, limit: int = 100):
        return self.repo.list(skip=skip, limit=limit)

