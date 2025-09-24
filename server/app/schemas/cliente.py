from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class ClienteBase(BaseModel):
    tipo_doc: str
    num_doc: str
    nombre: str
    ciudad: Optional[str] = None


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    ciudad: Optional[str] = None


class ClienteInDB(ClienteBase):
    cliente_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ClienteResponse(ClienteInDB):
    pass


class ClienteWithCreditos(ClienteResponse):
    creditos: List['CreditoResponse'] = []
    
    class Config:
        from_attributes = True


from .credito import CreditoResponse
ClienteWithCreditos.model_rebuild()
