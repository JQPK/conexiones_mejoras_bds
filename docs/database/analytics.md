# Separación OLTP, ETL y analítica

## OLTP

El modelo transaccional comprende usuarios, clientes, catálogo, organización, ventas, comprobantes, medios de pago y ubicaciones. En IndexedDB las líneas de venta están embebidas en `sales[].lines`.

## Operación ETL

`etlConnections`, `etlExecutions` y `auditLogs` son metadatos operativos del proceso ETL. `EtlExecution` contiene arreglos embebidos para:

- `sourceNames`: fuentes incluidas en la ejecución.
- `log`: mensajes de texto legibles.
- `logEvents`: eventos con nivel, etapa y fuente.
- `sourceMetrics`: métricas por fuente.
- `errors`: errores por etapa.
- `validation`: resultado de integridad.

El script SQL normaliza estas estructuras como tablas auxiliares para facilitar consultas, pero eso no cambia el modelo IndexedDB actual.

## Analítica y Data Warehouse

`consolidatedRows` es una salida del ETL, no una tabla OLTP. Contiene dimensiones desnormalizadas (`productName`, `categoryName`, `companyName`, `sellerName`, `branchName` y ubicación) para dashboards y reportes. No se incluye en `schema.sql` como tabla transaccional.

La fuente `DW_SamarImportadora` puede marcar operaciones duplicadas respecto de `SamarImportadora`; el Mock API evita cargar dichas filas. Las órdenes B2G de `siga_1646` se identifican con `businessType = 'b2g-order'` y se excluyen de los indicadores de ventas.
