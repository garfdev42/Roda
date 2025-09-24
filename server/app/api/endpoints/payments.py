from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Pago, PaymentSchedule
from app.schemas.payment import (
    PagoResponse, 
    PagoCreate,
    PaymentScheduleResponse,
    MedioPagoEnum,
    EstadoCuotaEnum
)
from app.schemas.response import PaginatedResponse, APIResponse
from app.api.deps import PaginationParams
from app.services.payment_service import PaymentService

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[PagoResponse])
async def get_pagos(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    schedule_id: Optional[int] = Query(None, description="Filter by schedule ID"),
    credito_id: Optional[int] = Query(None, description="Filter by credit ID"),
    medio: Optional[MedioPagoEnum] = Query(None, description="Filter by payment method"),
    db: Session = Depends(get_db)
):
    pagination = PaginationParams(page=page, size=size)
    
    query = db.query(Pago).join(PaymentSchedule)
    
    if schedule_id:
        query = query.filter(Pago.schedule_id == schedule_id)
    
    if credito_id:
        query = query.filter(PaymentSchedule.credito_id == credito_id)
    
    if medio:
        query = query.filter(Pago.medio == medio.value)
    
    query = query.order_by(Pago.fecha_pago.desc())
    
    total = query.count()
    
    pagos = pagination.paginate_query(query).all()
    
    return pagination.create_pagination_response(pagos, total)


@router.get("/{pago_id}", response_model=PagoResponse)
async def get_pago(
    pago_id: int,
    db: Session = Depends(get_db)
):
    pago = db.query(Pago).filter(Pago.pago_id == pago_id).first()
    
    if not pago:
        raise HTTPException(status_code=404, detail="Pago not found")
    
    return pago


@router.post("/", response_model=APIResponse[PagoResponse])
async def create_pago(
    pago_data: PagoCreate,
    db: Session = Depends(get_db)
):
    schedule = db.query(PaymentSchedule).filter(
        PaymentSchedule.schedule_id == pago_data.schedule_id
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=400, detail="Payment schedule not found")
    
    if pago_data.monto <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be positive")
    
    existing_payments = db.query(Pago).filter(
        Pago.schedule_id == pago_data.schedule_id
    ).all()
    
    total_existing = sum(p.monto for p in existing_payments)
    
    if total_existing + pago_data.monto > schedule.valor_cuota:
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount exceeds remaining balance. "
                   f"Remaining: {schedule.valor_cuota - total_existing}"
        )
    
    payment_service = PaymentService(db)
    new_payment = payment_service.create_payment(
        schedule_id=pago_data.schedule_id,
        monto=pago_data.monto,
        medio=pago_data.medio.value if pago_data.medio else None
    )
    
    if not new_payment:
        raise HTTPException(status_code=500, detail="Failed to create payment")
    
    return APIResponse(
        success=True,
        message="Payment created successfully",
        data=new_payment
    )


@router.get("/schedule/{schedule_id}", response_model=List[PagoResponse])
async def get_schedule_payments(
    schedule_id: int,
    db: Session = Depends(get_db)
):
    schedule = db.query(PaymentSchedule).filter(
        PaymentSchedule.schedule_id == schedule_id
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Payment schedule not found")
    
    pagos = db.query(Pago).filter(
        Pago.schedule_id == schedule_id
    ).order_by(Pago.fecha_pago.desc()).all()
    
    return pagos


@router.get("/credito/{credito_id}", response_model=List[PagoResponse])
async def get_credito_payments(
    credito_id: int,
    estado: Optional[EstadoCuotaEnum] = Query(None, description="Filter by installment status"),
    db: Session = Depends(get_db)
):
    query = db.query(Pago).join(PaymentSchedule).filter(
        PaymentSchedule.credito_id == credito_id
    )
    
    if estado:
        query = query.filter(PaymentSchedule.estado == estado.value)
    
    pagos = query.order_by(Pago.fecha_pago.desc()).all()
    
    return pagos


@router.get("/analytics/summary", response_model=dict)
async def get_payments_summary(
    credito_id: Optional[int] = Query(None, description="Filter by credit ID"),
    db: Session = Depends(get_db)
):
    from sqlalchemy import func, case
    
    query = db.query(
        func.count(Pago.pago_id).label('total_payments'),
        func.sum(Pago.monto).label('total_amount'),
        func.avg(Pago.monto).label('average_amount'),
        func.count(case([(Pago.medio == 'app', 1)])).label('app_payments'),
        func.count(case([(Pago.medio == 'efectivo', 1)])).label('cash_payments'),
        func.count(case([(Pago.medio == 'link', 1)])).label('link_payments')
    ).join(PaymentSchedule)
    
    if credito_id:
        query = query.filter(PaymentSchedule.credito_id == credito_id)
    
    stats = query.first()
    
    return {
        "total_payments": stats.total_payments or 0,
        "total_amount": float(stats.total_amount or 0),
        "average_amount": float(stats.average_amount or 0),
        "payment_methods": {
            "app": stats.app_payments or 0,
            "efectivo": stats.cash_payments or 0,
            "link": stats.link_payments or 0
        }
    }


@router.get("/overdue", response_model=List[PaymentScheduleResponse])
async def get_overdue_payments(
    days_overdue: int = Query(0, ge=0, description="Minimum days overdue"),
    db: Session = Depends(get_db)
):
    from datetime import date, timedelta
    
    cutoff_date = date.today() - timedelta(days=days_overdue)
    
    overdue_schedules = db.query(PaymentSchedule).filter(
        PaymentSchedule.estado.in_(['vencida', 'parcial']),
        PaymentSchedule.fecha_vencimiento <= cutoff_date
    ).order_by(PaymentSchedule.fecha_vencimiento).all()
    
    payment_service = PaymentService(db)
    result = []
    
    for schedule in overdue_schedules:
        payments = db.query(Pago).filter(
            Pago.schedule_id == schedule.schedule_id
        ).all()
        
        monto_pagado = sum(p.monto for p in payments) if payments else Decimal('0.00')
        saldo_pendiente = schedule.valor_cuota - monto_pagado
        dias_vencimiento = (date.today() - schedule.fecha_vencimiento).days
        
        schedule_response = PaymentScheduleResponse(
            schedule_id=schedule.schedule_id,
            credito_id=schedule.credito_id,
            num_cuota=schedule.num_cuota,
            fecha_vencimiento=schedule.fecha_vencimiento,
            valor_cuota=schedule.valor_cuota,
            estado=schedule.estado,
            monto_pagado=monto_pagado,
            saldo_pendiente=saldo_pendiente,
            dias_vencimiento=dias_vencimiento,
            pagos=[PagoResponse.model_validate(p) for p in payments]
        )
        
        result.append(schedule_response)
    
    return result
