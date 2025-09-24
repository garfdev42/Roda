from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel
from enum import Enum


class EstadoCuotaEnum(str, Enum):
    PENDIENTE = "pendiente"
    PARCIAL = "parcial"
    PAGADA = "pagada"
    VENCIDA = "vencida"


class MedioPagoEnum(str, Enum):
    APP = "app"
    EFECTIVO = "efectivo"
    LINK = "link"


class PaymentScheduleBase(BaseModel):
    credito_id: int
    num_cuota: int
    fecha_vencimiento: date
    valor_cuota: Decimal
    estado: EstadoCuotaEnum = EstadoCuotaEnum.PENDIENTE


class PaymentScheduleInDB(PaymentScheduleBase):
    schedule_id: int
    
    class Config:
        from_attributes = True


class PaymentScheduleResponse(PaymentScheduleInDB):
    monto_pagado: Optional[Decimal] = Decimal('0.00')
    saldo_pendiente: Optional[Decimal] = None
    dias_vencimiento: Optional[int] = None
    pagos: List['PagoResponse'] = []
    
    class Config:
        from_attributes = True


class PagoBase(BaseModel):
    schedule_id: int
    fecha_pago: datetime
    monto: Decimal
    medio: Optional[MedioPagoEnum] = None


class PagoCreate(PagoBase):
    pass


class PagoInDB(PagoBase):
    pago_id: int
    
    class Config:
        from_attributes = True


class PagoResponse(PagoInDB):
    pass


class PaymentSummary(BaseModel):
    total_cuotas: int
    cuotas_pagadas: int
    cuotas_vencidas: int
    cuotas_pendientes: int
    monto_total_credito: Decimal
    monto_pagado: Decimal
    saldo_pendiente: Decimal
    proxima_cuota: Optional[PaymentScheduleResponse] = None
    
    class Config:
        from_attributes = True


PaymentScheduleResponse.model_rebuild()
