from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from jose import JWTError, jwt
from passlib.context import CryptContext

from auth.config import get_auth_config

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
auth_config = get_auth_config()


class AuthTokenError(Exception):
    pass


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(user_id: int, username: str, roles: list[str], token_version: int) -> tuple[str, datetime]:
    expire_at = now_utc() + timedelta(minutes=auth_config.access_token_minutes)
    payload = {
        "sub": str(user_id),
        "username": username,
        "roles": roles,
        "type": "access",
        "tv": token_version,
        "jti": secrets.token_urlsafe(12),
        "iat": int(now_utc().timestamp()),
        "exp": int(expire_at.timestamp()),
    }
    token = jwt.encode(payload, auth_config.secret_key, algorithm=auth_config.algorithm)
    return token, expire_at


def create_refresh_token(user_id: int, token_version: int) -> tuple[str, datetime]:
    expire_at = now_utc() + timedelta(days=auth_config.refresh_token_days)
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "tv": token_version,
        "jti": secrets.token_urlsafe(16),
        "iat": int(now_utc().timestamp()),
        "exp": int(expire_at.timestamp()),
    }
    token = jwt.encode(payload, auth_config.secret_key, algorithm=auth_config.algorithm)
    return token, expire_at


def decode_token(token: str, expected_type: str) -> dict:
    try:
        payload = jwt.decode(token, auth_config.secret_key, algorithms=[auth_config.algorithm])
    except JWTError as exc:
        raise AuthTokenError("Invalid or expired token") from exc

    token_type = payload.get("type")
    if token_type != expected_type:
        raise AuthTokenError("Invalid token type")
    return payload

