# Roda - Sistema de Cronogramas de Pago

**Contexto de negocio:** Roda financia e‑bikes/e‑mopeds para repartidores, tenderos y usuarios de estratos 1–3. El cronograma de pagos es la vista más consultada por clientes y por cobranzas: debe ser claro, rápido y confiable.

Esta aplicación fullstack permite a un repartidor ver cuánto pagar, cuándo y si está al día o en mora, construida con una API limpia que consulta PostgreSQL local y una UI moderna con la paleta de colores Roda.

## Stack Tecnológico y Decisiones

### Backend (Python)

- **FastAPI + Uvicorn:** Framework asíncrono y server ASGI rápido
- **SQLAlchemy 2.0:** ORM declarativo, consultas optimizadas con índices
- **Pydantic v2:** Validación de entrada/salida y serialización segura
- **PostgreSQL:** Base relacional local con datos de ejemplo incluidos

### Frontend (React)

- **React + TypeScript:** Componentes tipados para UI consistente
- **Vite:** Build tool rápido para desarrollo
- **TanStack Query:** Cache inteligente para cronogramas (evita re‑fetch innecesario)
- **Tailwind CSS:** Estilos con paleta Roda: `#000000`, `#EBFF00`, `#C6F833`, `#B794F6`
- **Axios:** Cliente HTTP con interceptores para manejo de errores

## Instalación y Ejecución

### Prerrequisitos

- Python 3.11+
- PostgreSQL 15+
- Node.js 18+ (para frontend)
- Git

### 1. Backend (API)

```bash
git clone <repository-url>
cd server

# Entorno virtual
python -m venv .server
# Windows: .server\Scripts\activate
# Linux/Mac: source .server/bin/activate

pip install -r requirements.txt
```

### 2. Base de datos local

```sql
-- Conectarse como superusuario
CREATE DATABASE roda;
CREATE USER roda_user WITH PASSWORD 'roda_password';
GRANT ALL PRIVILEGES ON DATABASE roda TO roda_user;
```

```bash
# Ejecutar schema y seed data
psql -U roda_user -d roda
\i sql/01_schema_seed.sql
```

### 3. Variables de entorno (`server/.env`)

```env
DATABASE_URL=postgresql://roda_user:roda_password@localhost:5432/roda
API_TITLE="Roda API"
API_DESCRIPTION="Sistema de cronogramas de pago"
API_VERSION="1.0.0"
ALLOWED_ORIGINS=["http://localhost:5173"]
```

### 4. Ejecutar API

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: http://localhost:8000
- Docs: http://localhost:8000/docs

### 5. Frontend (opcional)

```bash
cd web
npm install
npm run dev
```

- UI: http://localhost:5173

## Arquitectura y Trade‑offs de Modelado

### Decisiones de Diseño de Datos

- **Normalización moderada:** Separación `Cliente` → `Credito` → `PaymentSchedule` → `Pago` para evitar duplicación y mantener consistencia
- **Estados como texto:** `'vigente'`, `'pagada'`, `'vencida'` son human‑readable y fáciles de debuggear vs. enums estrictos
- **Cálculos en tiempo real:** Saldos y estados se calculan con agregaciones SQL + índices vs. campos calculados cached
- **Montos como Decimal:** Evita errores de punto flotante en cálculos financieros críticos

### Performance y Consultas

```sql
-- Índices para cronogramas (ya incluidos en schema)
CREATE INDEX ix_ps_credito_cuota ON core.payment_schedule(credito_id, num_cuota);
CREATE INDEX ix_pagos_schedule_fecha ON core.pagos(schedule_id, fecha_pago);
```

- **Paginación offset/limit:** Simple y efectiva para datasets medianos
- **Joins optimizados:** Una consulta vs. N+1 queries para cronogramas completos
- **Agregaciones en PostgreSQL:** `SUM()`, `COUNT()`, `CASE` para cálculos vs. lógica en Python

### API Design

- **RESTful endpoints:** `/creditos/{id}/schedule` para cronogramas específicos
- **Respuestas paginadas:** Metadata incluido (`total`, `pages`, `has_next`)
- **Filtros query params:** `?page=1&size=20&estado=vigente`
- **Manejo de errores:** HTTP status codes + mensajes descriptivos

## Funcionalidades Implementadas

### Core (Cronogramas)

- Listado de créditos con paginación
- Detalle de cronograma completo por crédito
- Estados de cuotas (pendiente, pagada, vencida, parcial)
- Cálculo de saldos y próximos pagos

### Plus Features

- Filtros por producto, estado, ciudad
- Dashboard con analytics y métricas
- Búsqueda de clientes (con debouncing)
- UI responsiva con paleta Roda
- API documentada automáticamente

## Validación Rápida

```bash
# Health check
curl http://localhost:8000/health

# Cronograma específico
curl http://localhost:8000/api/v1/creditos/1/schedule

# Analytics dashboard
curl http://localhost:8000/api/v1/creditos/analytics/overview
```

## Estructura del Proyecto

```
/
├── server/          # Backend FastAPI
│   ├── app/         # Código de la aplicación
│   ├── sql/         # Schema y seed data
│   └── .env         # Variables de entorno
├── web/             # Frontend React
│   └── src/         # Componentes y páginas
└── README.md        # Este archivo
```

