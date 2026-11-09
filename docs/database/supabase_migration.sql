-- ============================================================================
-- ARIMANA BAZAR · MIGRACIÓN UNIFICADA PARA SUPABASE (POSTGRESQL)
-- Incluye: Modelo Transaccional (OLTP) + Modelo Dimensional Data Warehouse (OLAP)
-- ============================================================================

-- Habilitar extensión criptográfica
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- PARTE 1: TIPOS ENUM TRANSACCIONALES
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_status') THEN
        CREATE TYPE entity_status AS ENUM ('active', 'inactive');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('Administrador', 'Vendedor', 'Cajero', 'Gerencia', 'Analista');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_kind') THEN
        CREATE TYPE customer_kind AS ENUM ('person', 'company');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
        CREATE TYPE document_type AS ENUM ('DNI', 'CE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sale_state') THEN
        CREATE TYPE sale_state AS ENUM ('draft', 'confirmed', 'voided');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'receipt_type') THEN
        CREATE TYPE receipt_type AS ENUM ('Boleta', 'Factura', 'Orden');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'receipt_state') THEN
        CREATE TYPE receipt_state AS ENUM ('draft', 'issued', 'voided');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'etl_state') THEN
        CREATE TYPE etl_state AS ENUM ('pending', 'running', 'completed', 'error');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'etl_level') THEN
        CREATE TYPE etl_level AS ENUM ('info', 'warning', 'error');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'etl_stage') THEN
        CREATE TYPE etl_stage AS ENUM ('extract', 'transform', 'load', 'validate');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_result') THEN
        CREATE TYPE audit_result AS ENUM ('success', 'error');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_type') THEN
        CREATE TYPE business_type AS ENUM ('sale', 'b2g-order');
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PARTE 2: TABLAS DEL MODELO TRANSACCIONAL (OLTP)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id              text PRIMARY KEY,
    username        text NOT NULL UNIQUE,
    display_name    text NOT NULL,
    role            user_role NOT NULL,
    employee_id     text,
    email           text,
    created_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS persons (
    id              text PRIMARY KEY,
    document_type   document_type NOT NULL,
    document_number text NOT NULL,
    first_name      text NOT NULL,
    last_name       text NOT NULL,
    email           text,
    phone           text,
    created_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_person_document UNIQUE (document_type, document_number)
);

