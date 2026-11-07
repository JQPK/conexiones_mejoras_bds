-- Arimana Bazar · equivalente PostgreSQL del modelo transaccional
--
-- Este script es una propuesta normalizada. IndexedDB no ejecuta estas FKs,
-- UNIQUE ni CHECK; actualmente las reglas equivalentes viven en TypeScript.
-- consolidatedRows se excluye deliberadamente: es salida ETL/analítica, no OLTP.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE entity_status AS ENUM ('active', 'inactive');
CREATE TYPE user_role AS ENUM ('Administrador', 'Vendedor', 'Cajero', 'Gerencia', 'Analista');
CREATE TYPE customer_kind AS ENUM ('person', 'company');
CREATE TYPE document_type AS ENUM ('DNI', 'CE');
CREATE TYPE sale_state AS ENUM ('draft', 'confirmed', 'voided');
CREATE TYPE receipt_type AS ENUM ('Boleta', 'Factura');
CREATE TYPE receipt_state AS ENUM ('draft', 'issued', 'voided');
CREATE TYPE etl_state AS ENUM ('pending', 'running', 'completed', 'error');
CREATE TYPE etl_level AS ENUM ('info', 'warning', 'error');
CREATE TYPE etl_stage AS ENUM ('extract', 'transform', 'load', 'validate');
CREATE TYPE audit_result AS ENUM ('success', 'error');
CREATE TYPE business_type AS ENUM ('sale', 'b2g-order');

-- En IndexedDB todas las entidades comparten estas columnas.
-- En PostgreSQL se repiten para mantener tablas independientes y consultables.

CREATE TABLE users (
    id              text PRIMARY KEY,
    username        text NOT NULL UNIQUE,
    display_name    text NOT NULL,
    role            user_role NOT NULL,
    employee_id     text,
    email           text,
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL,
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT true
);

CREATE TABLE persons (
    id              text PRIMARY KEY,
    document_type   document_type NOT NULL,
    document_number text NOT NULL,
    first_name      text NOT NULL,
    last_name       text NOT NULL,
    email           text,
    phone           text,
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL,
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT true,
    CONSTRAINT uq_person_document UNIQUE (document_type, document_number)
);

CREATE TABLE companies (
    id              text PRIMARY KEY,
    ruc             text NOT NULL UNIQUE,
    legal_name      text NOT NULL,
    trade_name      text,
    email           text,
    phone           text,
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL,
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT true
);

CREATE TABLE customers (
    id              text PRIMARY KEY,
    kind            customer_kind NOT NULL,
    person_id       text REFERENCES persons(id),
    company_id      text REFERENCES companies(id),
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL,
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT true,
    CONSTRAINT customer_exactly_one_owner CHECK (
        (kind = 'person' AND person_id IS NOT NULL AND company_id IS NULL) OR
        (kind = 'company' AND company_id IS NOT NULL AND person_id IS NULL)
    ),
    CONSTRAINT uq_customer_person UNIQUE (person_id),
    CONSTRAINT uq_customer_company UNIQUE (company_id)
);

CREATE TABLE categories (
    id              text PRIMARY KEY,
    code            text NOT NULL UNIQUE,
    name            text NOT NULL,
    description     text,
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL,
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT true
);

CREATE TABLE products (
    id              text PRIMARY KEY,
    code            text NOT NULL UNIQUE,
    name            text NOT NULL,
    category_id     text NOT NULL REFERENCES categories(id),
    description     text,
    unit_price      numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL,
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT true
);

CREATE TABLE branches (
    id              text PRIMARY KEY,
    code            text NOT NULL UNIQUE,
    name            text NOT NULL,
    address         text,
    phone           text,
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL,
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT true
);

CREATE TABLE sellers (
    id              text PRIMARY KEY,
    document_type   document_type NOT NULL,
    document_number text NOT NULL,
    name            text NOT NULL,
    branch_id       text NOT NULL REFERENCES branches(id),
    email           text,
    phone           text,
    user_id         text REFERENCES users(id),
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL,
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT true,
    CONSTRAINT uq_seller_document UNIQUE (document_type, document_number),
    CONSTRAINT uq_seller_user UNIQUE (user_id)
);

