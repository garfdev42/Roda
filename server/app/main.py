from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.api.endpoints import clientes, creditos, payments
from app.core.config import settings
from app.core.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting Roda API")
    print(f"Database: {settings.database_url.split('@')[-1]}")
    
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables verified")
    except Exception as e:
        print(f"Database connection issue: {e}")
    
    yield
    
    print("Shutting down Roda API")


app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "detail": str(exc) if settings.database_url.startswith("postgresql://localhost") else "Server error"
        }
    )


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Roda API",
        "version": settings.api_version
    }


@app.get("/")
async def root():
    return {
        "message": "Roda API - Sistema de cronogramas de pago para e-bikes y e-mopeds",
        "version": settings.api_version,
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health"
    }


app.include_router(
    clientes.router,
    prefix="/api/v1/clientes",
    tags=["Clientes"],
    responses={404: {"description": "Not found"}}
)

app.include_router(
    creditos.router,
    prefix="/api/v1/creditos",
    tags=["Créditos"],
    responses={404: {"description": "Not found"}}
)

app.include_router(
    payments.router,
    prefix="/api/v1/payments",
    tags=["Pagos"],
    responses={404: {"description": "Not found"}}
)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
