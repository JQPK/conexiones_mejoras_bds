# Base de datos transaccional · Arimana Bazar

Esta carpeta documenta el modelo actualmente implementado por IndexedDB en `arimana-bazar-demo`. La aplicación usa almacenes de objetos sin índices declarados ni claves foráneas nativas; las relaciones, unicidad, estados y reglas de negocio se validan en TypeScript.

## Documentos

- [`schema.md`](./schema.md): almacenes, campos, tipos, claves, obligatoriedad y restricciones actuales.
- [`relationships.md`](./relationships.md): relaciones, cardinalidades y distinción entre implementación actual y diseño SQL propuesto.
- [`er.md`](./er.md): diagrama entidad-relación Mermaid.
- [`schema.sql`](./schema.sql): equivalente PostgreSQL normalizado para el modelo transaccional y la operación ETL.
- [`analytics.md`](./analytics.md): separación entre OLTP, consolidado ETL y consultas analíticas.

## Alcance

### Almacenes físicos IndexedDB

`users`, `customers`, `persons`, `companies`, `categories`, `products`, `branches`, `sellers`, `paymentMethods`, `sales`, `receipts`, `departments`, `provinces`, `districts`, `etlConnections`, `etlExecutions`, `auditLogs` y `consolidatedRows`.

La versión actual del esquema es la **4**. `database.ts` crea los almacenes faltantes durante `onupgradeneeded`, migra clientes del esquema anterior y normaliza datos históricos; `seedDemoData()` agrega la semilla sin borrar registros del usuario.

### Convenciones

- Todos los documentos tienen `id`, `createdAt`, `updatedAt`, `status` y `demo` por herencia de `BaseEntity`.
- `demo` es una marca técnica del modelo actual (`true`); no representa una etiqueta funcional de la interfaz.
- Las fechas se almacenan como cadenas ISO 8601.
- Los importes se almacenan como `number` y se redondean a dos decimales mediante `roundCurrency`.
- IndexedDB no implementa FK, `UNIQUE`, `CHECK` ni `NOT NULL`; esas reglas se controlan en los servicios.

## Fuente de verdad

La documentación se deriva de:

- `src/domain/models.ts`
- `src/domain/sales.ts`
- `src/domain/permissions.ts`
- `src/persistence/database.ts`
- `src/services/*Service.ts`
- `src/services/mockEtlApi.ts`
