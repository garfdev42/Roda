from typing import Generator, Optional
from fastapi import Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings


def get_pagination_params(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(settings.default_page_size, ge=1, le=settings.max_page_size, description="Page size")
) -> tuple[int, int]:
    return page, size


def get_db_session() -> Generator[Session, None, None]:
    return get_db()


class PaginationParams:
    def __init__(self, page: int = 1, size: int = 20):
        self.page = page
        self.size = size
        self.offset = (page - 1) * size
        self.limit = size
    
    def paginate_query(self, query):
        return query.offset(self.offset).limit(self.limit)
    
    def create_pagination_response(self, items: list, total: int):
        pages = (total + self.size - 1) // self.size
        
        return {
            "items": items,
            "total": total,
            "page": self.page,
            "size": self.size,
            "pages": pages,
            "has_next": self.page < pages,
            "has_prev": self.page > 1
        }
