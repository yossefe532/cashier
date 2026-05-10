from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user, get_db
from auth.schemas import AuthMessageOut, LoginRequest, LogoutRequest, RefreshRequest, TokenPairOut, UserMeOut
from auth.security import AuthTokenError
from auth.service import authenticate_user, issue_token_pair, revoke_refresh, rotate_refresh_token
from models import User

router = APIRouter(prefix="/auth", tags=["auth"])


def _client_ip(request: Request) -> str | None:
    if request.client and request.client.host:
        return request.client.host
    return None


@router.post("/login", response_model=TokenPairOut)
def login(
    payload: LoginRequest,
    request: Request,
    user_agent: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, payload.username, payload.password, _client_ip(request))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    return issue_token_pair(db, user, _client_ip(request), user_agent)


@router.post("/refresh", response_model=TokenPairOut)
def refresh(
    payload: RefreshRequest,
    request: Request,
    user_agent: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    try:
        return rotate_refresh_token(db, payload.refresh_token, _client_ip(request), user_agent)
    except AuthTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


@router.post("/logout", response_model=AuthMessageOut)
def logout(payload: LogoutRequest, db: Session = Depends(get_db)):
    revoke_refresh(db, payload.refresh_token)
    return AuthMessageOut(message="Logged out")


@router.get("/me", response_model=UserMeOut)
def me(user: User = Depends(get_current_user)):
    return UserMeOut(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        is_active=user.is_active,
        created_at=user.created_at,
        roles=sorted({role.name for role in user.roles}),
    )

