from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/roda"
    api_title: str = "Roda API"
    api_description: str = "Sistema de cronogramas de pago para e-bikes y e-mopeds"
    api_version: str = "1.0.0"
    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    default_page_size: int = 20
    max_page_size: int = 100
    
    class Config:
        env_file = ".env"


settings = Settings()