CREATE TABLE IF NOT EXISTS companies (
    id              text PRIMARY KEY,
    ruc             text NOT NULL UNIQUE,
    legal_name      text NOT NULL,
    trade_name      text,
    email           text,
    phone           text,
    created_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS customers (
    id              text PRIMARY KEY,
    kind            customer_kind NOT NULL,
    person_id       text REFERENCES persons(id),
    company_id      text REFERENCES companies(id),
    created_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT false,
    CONSTRAINT customer_exactly_one_owner CHECK (
        (kind = 'person' AND person_id IS NOT NULL AND company_id IS NULL) OR
        (kind = 'company' AND company_id IS NOT NULL AND person_id IS NULL)
    ),
    CONSTRAINT uq_customer_person UNIQUE (person_id),
    CONSTRAINT uq_customer_company UNIQUE (company_id)
);

CREATE TABLE IF NOT EXISTS categories (
    id              text PRIMARY KEY,
    code            text NOT NULL UNIQUE,
    name            text NOT NULL,
    description     text,
    created_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS products (
    id              text PRIMARY KEY,
    code            text NOT NULL UNIQUE,
    name            text NOT NULL,
    category_id     text NOT NULL REFERENCES categories(id),
    description     text,
    unit_price      numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    created_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS branches (
    id              text PRIMARY KEY,
    code            text NOT NULL UNIQUE,
    name            text NOT NULL,
    address         text,
    phone           text,
    created_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS sellers (
    id              text PRIMARY KEY,
    document_type   document_type NOT NULL,
    document_number text NOT NULL,
    name            text NOT NULL,
    branch_id       text NOT NULL REFERENCES branches(id),
    email           text,
    phone           text,
    user_id         text REFERENCES users(id),
    created_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_seller_user UNIQUE (user_id),
    CONSTRAINT uq_seller_document UNIQUE (document_type, document_number)
);

CREATE TABLE IF NOT EXISTS payment_methods (
    id              text PRIMARY KEY,
    name            text NOT NULL UNIQUE,
    description     text,
    created_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS departments (
    id              text PRIMARY KEY,
    code            text NOT NULL UNIQUE,
    name            text NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS provinces (
    id              text PRIMARY KEY,
    code            text NOT NULL UNIQUE,
    name            text NOT NULL,
    department_id   text NOT NULL REFERENCES departments(id),
    created_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS districts (
    id              text PRIMARY KEY,
    code            text NOT NULL UNIQUE,
    name            text NOT NULL,
    province_id     text NOT NULL REFERENCES provinces(id),
    created_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS sales (
    id                  text PRIMARY KEY,
    sale_number         text NOT NULL UNIQUE,
    customer_id         text NOT NULL REFERENCES customers(id),
    seller_id           text NOT NULL REFERENCES sellers(id),
    branch_id           text NOT NULL REFERENCES branches(id),
    subtotal            numeric(12,2) NOT NULL CHECK (subtotal >= 0),
    total               numeric(12,2) NOT NULL CHECK (total >= 0),
    state               sale_state NOT NULL DEFAULT 'draft',
    sale_date           timestamptz NOT NULL DEFAULT clock_timestamp(),
    payment_method_id   text REFERENCES payment_methods(id),
    department_id       text REFERENCES departments(id),
    province_id         text REFERENCES provinces(id),
    district_id         text REFERENCES districts(id),
    created_by          text REFERENCES users(id),
    business_type       business_type NOT NULL DEFAULT 'sale',
    created_at          timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at          timestamptz NOT NULL DEFAULT clock_timestamp(),
    status              entity_status NOT NULL DEFAULT 'active',
    demo                boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS sale_lines (
    id              text PRIMARY KEY,
    sale_id         text NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id      text NOT NULL REFERENCES products(id),
    product_code    text,
    product_name    text NOT NULL,
    quantity        numeric(12,3) NOT NULL CHECK (quantity > 0),
    unit_price      numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    subtotal        numeric(12,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE TABLE IF NOT EXISTS receipts (
    id              text PRIMARY KEY,
    sale_id         text NOT NULL REFERENCES sales(id),
    type            receipt_type NOT NULL,
    series          text NOT NULL,
    number          text NOT NULL,
    state           receipt_state NOT NULL DEFAULT 'draft',
    issued_at       timestamptz,
    voided_at       timestamptz,
    created_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_receipt_series_number UNIQUE (series, number),
    CONSTRAINT uq_receipt_sale UNIQUE (sale_id)
);

-- Tablas operativas y analíticas de ETL
CREATE TABLE IF NOT EXISTS etl_executions (
    id                  text PRIMARY KEY,
    source_names        text[] NOT NULL,
    state               etl_state NOT NULL,
    started_at          timestamptz NOT NULL,
    completed_at        timestamptz,
    duration_seconds    numeric(8,3) NOT NULL DEFAULT 0,
    log                 jsonb NOT NULL DEFAULT '[]',
    extracted           integer NOT NULL DEFAULT 0,
    transformed         integer NOT NULL DEFAULT 0,
    loaded              integer NOT NULL DEFAULT 0,
    rejected            integer NOT NULL DEFAULT 0,
    created_at          timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at          timestamptz NOT NULL DEFAULT clock_timestamp(),
    status              entity_status NOT NULL DEFAULT 'active',
    demo                boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS consolidated_rows (
    id                  text PRIMARY KEY,
    source              text NOT NULL,
    source_key          text NOT NULL,
    dimension           text NOT NULL,
    amount              numeric(12,2) NOT NULL,
    date                date NOT NULL,
    business_type       business_type NOT NULL DEFAULT 'sale',
    origin              text NOT NULL,
    duplicate_of        text,
    transaction_key     text,
    product_name        text,
    category_name       text,
    company_name        text,
    seller_name         text,
    branch_name         text,
    department_name     text,
    province_name       text,
    district_name       text,
    created_at          timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at          timestamptz NOT NULL DEFAULT clock_timestamp(),
    status              entity_status NOT NULL DEFAULT 'active',
    demo                boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id          text PRIMARY KEY,
    actor_id    text NOT NULL REFERENCES users(id),
    action      text NOT NULL,
    target      text NOT NULL,
    result      audit_result NOT NULL,
    message     text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at  timestamptz NOT NULL DEFAULT clock_timestamp(),
    status      entity_status NOT NULL DEFAULT 'active',
    demo        boolean NOT NULL DEFAULT false
);

-- ----------------------------------------------------------------------------
-- PARTE 3: TABLAS DEL MODELO DIMENSIONAL / DATA WAREHOUSE (OLAP)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS dim_tiempo (
    id_tiempo           integer PRIMARY KEY,            -- YYYYMMDD
    fecha               date NOT NULL UNIQUE,
    anio                integer NOT NULL,
    trimestre           integer NOT NULL,
    nombre_trimestre    varchar(20) NOT NULL,
    mes                 integer NOT NULL,
    nombre_mes          varchar(30) NOT NULL,
    mes_anio            varchar(20) NOT NULL,
    semana              integer NOT NULL,
    dia_mes             integer NOT NULL,
    dia_semana          integer NOT NULL,
    nombre_dia_semana   varchar(30) NOT NULL,
    es_fin_de_semana    boolean NOT NULL,
    semestre            integer NOT NULL,
    nombre_semestre     varchar(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS dim_cliente (
    id_cliente          serial PRIMARY KEY,
    cod_cliente         varchar(64) NOT NULL UNIQUE,
    nombre_completo     varchar(250) NOT NULL,
    tipo_cliente        varchar(30) NOT NULL,
    tipo_documento      varchar(20) NOT NULL,
    numero_documento    varchar(50) NOT NULL,
    email               varchar(200),
    telefono            varchar(50),
    departamento        varchar(100),
    provincia           varchar(100),
    distrito            varchar(100),
    pais                varchar(50) NOT NULL DEFAULT 'Perú'
);

CREATE TABLE IF NOT EXISTS dim_producto (
    id_producto         serial PRIMARY KEY,
    cod_producto        varchar(64) NOT NULL UNIQUE,
    codigo_sku          varchar(60) NOT NULL,
    nombre_producto     varchar(250) NOT NULL,
    categoria           varchar(150) NOT NULL,
    descripcion         text,
    precio_referencial  numeric(14,2) NOT NULL DEFAULT 0,
    costo_referencial   numeric(14,2) NOT NULL DEFAULT 0,
    origen              varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS dim_sucursal (
    id_sucursal         serial PRIMARY KEY,
    cod_sucursal        varchar(64) NOT NULL UNIQUE,
    codigo_sucursal     varchar(50) NOT NULL,
    nombre_sucursal     varchar(150) NOT NULL,
    direccion           varchar(300),
    telefono            varchar(50),
    departamento        varchar(100),
    provincia           varchar(100),
    distrito            varchar(100),
    pais                varchar(50) NOT NULL DEFAULT 'Perú'
);

CREATE TABLE IF NOT EXISTS dim_empleado (
    id_empleado         serial PRIMARY KEY,
    cod_empleado        varchar(64) NOT NULL UNIQUE,
    nombre_completo     varchar(200) NOT NULL,
    tipo_documento      varchar(20) NOT NULL,
    numero_documento    varchar(50) NOT NULL,
    email               varchar(200),
    telefono            varchar(50),
    rol                 varchar(50) NOT NULL,
    sucursal_asignada   varchar(150)
);

CREATE TABLE IF NOT EXISTS fact_ventas (
    id_fact_venta       bigserial PRIMARY KEY,
    id_tiempo           integer NOT NULL REFERENCES dim_tiempo(id_tiempo),
    id_cliente          integer NOT NULL REFERENCES dim_cliente(id_cliente),
    id_producto         integer NOT NULL REFERENCES dim_producto(id_producto),
    id_sucursal         integer NOT NULL REFERENCES dim_sucursal(id_sucursal),
    id_empleado         integer NOT NULL REFERENCES dim_empleado(id_empleado),
    numero_transaccion  varchar(100) NOT NULL,
    tipo_negocio        varchar(30) NOT NULL,
    medio_pago          varchar(100),
    tipo_comprobante    varchar(20),
    fuente_origen       varchar(50) NOT NULL,
    cantidad            numeric(14,3) NOT NULL,
    precio_unitario     numeric(14,2) NOT NULL,
    descuento_unitario  numeric(14,2) NOT NULL DEFAULT 0,
    costo_unitario      numeric(14,2) NOT NULL DEFAULT 0,
    importe_total       numeric(14,2) NOT NULL,
    costo_total         numeric(14,2) NOT NULL,
    utilidad_bruta      numeric(14,2) NOT NULL,
    margen_porcentaje   numeric(8,4) NOT NULL
);

-- Índices analíticos para dashboards en Power BI y Supabase
CREATE INDEX IF NOT EXISTS idx_fact_tiempo ON fact_ventas(id_tiempo);
CREATE INDEX IF NOT EXISTS idx_fact_cliente ON fact_ventas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_fact_producto ON fact_ventas(id_producto);
CREATE INDEX IF NOT EXISTS idx_fact_sucursal ON fact_ventas(id_sucursal);
CREATE INDEX IF NOT EXISTS idx_fact_empleado ON fact_ventas(id_empleado);
CREATE INDEX IF NOT EXISTS idx_fact_negocio ON fact_ventas(tipo_negocio);
