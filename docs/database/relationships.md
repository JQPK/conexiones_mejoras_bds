# Relaciones y cardinalidades

## Relaciones implementadas

| Origen | Relación | Destino | Cardinalidad | Implementación |
|---|---|---|---|---|
| `customers.personId` | referencia opcional exclusiva | `persons.id` | `Customer 0..1 : 1 Person` | `Customer.kind = person`; validada por `CustomerService` |
| `customers.companyId` | referencia opcional exclusiva | `companies.id` | `Customer 0..1 : 1 Company` | `Customer.kind = company`; validada por `CustomerService` |
| `products.categoryId` | pertenece a | `categories.id` | `Category 1 : N Product` | categoría activa validada por `CatalogService` |
| `sellers.branchId` | asignación | `branches.id` | `Branch 1 : N Seller` | sucursal activa validada por `OrganizationService` |
| `sellers.userId` | cuenta asociada opcional | `users.id` | `User 0..1 : 0..1 Seller` | solo usuario activo con rol Vendedor; unicidad validada en servicio |
| `sales.customerId` | comprador | `customers.id` | `Customer 1 : N Sale` | validada al guardar y confirmar |
| `sales.sellerId` | vendedor responsable | `sellers.id` | `Seller 1 : N Sale` | validada al guardar y confirmar |
| `sales.branchId` | sucursal de operación | `branches.id` | `Branch 1 : N Sale` | debe coincidir con `sellers.branchId` |
| `sales.paymentMethodId` | medio utilizado opcional | `paymentMethods.id` | `PaymentMethod 0..1 : N Sale` | obligatorio para confirmar; validado por servicio |
| `sales.receiptId` | comprobante asociado opcional | `receipts.id` | `Sale 0..1 : 0..1 Receipt` | gestionado por `SalesService`; el comprobante también guarda `saleId` |
| `sales.departmentId` | ubicación | `departments.id` | `Department 1 : N Sale` | opcional; debe acompañarse de provincia y distrito |
| `sales.provinceId` | ubicación | `provinces.id` | `Province 1 : N Sale` | debe pertenecer al departamento |
| `sales.districtId` | ubicación | `districts.id` | `District 1 : N Sale` | debe pertenecer a la provincia |
| `receipts.saleId` | venta emitida | `sales.id` | `Sale 1 : 0..1 Receipt` | validada al consultar/modificar/anular |
| `provinces.departmentId` | ubicación jerárquica | `departments.id` | `Department 1 : N Province` | validada por `validateGeography` |
| `districts.provinceId` | ubicación jerárquica | `provinces.id` | `Province 1 : N District` | validada por `validateGeography` |
| `auditLogs.actorId` | usuario que ejecuta acción | `users.id` | `User 1 : N AuditLog` | identificador usado por servicios |
| `consolidatedRows.source` | catálogo de origen | `ETL_SOURCE_NAMES` | `Source 1 : N Row` | unión lógica, no FK a un almacén |

## Relaciones embebidas

Cada `Sale` contiene `lines[]`. Cada línea tiene `productId`, una copia histórica de `productCode`, `productName`, `unitPrice`, `quantity` y `subtotal`. Por eso el nombre y precio de una venta no deben recalcularse desde el catálogo vigente.

Cada `EtlExecution` contiene sus logs, métricas, errores y validación en el mismo documento IndexedDB. No existen almacenes físicos independientes para esas estructuras.

## Relaciones previstas únicamente en el equivalente PostgreSQL

El navegador no aplica restricciones referenciales nativas. El script SQL propone FKs, índices únicos, `CHECK`, `ON DELETE` y tablas normalizadas para proteger los mismos invariantes en una futura migración. `roles` y `permissions` tampoco son almacenes: son constantes en `src/domain/permissions.ts`.
