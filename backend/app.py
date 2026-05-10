"""
Legacy backend entrypoint kept only as a compatibility shim.

Authoritative backend implementation is project-root `main.py` (FastAPI app object).
"""

from pathlib import Path
import sys

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from main import app  # noqa: E402,F401


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
