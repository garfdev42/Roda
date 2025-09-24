# Roda API

Sistema de cronogramas de pago para e-bikes y e-mopeds desarrollado para la prueba técnica de Roda.

## 🎯 Descripción

API REST desarrollada en **FastAPI** que permite gestionar cronogramas de pago para el financiamiento de vehículos eléctricos (e-bikes y e-mopeds) dirigidos a repartidores, tenderos y usuarios de estratos 1-3.

### Características Principales

- ✅ **Cronogramas de pago** completos con cálculos automáticos
- ✅ **Gestión de clientes** y créditos
- ✅ **Procesamiento de pagos** con actualización de estados
- ✅ **Dashboard analytics** con métricas clave
- ✅ **Filtros y paginación** eficientes
- ✅ **API documentada** con Swagger/OpenAPI

## 🏗️ Arquitectura

### Stack Tecnológico

- **Backend**: FastAPI (Python 3.11+)
- **Base de Datos**: PostgreSQL 15+
- **ORM**: SQLAlchemy 2.0
- **Validación**: Pydantic v2
- **Documentación**: Swagger UI / ReDoc

### Estructura del Proyecto

```
server/
├── app/
│   ├── api/
│   │   ├── endpoints/          # Endpoints REST
│   │   │   ├── clientes.py     # Gestión de clientes
│   │   │   ├── creditos.py     # Gestión de créditos (CORE)
│   │   │   └── payments.py     # Procesamiento de pagos
│   │   └── deps.py             # Dependencias de la API
│   ├── core/
│   │   ├── config.py           # Configuración
│   │   └── database.py         # Conexión a BD
│   ├── models/
│   │   └── models.py           # Modelos SQLAlchemy
│   ├── schemas/
│   │   ├── cliente.py          # Schemas de clientes
│   │   ├── credito.py          # Schemas de créditos
│   │   ├── payment.py          # Schemas de pagos
│   │   └── response.py         # Schemas de respuesta
│   ├── services/
│   │   └── payment_service.py  # Lógica de negocio
│   └── main.py                 # Aplicación principal
├── sql/
│   └── 01_schema_seed.sql      # Schema y datos de prueba
├── requirements.txt            # Dependencias Python
└── README.md                   # Este archivo
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Python 3.11+
- PostgreSQL 15+
- Git

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd server
```

### 2. Crear Entorno Virtual

```bash
python -m venv .server
# Windows
.server\Scripts\activate
# Linux/Mac
source .server/bin/activate
```

### 3. Instalar Dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar Base de Datos

#### Crear la Base de Datos

```sql
-- Conectarse a PostgreSQL como superusuario
CREATE DATABASE roda_db;
CREATE USER roda_user WITH PASSWORD 'roda_password';
GRANT ALL PRIVILEGES ON DATABASE roda_db TO roda_user;
```

#### Ejecutar Schema y Seed Data

```bash
# Conectarse a la base de datos
psql -U postgres -d roda_db

# Ejecutar el archivo SQL
\i sql/01_schema_seed.sql
```

### 5. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/roda_db
API_TITLE="Roda API"
API_DESCRIPTION="Sistema de cronogramas de pago para e-bikes y e-mopeds"
API_VERSION="1.0.0"
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

### 6. Ejecutar la Aplicación

```bash
# Modo desarrollo
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# O directamente
python app/main.py
```

La API estará disponible en:

- **API**: http://localhost:8000
- **Documentación Swagger**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📊 Endpoints Principales

### Créditos (CORE FEATURE)

- `GET /api/v1/creditos/` - Lista paginada de créditos
- `GET /api/v1/creditos/{id}` - Detalle de crédito con cronograma
- `GET /api/v1/creditos/{id}/schedule` - Cronograma de pagos
- `GET /api/v1/creditos/{id}/summary` - Resumen del crédito
- `GET /api/v1/creditos/{id}/next-payment` - Próximo pago
- `GET /api/v1/creditos/analytics/overview` - Analytics dashboard

### Clientes

- `GET /api/v1/clientes/` - Lista paginada de clientes
- `GET /api/v1/clientes/{id}` - Detalle de cliente
- `POST /api/v1/clientes/` - Crear cliente
- `PUT /api/v1/clientes/{id}` - Actualizar cliente

### Pagos

- `GET /api/v1/payments/` - Lista paginada de pagos
- `POST /api/v1/payments/` - Procesar pago
- `GET /api/v1/payments/overdue` - Pagos vencidos
- `GET /api/v1/payments/analytics/summary` - Analytics de pagos

## 🎨 Decisiones de Arquitectura

### ¿Por qué FastAPI?

