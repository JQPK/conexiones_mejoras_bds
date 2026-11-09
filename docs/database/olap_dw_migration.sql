-- ============================================================================
-- ARIMANA_DW · DATA WAREHOUSE / BASE DE DATOS ANALÍTICA (OLAP)
-- Modelo Dimensional en Estrella para Power BI, Cubos y Dashboards
-- ============================================================================

-- 1. DIMENSIÓN TIEMPO
CREATE TABLE IF NOT EXISTS dim_tiempo (
    id_tiempo           integer PRIMARY KEY,            -- Clave YYYYMMDD
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

-- 2. DIMENSIÓN CLIENTE / CONTRATISTA
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

-- 3. DIMENSIÓN PRODUCTO
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

-- 4. DIMENSIÓN SUCURSAL
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

-- 5. DIMENSIÓN EMPLEADO / VENDEDOR
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

-- 6. TABLA DE HECHOS (FACT TABLE: ATÓMICA A NIVEL LÍNEA/ÍTEM)
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

-- 7. ÍNDICES ANALÍTICOS PARA POWER BI Y CONSULTAS OLAP
CREATE INDEX IF NOT EXISTS idx_fact_tiempo ON fact_ventas(id_tiempo);
CREATE INDEX IF NOT EXISTS idx_fact_cliente ON fact_ventas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_fact_producto ON fact_ventas(id_producto);
CREATE INDEX IF NOT EXISTS idx_fact_sucursal ON fact_ventas(id_sucursal);
CREATE INDEX IF NOT EXISTS idx_fact_empleado ON fact_ventas(id_empleado);
CREATE INDEX IF NOT EXISTS idx_fact_negocio ON fact_ventas(tipo_negocio);
