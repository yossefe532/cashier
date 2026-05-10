"""
Deprecated compatibility module.

Single source of truth for API schemas lives in project-root `schemas.py`.
This shim prevents response/field contract drift for any legacy import path.
"""

from pathlib import Path
import sys

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from schemas import *  # noqa: F403,F401,E402
