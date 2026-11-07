# Diccionario de datos

## Convenciones de lectura

`Sí` y `No` indican obligatoriedad en las interfaces TypeScript actuales. `PK` es clave primaria del object store (`id`). `FK` es una referencia lógica; IndexedDB no la aplica físicamente. Todas las entidades que extienden `BaseEntity` incluyen además:

| Campo | Tipo actual | PK | Obligatorio | Descripción |
|---|---|---:|---:|---|
| `id` | `string` | Sí | Sí | Identificador estable del registro. |
| `createdAt` | `string` ISO 8601 | No | Sí | Fecha de creación. |
| `updatedAt` | `string` ISO 8601 | No | Sí | Fecha de última actualización. |
| `status` | `"active" \| "inactive"` | No | Sí | Estado lógico; no siempre implica borrado físico. |
| `demo` | `true` | No | Sí | Marca técnica presente en el modelo actual. |

## `users`

| Campo | Tipo | PK | FK | Obligatorio | Descripción |
|---|---|---:|---|---:|---|
| `username` | `string` | No | — | Nombre usado para iniciar sesión; se valida formato y unicidad en servicio. |
| `displayName` | `string` | No | — | Nombre visible de la cuenta. |
| `role` | `UserRole` | No | — | `Administrador`, `Vendedor`, `Cajero`, `Gerencia` o `Analista`. |
| `employeeId` | `string` | No | lógico a `sellers.id` | Identificador laboral opcional. |
| `email` | `string` | No | — | Correo opcional. |

**Roles y permisos:** no existen almacenes `roles` ni `permissions`. `UserRole` y el mapa `grants` de `src/domain/permissions.ts` son constantes de aplicación. Los permisos actuales son `users:manage`, `customers:read`, `customers:write`, `catalog:read`, `catalog:write`, `sales:read`, `sales:write`, `payments:read`, `payments:write`, `organization:read`, `organization:write`, `etl:admin` y `analytics:read`.

## `persons`

| Campo | Tipo | PK | FK | Obligatorio | Descripción |
|---|---|---:|---|---:|---|
| `documentType` | `"DNI" \| "CE"` | No | — | Sí | Tipo de identificación. |
| `documentNumber` | `string` | No | — | Sí | Número validado según tipo; se usa para evitar duplicados. |
| `firstName` | `string` | No | — | Sí | Nombres de la persona. |
| `lastName` | `string` | No | — | Sí | Apellidos. |
| `email` | `string` | No | — | No | Correo opcional. |
| `phone` | `string` | No | — | No | Teléfono opcional. |

## `companies`

| Campo | Tipo | PK | FK | Obligatorio | Descripción |
|---|---|---:|---|---:|---|
| `ruc` | `string` | No | — | Sí | RUC validado y único por servicio. |
| `legalName` | `string` | No | — | Sí | Razón social. |
| `tradeName` | `string` | No | — | No | Nombre comercial. |
| `email` | `string` | No | — | No | Correo corporativo. |
| `phone` | `string` | No | — | No | Teléfono corporativo. |

## `customers`

| Campo | Tipo | PK | FK | Obligatorio | Descripción |
|---|---|---:|---|---:|---|
| `kind` | `"person" \| "company"` | No | — | Sí | Determina la entidad relacionada. |
| `personId` | `string` | No | `persons.id` | Condicional | Obligatorio cuando `kind = person`; excluyente de `companyId`. |
| `companyId` | `string` | No | `companies.id` | Condicional | Obligatorio cuando `kind = company`; excluyente de `personId`. |

## `categories`

| Campo | Tipo | PK | FK | Obligatorio | Descripción |
|---|---|---:|---|---:|---|
| `code` | `string` | No | — | Sí | Código comercial único validado por servicio. |
| `name` | `string` | No | — | Sí | Nombre de categoría. |
| `description` | `string` | No | — | No | Descripción opcional. |

## `products`

| Campo | Tipo | PK | FK | Obligatorio | Descripción |
|---|---|---:|---|---:|---|
| `code` | `string` | No | — | Sí | Código comercial único. |
| `name` | `string` | No | — | Sí | Nombre del producto. |
| `categoryId` | `string` | No | `categories.id` | Sí | Categoría activa del producto. |
| `description` | `string` | No | — | No | Descripción comercial. |
| `unitPrice` | `number` | No | — | Sí | Precio unitario no negativo, con hasta dos decimales. |

## `branches`

| Campo | Tipo | PK | FK | Obligatorio | Descripción |
|---|---|---:|---|---:|---|
| `code` | `string` | No | — | Sí | Código único de sucursal. |
| `name` | `string` | No | — | Sí | Nombre comercial. |
| `address` | `string` | No | — | No | Dirección. |
| `phone` | `string` | No | — | No | Teléfono. |

## `sellers`

