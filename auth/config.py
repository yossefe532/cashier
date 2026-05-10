import os
from dataclasses import dataclass


def _as_int(name: str, default: int) -> int:
    raw = os.getenv(name, str(default)).strip()
    try:
        return int(raw)
    except ValueError:
        return default


@dataclass(frozen=True)
class AuthConfig:
    secret_key: str
    algorithm: str
    access_token_minutes: int
    refresh_token_days: int
    max_failed_attempts: int
    lock_minutes: int
    cors_allowed_origins: list[str]
    init_admin_username: str | None
    init_admin_password: str | None
    init_admin_full_name: str


def get_auth_config() -> AuthConfig:
    app_env = os.getenv("APP_ENV", "").strip().lower()
    is_prod = bool(os.getenv("RAILWAY_ENVIRONMENT")) or app_env in {"production", "prod"}
    secret = os.getenv("JWT_SECRET_KEY", "").strip()
    if not secret and is_prod:
        raise RuntimeError("JWT_SECRET_KEY is required in production")
    if not secret:
        secret = "dev-only-change-me"

    cors_raw = os.getenv("CORS_ALLOWED_ORIGINS", "").strip()
    if cors_raw:
        allowed = [item.strip() for item in cors_raw.split(",") if item.strip()]
    else:
        allowed = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]

    return AuthConfig(
        secret_key=secret,
        algorithm=os.getenv("JWT_ALGORITHM", "HS256").strip() or "HS256",
        access_token_minutes=_as_int("ACCESS_TOKEN_EXPIRE_MINUTES", 20),
        refresh_token_days=_as_int("REFRESH_TOKEN_EXPIRE_DAYS", 14),
        max_failed_attempts=_as_int("AUTH_MAX_FAILED_ATTEMPTS", 5),
        lock_minutes=_as_int("AUTH_LOCK_MINUTES", 15),
        cors_allowed_origins=allowed,
        init_admin_username=os.getenv("INIT_ADMIN_USERNAME", "").strip() or None,
        init_admin_password=os.getenv("INIT_ADMIN_PASSWORD", "").strip() or None,
        init_admin_full_name=os.getenv("INIT_ADMIN_FULL_NAME", "System Administrator").strip(),
    )