1. **Performance**: Uno de los frameworks más rápidos para Python
2. **Type Safety**: Integración nativa con Pydantic para validación
3. **Documentación Automática**: Swagger UI generado automáticamente
4. **Async Support**: Soporte nativo para operaciones asíncronas
5. **Ecosistema**: Gran comunidad y compatibilidad con SQLAlchemy

### Patrones Implementados

#### 1. **Arquitectura en Capas**

- **API Layer**: Endpoints y validación de entrada
- **Service Layer**: Lógica de negocio (PaymentService)
- **Data Layer**: Modelos SQLAlchemy y acceso a datos

#### 2. **Repository Pattern (Implícito)**

- Servicios encapsulan la lógica de acceso a datos
- Separación clara entre modelos y lógica de negocio

#### 3. **Dependency Injection**

- Inyección de dependencias de FastAPI para DB sessions
- Reutilización de código y testing simplificado

### Optimizaciones de Performance

#### 1. **Consultas Eficientes**

```python
# Uso de índices definidos en el schema
CREATE INDEX ix_ps_credito_cuota ON core.payment_schedule(credito_id, num_cuota);
CREATE INDEX ix_pagos_schedule_fecha ON core.pagos(schedule_id, fecha_pago);

# Consultas optimizadas con joins
query = db.query(Credito).join(Cliente)  # Evita N+1 queries
```

#### 2. **Paginación Inteligente**

```python
class PaginationParams:
    def paginate_query(self, query):
        return query.offset(self.offset).limit(self.limit)
```

#### 3. **Cálculos en Base de Datos**

```python
# Agregaciones en PostgreSQL en lugar de Python
schedule_stats = db.query(
    func.count(PaymentSchedule.schedule_id).label('total_cuotas'),
    func.count(func.case([(PaymentSchedule.estado == 'pagada', 1)])).label('cuotas_pagadas')
).filter(PaymentSchedule.credito_id == credito_id).first()
```

## 🔧 Trade-offs y Decisiones

### 1. **Cálculos en Tiempo Real vs Caching**

**Decisión**: Cálculos en tiempo real

- ✅ **Pro**: Datos siempre actualizados, crucial para pagos
- ❌ **Con**: Más carga en cada request
- **Mitigación**: Índices optimizados, consultas eficientes

### 2. **Validación Estricta vs Flexibilidad**

**Decisión**: Validación estricta con Pydantic

- ✅ **Pro**: Previene errores, API predecible
- ❌ **Con**: Menos flexibilidad para casos edge
- **Mitigación**: Schemas opcionales para updates

### 3. **Transacciones vs Performance**

**Decisión**: Transacciones para operaciones críticas

```python
def create_payment(self, schedule_id: int, monto: Decimal):
    # Transacción automática para consistencia
    self.db.add(new_payment)
    self._update_schedule_status(schedule_id)
    self.db.commit()  # Rollback automático en error
```

## 🧪 Testing y Validación

### Datos de Prueba

El archivo `sql/01_schema_seed.sql` incluye:

- 10 clientes distribuidos en 4 ciudades
- 20 créditos (e-bikes y e-mopeds)
- ~240 cuotas programadas (6-12 meses)
- ~168 pagos con diferentes estados

### Endpoints de Testing

```bash
# Health check
curl http://localhost:8000/health

# Listar créditos
curl "http://localhost:8000/api/v1/creditos/?page=1&size=5"

# Cronograma específico
curl "http://localhost:8000/api/v1/creditos/1/schedule"

# Dashboard analytics
curl "http://localhost:8000/api/v1/creditos/analytics/overview"
```

## 🚀 Próximas Mejoras

### Funcionalidades Plus Implementables

1. **Exportar cronogramas** (PDF, Excel)
2. **Filtros avanzados** (rango de fechas, montos)
3. **Notificaciones** de vencimientos
4. **Dark mode** support
5. **Gráficos** de comportamiento de pago

### Optimizaciones Técnicas

1. **Redis caching** para consultas frecuentes
2. **Background tasks** para cálculos pesados
3. **Rate limiting** para endpoints públicos
4. **Database migrations** con Alembic
5. **Unit tests** con pytest

## 📝 Notas de Desarrollo

### Comandos Útiles

```bash
# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
uvicorn app.main:app --reload

# Ver logs
uvicorn app.main:app --reload --log-level debug

# Generar requirements
pip freeze > requirements.txt
```

### Estructura de Datos Clave

- **Cliente**: Información básica del usuario
- **Crédito**: Financiamiento del vehículo
- **PaymentSchedule**: Cronograma de cuotas
- **Pago**: Registro de pagos realizados

---

**Desarrollado por**: [Tu Nombre]  
**Tiempo de desarrollo**: 6-8 horas  
**Fecha**: Septiembre 2024  
**Versión**: 1.0.0