| Campo | Tipo | PK | FK | Obligatorio | Descripción |
|---|---|---:|---|---:|---|
| `documentType` | `"DNI" \| "CE"` | No | — | Sí | Tipo de identificación. |
| `documentNumber` | `string` | No | — | Sí | Documento único por tipo. |
| `name` | `string` | No | — | Sí | Nombre completo visible. |
| `branchId` | `string` | No | `branches.id` | Sí | Sucursal activa asignada. |
| `email` | `string` | No | — | No | Correo. |
| `phone` | `string` | No | — | No | Teléfono. |
| `userId` | `string` | No | `users.id` | No | Cuenta asociada; debe tener rol Vendedor. |

## `paymentMethods`

| Campo | Tipo | PK | FK | Obligatorio | Descripción |
|---|---|---:|---|---:|---|
| `name` | `string` | No | — | Sí | Nombre del medio de pago. |
| `description` | `string` | No | — | No | Descripción operativa. |

## `sales`

| Campo | Tipo | PK | FK | Obligatorio | Descripción |
|---|---|---:|---|---:|---|
| `saleNumber` | `string` | No | — | Sí | Número de venta generado con formato `V-######`. |
| `customerId` | `string` | No | `customers.id` | Sí | Cliente comprador. |
| `sellerId` | `string` | No | `sellers.id` | Sí | Vendedor responsable. |
| `branchId` | `string` | No | `branches.id` | Sí | Sucursal; debe coincidir con la del vendedor. |
| `lines` | `SaleLine[]` | No | ver `sale_lines` | Sí | Detalle embebido de la venta en IndexedDB. |
| `subtotal` | `number` | No | — | Sí | Suma redondeada de subtotales de línea. |
| `total` | `number` | No | — | Sí | Total calculado por `calculateSaleTotal`. |
| `state` | `"draft" \| "confirmed" \| "voided"` | No | — | Sí | Estado comercial. |
| `saleDate` | `string` ISO 8601 | No | — | Sí | Fecha y hora de la operación. |
| `paymentMethodId` | `string` | No | `paymentMethods.id` | No | Medio de pago; requerido para confirmar. |
| `departmentId` | `string` | No | `departments.id` | No | Departamento de la ubicación de compra. |
| `provinceId` | `string` | No | `provinces.id` | No | Provincia dependiente del departamento. |
| `districtId` | `string` | No | `districts.id` | No | Distrito dependiente de la provincia. |
| `receiptId` | `string` | No | `receipts.id` | No | Comprobante asociado. |
| `createdBy` | `string` | No | lógico a `users.id` | No | Usuario que creó el registro. |

### `SaleLine` embebido / `sale_lines` normalizado

| Campo | Tipo | PK | FK | Obligatorio | Descripción |
|---|---|---:|---|---:|---|
| `id` | `string` | Sí en SQL | — | Sí | Identificador de línea. |
| `saleId` | `string` | No | `sales.id` | Sí en SQL | FK propuesta para normalizar el arreglo. |
| `productId` | `string` | No | `products.id` | Sí | Producto vendido. |
| `productCode` | `string` | No | — | No | Copia histórica del código. |
| `productName` | `string` | No | — | Sí | Copia histórica del nombre. |
| `quantity` | `number` | No | — | Sí | Cantidad vendida. |
| `unitPrice` | `number` | No | — | Sí | Precio aplicado en la venta. |
| `subtotal` | `number` | No | — | Sí | `quantity * unitPrice`, redondeado. |

## `receipts`

| Campo | Tipo | PK | FK | Obligatorio | Descripción |
|---|---|---:|---|---:|---|
| `saleId` | `string` | No | `sales.id` | Sí | Venta a la que pertenece. |
| `type` | `"Boleta" \| "Factura"` | No | — | Sí | Tipo de comprobante. |
| `series` | `string` | No | — | Sí | `B###` para boleta o `F###` para factura. |
| `number` | `string` | No | — | Sí | Número; vacío mientras está en borrador. |
| `state` | `"draft" \| "issued" \| "voided"` | No | — | Sí | Estado del comprobante. |
| `issuedAt` | `string` ISO 8601 | No | — | No | Fecha de emisión. |
| `voidedAt` | `string` ISO 8601 | No | — | No | Fecha de anulación. |

## Ubicación geográfica

### `departments`

| Campo | Tipo | PK | FK | Obligatorio | Descripción |
|---|---|---:|---|---:|---|
| `code` | `string` | No | — | Sí | Código geográfico único en la semilla. |
| `name` | `string` | No | — | Sí | Departamento. |

### `provinces`

| Campo | Tipo | PK | FK | Obligatorio | Descripción |
|---|---|---:|---|---:|---|
| `code` | `string` | No | — | Sí | Código de provincia. |
| `name` | `string` | No | — | Sí | Nombre de provincia. |
| `departmentId` | `string` | No | `departments.id` | Sí | Departamento al que pertenece. |

### `districts`

| Campo | Tipo | PK | FK | Obligatorio | Descripción |
|---|---|---:|---|---:|---|
| `code` | `string` | No | — | Sí | Código de distrito. |
| `name` | `string` | No | — | Sí | Nombre de distrito. |
| `provinceId` | `string` | No | `provinces.id` | Sí | Provincia a la que pertenece. |

## `etlConnections`

