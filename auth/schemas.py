from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=6, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class UserMeOut(BaseModel):
    id: int
    username: str
    full_name: str
    is_active: bool
    created_at: datetime
    roles: list[str]
    model_config = ConfigDict(from_attributes=True)


class TokenPairOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    access_expires_at: datetime
    refresh_expires_at: datetime
    user: UserMeOut


class AuthMessageOut(BaseModel):
    message: str

