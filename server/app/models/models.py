from sqlalchemy import Column, BigInteger, Text, Numeric, Integer, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Cliente(Base):
    __tablename__ = "clientes"
    __table_args__ = {"schema": "core"}
    
    cliente_id = Column(BigInteger, primary_key=True, index=True)
    tipo_doc = Column(Text, nullable=False)
    num_doc = Column(Text, nullable=False)
    nombre = Column(Text, nullable=False)
    ciudad = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    creditos = relationship("Credito", back_populates="cliente")


class Credito(Base):
    __tablename__ = "creditos"
    __table_args__ = {"schema": "core"}
    
    credito_id = Column(BigInteger, primary_key=True, index=True)
    cliente_id = Column(BigInteger, ForeignKey("core.clientes.cliente_id"), nullable=False)
    producto = Column(Text, nullable=False)
    inversion = Column(Numeric(12, 2), nullable=False)
    cuotas_totales = Column(Integer, nullable=False)
    tea = Column(Numeric(8, 6), nullable=False)
    fecha_desembolso = Column(Date, nullable=False)
    fecha_inicio_pago = Column(Date, nullable=False)
    estado = Column(Text, nullable=False, default="vigente")
    
    cliente = relationship("Cliente", back_populates="creditos")
    payment_schedule = relationship("PaymentSchedule", back_populates="credito")


class PaymentSchedule(Base):
    __tablename__ = "payment_schedule"
    __table_args__ = {"schema": "core"}
    
    schedule_id = Column(BigInteger, primary_key=True, index=True)
    credito_id = Column(BigInteger, ForeignKey("core.creditos.credito_id"), nullable=False)
    num_cuota = Column(Integer, nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)
    valor_cuota = Column(Numeric(12, 2), nullable=False)
    estado = Column(Text, nullable=False, default="pendiente")
    
    credito = relationship("Credito", back_populates="payment_schedule")
    pagos = relationship("Pago", back_populates="schedule")


class Pago(Base):
    __tablename__ = "pagos"
    __table_args__ = {"schema": "core"}
    
    pago_id = Column(BigInteger, primary_key=True, index=True)
    schedule_id = Column(BigInteger, ForeignKey("core.payment_schedule.schedule_id"), nullable=False)
    fecha_pago = Column(DateTime(timezone=True), nullable=False)
    monto = Column(Numeric(12, 2), nullable=False)
    medio = Column(Text)
    
    schedule = relationship("PaymentSchedule", back_populates="pagos")
