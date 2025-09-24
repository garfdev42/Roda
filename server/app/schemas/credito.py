from datetime import date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel
from enum import Enum


class ProductoEnum(str, Enum):
    E_BIKE = "e-bike"
    E_MOPED = "e-moped"


class EstadoCreditoEnum(str, Enum):
    VIGENTE = "vigente"
    CANCELADO = "cancelado"
    CASTIGADO = "castigado"


class CreditoBase(BaseModel):
    cliente_id: int
    producto: ProductoEnum
    inversion: Decimal
    cuotas_totales: int
    tea: Decimal
    fecha_desembolso: date
    fecha_inicio_pago: date
    estado: EstadoCreditoEnum = EstadoCreditoEnum.VIGENTE


class CreditoCreate(CreditoBase):
    pass


class CreditoUpdate(BaseModel):
    estado: Optional[EstadoCreditoEnum] = None


class CreditoInDB(CreditoBase):
    credito_id: int
    
    class Config:
        from_attributes = True


class CreditoResponse(CreditoInDB):
    pass


class CreditoSummary(BaseModel):
    credito_id: int
    producto: str
    inversion: Decimal
    cuotas_totales: int
    cuotas_pagadas: int
    cuotas_vencidas: int
    cuotas_pendientes: int
    monto_pagado: Decimal
    saldo_pendiente: Decimal
    estado: str
    
    class Config:
        from_attributes = True


class CreditoWithSchedule(CreditoResponse):
    payment_schedule: List['PaymentScheduleResponse'] = []
    summary: Optional[CreditoSummary] = None
    
    class Config:
        from_attributes = True


from .payment import PaymentScheduleResponse
CreditoWithSchedule.model_rebuild()
