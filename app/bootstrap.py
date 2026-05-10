"""
Canonical backend bootstrap.

Authoritative FastAPI implementation remains in `main.py`.
This module provides a stable import path for deployment/runtime wiring.
"""

from main import app  # noqa: F401