CREATE TABLE payment_methods (
    id              text PRIMARY KEY,
    name            text NOT NULL,
    description     text,
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL,
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT true
);

CREATE TABLE departments (
    id              text PRIMARY KEY,
    code            text NOT NULL UNIQUE,
    name            text NOT NULL,
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL,
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT true
);

CREATE TABLE provinces (
    id              text PRIMARY KEY,
    code            text NOT NULL UNIQUE,
    name            text NOT NULL,
    department_id   text NOT NULL REFERENCES departments(id),
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL,
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT true
);

CREATE TABLE districts (
    id              text PRIMARY KEY,
    code            text NOT NULL UNIQUE,
    name            text NOT NULL,
    province_id     text NOT NULL REFERENCES provinces(id),
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL,
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT true
);

-- receipt_id se agrega como FK después de crear receipts porque el modelo actual
-- mantiene la referencia en ambos sentidos (sales.receiptId y receipts.saleId).
CREATE TABLE sales (
    id                  text PRIMARY KEY,
    sale_number         text NOT NULL UNIQUE,
    customer_id         text NOT NULL REFERENCES customers(id),
    seller_id           text NOT NULL REFERENCES sellers(id),
    branch_id           text NOT NULL REFERENCES branches(id),
    subtotal            numeric(12,2) NOT NULL CHECK (subtotal >= 0),
    total               numeric(12,2) NOT NULL CHECK (total >= 0),
    state               sale_state NOT NULL,
    sale_date           timestamptz NOT NULL,
    payment_method_id   text REFERENCES payment_methods(id),
    department_id       text REFERENCES departments(id),
    province_id         text REFERENCES provinces(id),
    district_id         text REFERENCES districts(id),
    receipt_id          text,
    created_by          text REFERENCES users(id),
    created_at          timestamptz NOT NULL,
    updated_at          timestamptz NOT NULL,
    status              entity_status NOT NULL DEFAULT 'active',
    demo                boolean NOT NULL DEFAULT true,
    CONSTRAINT sale_total_matches_subtotal CHECK (total = subtotal)
);

CREATE TABLE sale_lines (
    id              text PRIMARY KEY,
    sale_id         text NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id      text NOT NULL REFERENCES products(id),
    product_code    text,
    product_name    text NOT NULL,
    quantity        numeric(12,3) NOT NULL CHECK (quantity > 0),
    unit_price      numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    subtotal        numeric(12,2) NOT NULL CHECK (subtotal >= 0),
    CONSTRAINT sale_line_amount CHECK (subtotal = round(quantity * unit_price, 2))
);

CREATE TABLE receipts (
    id              text PRIMARY KEY,
    sale_id         text NOT NULL UNIQUE REFERENCES sales(id),
    type            receipt_type NOT NULL,
    series          text NOT NULL,
    number          text NOT NULL DEFAULT '',
    state           receipt_state NOT NULL,
    issued_at       timestamptz,
    voided_at       timestamptz,
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL,
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT true,
    CONSTRAINT receipt_series_prefix CHECK (
        (type = 'Boleta' AND series LIKE 'B%') OR
        (type = 'Factura' AND series LIKE 'F%')
    )
);

ALTER TABLE sales
    ADD CONSTRAINT fk_sales_receipt FOREIGN KEY (receipt_id) REFERENCES receipts(id)
    DEFERRABLE INITIALLY DEFERRED;

-- Catálogo lógico equivalente a ETL_SOURCE_NAMES. No existe como object store
-- independiente en IndexedDB; se materializa aquí para proteger el catálogo.
CREATE TABLE etl_sources (
    name text PRIMARY KEY
);

INSERT INTO etl_sources(name) VALUES
    ('siga_1646'), ('SamarImportadora'), ('DW_SamarImportadora'),
    ('CASTILLONV2'), ('BD_CASTILLON_VETERINARIA'), ('ARIMANA_OLTP');

