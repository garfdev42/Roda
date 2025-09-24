# Roda

Sistema simple para gestionar créditos y cronogramas de pago (e‑bikes y e‑mopeds). La meta es poder correrlo localmente rápido y entender las decisiones clave sin ruido.

## ¿Por qué FastAPI (y no Flask)?

- FastAPI: tipado fuerte con Pydantic, validación automática y documentación OpenAPI lista sin esfuerzo. Permite iterar rápido sin sacrificar orden.
- Flask: minimal y flexible, pero requiere más decisiones y librerías adicionales para lograr lo mismo (validación, esquemas, docs) y es más propenso a divergencias entre equipos.
- Trade‑off aceptado: FastAPI introduce Pydantic en el centro del diseño (curva de entrada), pero a cambio ganamos coherencia del contrato de la API y productividad.

## Librerías clave (y por qué)

- FastAPI + Uvicorn: framework asíncrono y server rápido para Python.
- SQLAlchemy 2.0: ORM maduro, declarativo, portable; evita SQL manual repetitivo.
- Pydantic v2: validación de entrada/salida y modelado claro del dominio.
- PostgreSQL: relacional, confiable, buen soporte para agregaciones y consultas.
- Frontend (opcional, carpeta `web/`): React + Vite + TanStack Query (data fetching), Tailwind (estilos), Axios (HTTP). Sirve para probar la API con una UI mínima.

## Requisitos

- Python 3.11+
- PostgreSQL 15+
- Git
- (Opcional UI) Node 18+

## Instalación rápida (backend)

1. Clonar y ubicarse en `server/`:

```bash
git clone <repository-url>
cd server
```

2. Entorno virtual e instalación de dependencias:

```bash
python -m venv .server
# Windows
.server\Scripts\activate
# Linux/Mac
source .server/bin/activate

pip install -r requirements.txt
```

3. Base de datos (nombre: roda)

```sql
-- Conectarse como superusuario
CREATE DATABASE roda;
CREATE USER roda_user WITH PASSWORD 'roda_password';
GRANT ALL PRIVILEGES ON DATABASE roda TO roda_user;
```

4. Variables de entorno (`server/.env`)

```env
DATABASE_URL=postgresql://roda_user:roda_password@localhost:5432/roda
API_TITLE="Roda API"
API_DESCRIPTION="Sistema de cronogramas de pago"
API_VERSION="1.0.0"
ALLOWED_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

5. Esquema y datos de ejemplo

```bash
psql -U roda_user -d roda
\i sql/01_schema_seed.sql
```

6. Ejecutar la API

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## (Opcional) UI local

1. En otra terminal:

```bash
cd web
npm install
npm run dev
```

2. La UI espera la API en `http://localhost:8000/api/v1` (coincide con la configuración por defecto del frontend).

## Decisiones de modelado (trade‑offs)

- Normalización moderada: se separan entidades `Cliente`, `Credito`, `PaymentSchedule` y `Pago` para mantener consultas legibles y evitar duplicación. Trade‑off: más joins, pero datos consistentes.
- Estados en texto controlado (p.ej., `vigente`, `cancelado`, `pagada`, `vencida`): humano‑legible y fácil de depurar. Trade‑off: menos rigidez que un enum estricto a nivel BD.
- Cálculos en tiempo real: agregados (totales, saldos, vencidos) se calculan en consultas con índices. Trade‑off: mayor costo por request vs. cache; se prioriza dato fresco.
- Paginación por offset/limit simple: suficientemente clara y soportada por SQLAlchemy. Trade‑off: en datasets enormes convendría keyset pagination.
- Monto como Decimal: evita errores de punto flotante en cálculos financieros. Trade‑off: más cuidado en serialización.

## Cómo validar rápido

```bash
# Health check
curl http://localhost:8000/health
# Algunos listados
curl "http://localhost:8000/api/v1/creditos/?page=1&size=5"
```

## Notas breves

- No se impone estructura estricta ni lista exhaustiva de endpoints en este README; la documentación viva está en `/docs`.
- El objetivo es poder correrlo local, leer este archivo en 3‑5 minutos y entender los porqués.
