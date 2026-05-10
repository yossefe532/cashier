"""
Deprecated compatibility module.

Single source of truth for ORM models lives in project-root `models.py`.
This shim prevents schema drift for any legacy import path.
"""

from pathlib import Path
import sys

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from models import (  # noqa: E402,F401
    AuditLog,
    Base,
    Book,
    InventorySession,
    ReceiptArchive,
    RefreshToken,
    Reservation,
    Role,
    SafeTransaction,
    Student,
    Supply,
    Transaction,
    TransactionItem,
    User,
    UserRole,
)
