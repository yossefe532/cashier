import os
from dataclasses import dataclass

from auth.config import get_auth_config


@dataclass(frozen=True)
class AppConfig:
    app_name: str
    app_env: str
    api_prefix: str
    auth: object


def get_app_config() -> AppConfig:
    env = os.getenv("APP_ENV", "development").strip().lower()
    return AppConfig(
        app_name="Educon POS API",
        app_env=env,
        api_prefix="/",
        auth=get_auth_config(),
    )