CREATE TABLE etl_connections (
    id                      text PRIMARY KEY,
    name                    text NOT NULL UNIQUE REFERENCES etl_sources(name),
    server                  text NOT NULL,
    engine                  text NOT NULL,
    database_name           text NOT NULL,
    username                text NOT NULL,
    credential_configured   boolean NOT NULL DEFAULT false,
    created_at              timestamptz NOT NULL,
    updated_at              timestamptz NOT NULL,
    status                  entity_status NOT NULL DEFAULT 'active',
    demo                    boolean NOT NULL DEFAULT true
    -- No existe columna password por diseño.
);

CREATE TABLE etl_executions (
    id                  text PRIMARY KEY,
    state               etl_state NOT NULL,
    started_at          timestamptz NOT NULL,
    completed_at        timestamptz,
    duration_seconds    numeric(12,3) NOT NULL DEFAULT 0,
    log                 text[] NOT NULL DEFAULT '{}',
    extracted           integer NOT NULL DEFAULT 0,
    transformed         integer NOT NULL DEFAULT 0,
    loaded              integer NOT NULL DEFAULT 0,
    rejected            integer NOT NULL DEFAULT 0,
    created_at          timestamptz NOT NULL,
    updated_at          timestamptz NOT NULL,
    status              entity_status NOT NULL DEFAULT 'active',
    demo                boolean NOT NULL DEFAULT true
);

CREATE TABLE etl_execution_sources (
    execution_id       text NOT NULL REFERENCES etl_executions(id) ON DELETE CASCADE,
    source              text NOT NULL REFERENCES etl_sources(name),
    PRIMARY KEY (execution_id, source)
);

CREATE TABLE etl_log_events (
    id                  text PRIMARY KEY,
    execution_id        text NOT NULL REFERENCES etl_executions(id) ON DELETE CASCADE,
    event_timestamp     timestamptz NOT NULL,
    level               etl_level NOT NULL,
    source              text REFERENCES etl_sources(name),
    stage               etl_stage,
    message             text NOT NULL
);

CREATE TABLE etl_source_metrics (
    execution_id        text NOT NULL REFERENCES etl_executions(id) ON DELETE CASCADE,
    source              text NOT NULL REFERENCES etl_sources(name),
    extracted           integer NOT NULL DEFAULT 0,
    transformed         integer NOT NULL DEFAULT 0,
    loaded              integer NOT NULL DEFAULT 0,
    rejected            integer NOT NULL DEFAULT 0,
    duration_seconds    numeric(12,3) NOT NULL DEFAULT 0,
    integrity_passed   boolean NOT NULL,
    PRIMARY KEY (execution_id, source)
);

CREATE TABLE etl_stage_errors (
    id                  text PRIMARY KEY,
    execution_id        text NOT NULL REFERENCES etl_executions(id) ON DELETE CASCADE,
    source              text NOT NULL REFERENCES etl_sources(name),
    stage               etl_stage NOT NULL,
    message             text NOT NULL
);

CREATE TABLE etl_load_validations (
    execution_id        text PRIMARY KEY REFERENCES etl_executions(id) ON DELETE CASCADE,
    total_rows          integer NOT NULL,
    unique_source_keys  integer NOT NULL,
    orphan_rows         integer NOT NULL,
    passed              boolean NOT NULL,
    checked_at          timestamptz NOT NULL
);

CREATE TABLE audit_logs (
    id              text PRIMARY KEY,
    actor_id        text NOT NULL REFERENCES users(id),
    action          text NOT NULL,
    target          text NOT NULL,
    result          audit_result NOT NULL,
    message         text NOT NULL,
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL,
    status          entity_status NOT NULL DEFAULT 'active',
    demo            boolean NOT NULL DEFAULT true
);

CREATE INDEX ix_sales_date ON sales(sale_date);
CREATE INDEX ix_sales_customer ON sales(customer_id);
CREATE INDEX ix_sales_seller ON sales(seller_id);
CREATE INDEX ix_audit_target ON audit_logs(target);
CREATE INDEX ix_etl_executions_started ON etl_executions(started_at DESC);
