from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Cliente
from app.schemas.cliente import (
    ClienteResponse, 
    ClienteCreate, 
    ClienteUpdate,
    ClienteWithCreditos
)
from app.schemas.response import PaginatedResponse, APIResponse
from app.api.deps import PaginationParams

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[ClienteResponse])
async def get_clientes(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query(None, description="Search by name or document"),
    ciudad: str = Query(None, description="Filter by city"),
    db: Session = Depends(get_db)
):
    pagination = PaginationParams(page=page, size=size)
    
    query = db.query(Cliente)
    
    if search:
        query = query.filter(
            Cliente.nombre.ilike(f"%{search}%") |
            Cliente.num_doc.ilike(f"%{search}%")
        )
    
    if ciudad:
        query = query.filter(Cliente.ciudad.ilike(f"%{ciudad}%"))
    
    total = query.count()
    
    clientes = pagination.paginate_query(query).all()
    
    return pagination.create_pagination_response(clientes, total)


@router.get("/{cliente_id}", response_model=ClienteWithCreditos)
async def get_cliente(
    cliente_id: int,
    include_creditos: bool = Query(True, description="Include client credits"),
    db: Session = Depends(get_db)
):
    query = db.query(Cliente).filter(Cliente.cliente_id == cliente_id)
    
    if include_creditos:
        from sqlalchemy.orm import joinedload
        query = query.options(joinedload(Cliente.creditos))
    
    cliente = query.first()
    
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente not found")
    
    return cliente


@router.post("/", response_model=APIResponse[ClienteResponse])
async def create_cliente(
    cliente_data: ClienteCreate,
    db: Session = Depends(get_db)
):
    existing_cliente = db.query(Cliente).filter(
        Cliente.tipo_doc == cliente_data.tipo_doc,
        Cliente.num_doc == cliente_data.num_doc
    ).first()
    
    if existing_cliente:
        raise HTTPException(
            status_code=400,
            detail="Cliente with this document already exists"
        )
    
    db_cliente = Cliente(**cliente_data.model_dump())
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    
    return APIResponse(
        success=True,
        message="Cliente created successfully",
        data=db_cliente
    )


@router.put("/{cliente_id}", response_model=APIResponse[ClienteResponse])
async def update_cliente(
    cliente_id: int,
    cliente_update: ClienteUpdate,
    db: Session = Depends(get_db)
):
    cliente = db.query(Cliente).filter(Cliente.cliente_id == cliente_id).first()
    
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente not found")
    
    update_data = cliente_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cliente, field, value)
    
    db.commit()
    db.refresh(cliente)
    
    return APIResponse(
        success=True,
        message="Cliente updated successfully",
        data=cliente
    )


@router.delete("/{cliente_id}", response_model=APIResponse[None])
async def delete_cliente(
    cliente_id: int,
    db: Session = Depends(get_db)
):
    cliente = db.query(Cliente).filter(Cliente.cliente_id == cliente_id).first()
    
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente not found")
    
    if cliente.creditos:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete client with active credits"
        )
    
    db.delete(cliente)
    db.commit()
    
    return APIResponse(
        success=True,
        message="Cliente deleted successfully"
    )


@router.get("/{cliente_id}/creditos", response_model=List[dict])
async def get_cliente_creditos(
    cliente_id: int,
    db: Session = Depends(get_db)
):
    cliente = db.query(Cliente).filter(Cliente.cliente_id == cliente_id).first()
    
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente not found")
    
    return cliente.creditos
