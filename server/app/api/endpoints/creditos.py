from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Credito, Cliente
from app.schemas.credito import (
    CreditoResponse, 
    CreditoCreate, 
    CreditoUpdate,
    CreditoWithSchedule,
    CreditoSummary,
    EstadoCreditoEnum,
    ProductoEnum
)
from app.schemas.payment import PaymentScheduleResponse, PaymentSummary
from app.schemas.response import PaginatedResponse, APIResponse
from app.api.deps import PaginationParams
from app.services.payment_service import PaymentService

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[CreditoResponse])
async def get_creditos(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    cliente_id: Optional[int] = Query(None, description="Filter by client ID"),
    producto: Optional[ProductoEnum] = Query(None, description="Filter by product type"),
    estado: Optional[EstadoCreditoEnum] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db)
):
    pagination = PaginationParams(page=page, size=size)
    
    query = db.query(Credito).join(Cliente)
    
    if cliente_id:
        query = query.filter(Credito.cliente_id == cliente_id)
    
    if producto:
        query = query.filter(Credito.producto == producto.value)
    
    if estado:
        query = query.filter(Credito.estado == estado.value)
    
    query = query.order_by(Credito.fecha_desembolso.desc())
    
    total = query.count()
    
    creditos = pagination.paginate_query(query).all()
    
    return pagination.create_pagination_response(creditos, total)


@router.get("/{credito_id}", response_model=CreditoWithSchedule)
async def get_credito(
    credito_id: int,
    include_schedule: bool = Query(True, description="Include payment schedule"),
    include_payments: bool = Query(True, description="Include payment details"),
    db: Session = Depends(get_db)
):
    credito = db.query(Credito).filter(Credito.credito_id == credito_id).first()
    
    if not credito:
        raise HTTPException(status_code=404, detail="Credito not found")
    
    payment_service = PaymentService(db)
    
    schedule = []
    summary = None
    
    if include_schedule:
        schedule = payment_service.get_payment_schedule(
            credito_id, 
            include_payments=include_payments
        )
        summary = payment_service.get_credit_summary(credito_id)
    
    response_data = CreditoResponse.model_validate(credito)
    
    return CreditoWithSchedule(
        **response_data.model_dump(),
        payment_schedule=schedule,
        summary=summary
    )


@router.get("/{credito_id}/schedule", response_model=List[PaymentScheduleResponse])
async def get_credito_schedule(
    credito_id: int,
    include_payments: bool = Query(True, description="Include payment details"),
    estado: Optional[str] = Query(None, description="Filter by payment status"),
    db: Session = Depends(get_db)
):
    credito = db.query(Credito).filter(Credito.credito_id == credito_id).first()
    if not credito:
        raise HTTPException(status_code=404, detail="Credito not found")
    
    payment_service = PaymentService(db)
    schedule = payment_service.get_payment_schedule(credito_id, include_payments)
    
    if estado:
        schedule = [s for s in schedule if s.estado == estado]
    
    return schedule


@router.get("/{credito_id}/summary", response_model=CreditoSummary)
async def get_credito_summary(
    credito_id: int,
    db: Session = Depends(get_db)
):
    payment_service = PaymentService(db)
    summary = payment_service.get_credit_summary(credito_id)
    
    if not summary:
        raise HTTPException(status_code=404, detail="Credito not found")
    
    return summary


@router.get("/{credito_id}/next-payment", response_model=PaymentScheduleResponse)
async def get_next_payment(
    credito_id: int,
    db: Session = Depends(get_db)
):
    payment_service = PaymentService(db)
    next_payment = payment_service.get_next_payment(credito_id)
    
    if not next_payment:
        raise HTTPException(
            status_code=404, 
            detail="No pending payments found for this credit"
        )
    
    return next_payment


@router.post("/", response_model=APIResponse[CreditoResponse])
async def create_credito(
    credito_data: CreditoCreate,
    db: Session = Depends(get_db)
):
    cliente = db.query(Cliente).filter(Cliente.cliente_id == credito_data.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=400, detail="Cliente not found")
    
    db_credito = Credito(**credito_data.model_dump())
    db.add(db_credito)
    db.commit()
    db.refresh(db_credito)
    
    return APIResponse(
        success=True,
        message="Credito created successfully",
        data=db_credito
    )


@router.put("/{credito_id}", response_model=APIResponse[CreditoResponse])
async def update_credito(
    credito_id: int,
    credito_update: CreditoUpdate,
    db: Session = Depends(get_db)
):
    credito = db.query(Credito).filter(Credito.credito_id == credito_id).first()
    
    if not credito:
        raise HTTPException(status_code=404, detail="Credito not found")
    
    update_data = credito_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(value, 'value'):
            value = value.value
        setattr(credito, field, value)
    
    db.commit()
    db.refresh(credito)
    
    return APIResponse(
        success=True,
        message="Credito updated successfully",
        data=credito
    )


@router.get("/analytics/overview", response_model=dict)
async def get_credits_overview(
    db: Session = Depends(get_db)
):
    from sqlalchemy import func, case
    
    stats = db.query(
        func.count(Credito.credito_id).label('total_creditos'),
        func.sum(Credito.inversion).label('total_inversion'),
        func.count(case([(Credito.estado == 'vigente', 1)])).label('creditos_vigentes'),
        func.count(case([(Credito.estado == 'cancelado', 1)])).label('creditos_cancelados'),
        func.count(case([(Credito.producto == 'e-bike', 1)])).label('e_bikes'),
        func.count(case([(Credito.producto == 'e-moped', 1)])).label('e_mopeds')
    ).first()
    
    return {
        "total_creditos": stats.total_creditos or 0,
        "total_inversion": float(stats.total_inversion or 0),
        "creditos_vigentes": stats.creditos_vigentes or 0,
        "creditos_cancelados": stats.creditos_cancelados or 0,
        "productos": {
            "e_bikes": stats.e_bikes or 0,
            "e_mopeds": stats.e_mopeds or 0
        }
    }
