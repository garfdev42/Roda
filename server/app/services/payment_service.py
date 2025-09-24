from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from app.models.models import Credito, PaymentSchedule, Pago, Cliente
from app.schemas.payment import PaymentScheduleResponse, PagoResponse, PaymentSummary
from app.schemas.credito import CreditoSummary


class PaymentService:
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_payment_schedule(
        self, 
        credito_id: int, 
        include_payments: bool = True
    ) -> List[PaymentScheduleResponse]:
        
        query = self.db.query(PaymentSchedule).filter(
            PaymentSchedule.credito_id == credito_id
        ).order_by(PaymentSchedule.num_cuota)
        
        schedules = query.all()
        
        result = []
        for schedule in schedules:
            payments = self.db.query(Pago).filter(
                Pago.schedule_id == schedule.schedule_id
            ).order_by(desc(Pago.fecha_pago)).all()
            
            monto_pagado = sum(p.monto for p in payments) if payments else Decimal('0.00')
            saldo_pendiente = schedule.valor_cuota - monto_pagado
            
            today = date.today()
            dias_vencimiento = (today - schedule.fecha_vencimiento).days
            
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
                pagos=[PagoResponse.model_validate(p) for p in payments] if include_payments else []
            )
            
            result.append(schedule_response)
        
        return result
    
    def get_credit_summary(self, credito_id: int) -> Optional[CreditoSummary]:
        
        credito = self.db.query(Credito).filter(Credito.credito_id == credito_id).first()
        if not credito:
            return None
        
        schedule_stats = self.db.query(
            func.count(PaymentSchedule.schedule_id).label('total_cuotas'),
            func.count(func.case((PaymentSchedule.estado == 'pagada', 1))).label('cuotas_pagadas'),
            func.count(func.case((PaymentSchedule.estado == 'vencida', 1))).label('cuotas_vencidas'),
            func.count(func.case((PaymentSchedule.estado.in_(['pendiente', 'parcial']), 1))).label('cuotas_pendientes')
        ).filter(PaymentSchedule.credito_id == credito_id).first()
        
        payment_amounts = self.db.query(
            func.coalesce(func.sum(Pago.monto), 0).label('monto_pagado')
        ).join(PaymentSchedule).filter(PaymentSchedule.credito_id == credito_id).first()
        
        monto_pagado = payment_amounts.monto_pagado if payment_amounts else Decimal('0.00')
        saldo_pendiente = credito.inversion - monto_pagado
        
        return CreditoSummary(
            credito_id=credito.credito_id,
            producto=credito.producto,
            inversion=credito.inversion,
            cuotas_totales=schedule_stats.total_cuotas,
            cuotas_pagadas=schedule_stats.cuotas_pagadas,
            cuotas_vencidas=schedule_stats.cuotas_vencidas,
            cuotas_pendientes=schedule_stats.cuotas_pendientes,
            monto_pagado=monto_pagado,
            saldo_pendiente=saldo_pendiente,
            estado=credito.estado
        )
    
    def get_next_payment(self, credito_id: int) -> Optional[PaymentScheduleResponse]:
        
        next_schedule = self.db.query(PaymentSchedule).filter(
            and_(
                PaymentSchedule.credito_id == credito_id,
                PaymentSchedule.estado.in_(['pendiente', 'parcial', 'vencida'])
            )
        ).order_by(PaymentSchedule.fecha_vencimiento).first()
        
        if not next_schedule:
            return None
        
        payments = self.db.query(Pago).filter(
            Pago.schedule_id == next_schedule.schedule_id
        ).all()
        
        monto_pagado = sum(p.monto for p in payments) if payments else Decimal('0.00')
        saldo_pendiente = next_schedule.valor_cuota - monto_pagado
        
        today = date.today()
        dias_vencimiento = (today - next_schedule.fecha_vencimiento).days
        
        return PaymentScheduleResponse(
            schedule_id=next_schedule.schedule_id,
            credito_id=next_schedule.credito_id,
            num_cuota=next_schedule.num_cuota,
            fecha_vencimiento=next_schedule.fecha_vencimiento,
            valor_cuota=next_schedule.valor_cuota,
            estado=next_schedule.estado,
            monto_pagado=monto_pagado,
            saldo_pendiente=saldo_pendiente,
            dias_vencimiento=dias_vencimiento,
            pagos=[PagoResponse.model_validate(p) for p in payments]
        )
    
    def create_payment(self, schedule_id: int, monto: Decimal, medio: str = None) -> Optional[PagoResponse]:
        
        schedule = self.db.query(PaymentSchedule).filter(
            PaymentSchedule.schedule_id == schedule_id
        ).first()
        
        if not schedule:
            return None
        
        new_payment = Pago(
            schedule_id=schedule_id,
            fecha_pago=datetime.now(),
            monto=monto,
            medio=medio
        )
        
        self.db.add(new_payment)
        self.db.flush()
        
        self._update_schedule_status(schedule_id)
        
        self.db.commit()
        
        return PagoResponse.model_validate(new_payment)
    
    def _update_schedule_status(self, schedule_id: int):
        
        schedule = self.db.query(PaymentSchedule).filter(
            PaymentSchedule.schedule_id == schedule_id
        ).first()
        
        if not schedule:
            return
        
        total_payments = self.db.query(
            func.coalesce(func.sum(Pago.monto), 0)
        ).filter(Pago.schedule_id == schedule_id).scalar()
        
        today = date.today()
        
        if total_payments >= schedule.valor_cuota:
            new_status = 'pagada'
        elif total_payments > 0:
            new_status = 'parcial'
        elif schedule.fecha_vencimiento < today:
            new_status = 'vencida'
        else:
            new_status = 'pendiente'
        
        schedule.estado = new_status
        self.db.add(schedule)
