"""
Deprecated compatibility module.

Single source of truth for DB engine/session/base lives in project-root `database.py`.
This shim prevents model/engine drift for any legacy import path.
"""

from pathlib import Path
import sys

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from database import Base, DATABASE_URL, SessionLocal, engine  # noqa: E402,F401