| Campo | Tipo | PK | FK | Obligatorio | Descripción |
|---|---|---:|---|---:|---|
| `name` | `EtlSourceName` | No | catálogo lógico | Sí | Una de las seis fuentes autorizadas. |
| `server` | `string` | No | — | Sí | Servidor declarado. |
| `engine` | `string` | No | — | Sí | Motor declarado. |
| `database` | `string` | No | — | Sí | Base declarada. |
| `username` | `string` | No | — | Sí | Usuario técnico declarado. |
| `credentialConfigured` | `boolean` | No | — | Sí | Indica si se configuró una credencial; nunca se persiste la contraseña. |

Fuentes válidas: `siga_1646`, `SamarImportadora`, `DW_SamarImportadora`, `CASTILLONV2`, `BD_CASTILLON_VETERINARIA`, `ARIMANA_OLTP`.

## `etlExecutions`

| Campo | Tipo | PK | FK | Obligatorio | Descripción |
|---|---|---:|---|---:|---|
| `sourceNames` | `EtlSourceName[]` | No | catálogo lógico | Sí | Fuentes seleccionadas. |
| `state` | `"pending" \| "running" \| "completed" \| "error"` | No | — | Sí | Estado de la ejecución. |
| `startedAt` | `string` ISO 8601 | No | — | Sí | Inicio o creación de la ejecución. |
| `completedAt` | `string` ISO 8601 | No | — | No | Fin cuando termina. |
| `durationSeconds` | `number` | No | — | Sí | Duración calculada. |
| `log` | `string[]` | No | — | Sí | Mensajes legibles. |
| `logEvents` | `EtlLogEvent[]` | No | ver `etl_log_events` | No | Eventos estructurados. |
| `extracted` | `number` | No | — | Sí | Total extraído. |
| `transformed` | `number` | No | — | Sí | Total transformado. |
| `loaded` | `number` | No | — | Sí | Total cargado. |
| `rejected` | `number` | No | — | Sí | Total rechazado. |
| `sourceMetrics` | `EtlSourceMetric[]` | No | ver `etl_source_metrics` | Sí | Métricas por fuente. |
| `errors` | `EtlStageError[]` | No | ver `etl_stage_errors` | Sí | Errores por etapa. |
| `validation` | `EtlLoadValidation` | No | ver `etl_load_validations` | No | Resultado de integridad. |

## `auditLogs`

| Campo | Tipo | PK | FK | Obligatorio | Descripción |
|---|---|---:|---|---:|---|
| `actorId` | `string` | No | lógico a `users.id` | Sí | Usuario que ejecutó la acción. |
| `action` | `string` | No | — | Sí | Código de acción, por ejemplo `SALE_CONFIRMED`. |
| `target` | `string` | No | polimórfica | Sí | ID o nombre del recurso afectado. |
| `result` | `"success" \| "error"` | No | — | Sí | Resultado. |
| `message` | `string` | No | — | Sí | Detalle legible. |

## Estructuras ETL embebidas

Estas estructuras no son almacenes IndexedDB independientes, pero son parte real de `etlExecutions`.

| Estructura | Campos | Obligatorios | Descripción |
|---|---|---|---|
| `EtlLogEvent` | `id: string`, `timestamp: string`, `level`, `source?`, `stage?`, `message: string` | `id`, `timestamp`, `level`, `message` | Evento de extracción, transformación, carga o validación. |
| `EtlSourceMetric` | `source`, `extracted`, `transformed`, `loaded`, `rejected`, `durationSeconds`, `integrityPassed` | Todos | Resultado por fuente. |
| `EtlStageError` | `source`, `stage`, `message` | Todos | Error asociado a una etapa. |
| `EtlLoadValidation` | `totalRows`, `uniqueSourceKeys`, `orphanRows`, `passed`, `checkedAt` | Todos | Control de integridad de la carga. |

## `consolidatedRows` — salida analítica, no OLTP

| Campo | Tipo | PK | FK | Obligatorio | Descripción |
|---|---|---:|---|---:|---|
| `source` | `EtlSourceName` | No | catálogo lógico | Sí | Fuente de procedencia. |
| `sourceKey` | `string` | No | — | Sí | Clave del registro en origen. |
| `dimension` | `string` | No | — | Sí | Descripción de la dimensión cargada. |
| `amount` | `number` | No | — | Sí | Importe analítico. |
| `date` | `string` | No | — | Sí | Fecha analítica. |
| `businessType` | `"sale" \| "b2g-order"` | No | — | Sí | Diferencia venta cobrada / orden B2G. |
| `origin` | `string` | No | — | Sí | Origen de carga. |
| `duplicateOf` | `string` | No | lógico a otra fila | No | Registro duplicado relacionado. |
| `transactionKey` | `string` | No | — | No | Clave usada para deduplicación. |
| `productName`, `categoryName`, `companyName` | `string` | No | — | No | Dimensiones desnormalizadas. |
| `sellerName`, `branchName` | `string` | No | — | No | Dimensiones desnormalizadas. |
| `departmentName`, `provinceName`, `districtName` | `string` | No | — | No | Ubicación desnormalizada. |
