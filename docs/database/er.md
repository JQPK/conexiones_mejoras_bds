# Modelo entidad-relación

```mermaid
erDiagram
    USERS ||--o| SELLERS : "cuenta opcional"
    USERS ||--o{ AUDIT_LOGS : ejecuta
    PERSONS ||--o| CUSTOMERS : "cliente persona"
    COMPANIES ||--o| CUSTOMERS : "cliente empresa"
    CATEGORIES ||--o{ PRODUCTS : clasifica
    BRANCHES ||--o{ SELLERS : asigna
    CUSTOMERS ||--o{ SALES : compra
    SELLERS ||--o{ SALES : registra
    BRANCHES ||--o{ SALES : atiende
    PAYMENT_METHODS ||--o{ SALES : utiliza
    SALES ||--o| RECEIPTS : genera
    SALES ||--o{ SALE_LINES : contiene
    PRODUCTS ||--o{ SALE_LINES : aparece_en
    DEPARTMENTS ||--o{ PROVINCES : contiene
    PROVINCES ||--o{ DISTRICTS : contiene
    DEPARTMENTS ||--o{ SALES : ubica
    PROVINCES ||--o{ SALES : ubica
    DISTRICTS ||--o{ SALES : ubica
    ETL_EXECUTIONS ||--o{ ETL_EXECUTION_SOURCES : incluye
    ETL_EXECUTIONS ||--o{ ETL_LOG_EVENTS : registra
    ETL_EXECUTIONS ||--o{ ETL_SOURCE_METRICS : mide
    ETL_EXECUTIONS ||--o{ ETL_STAGE_ERRORS : reporta
    ETL_EXECUTIONS ||--o| ETL_LOAD_VALIDATIONS : valida
    ETL_CONNECTIONS }o--|| ETL_SOURCES : configura

    USERS { string id PK string username UK string displayName UserRole role }
    PERSONS { string id PK string documentNumber string firstName string lastName }
    COMPANIES { string id PK string ruc UK string legalName }
    CUSTOMERS { string id PK string kind FK personId FK companyId }
    CATEGORIES { string id PK string code UK string name }
    PRODUCTS { string id PK string code UK string categoryId FK decimal unitPrice }
    BRANCHES { string id PK string code UK string name }
    SELLERS { string id PK string documentNumber string branchId FK string userId FK }
    PAYMENT_METHODS { string id PK string name }
    SALES { string id PK string saleNumber UK string customerId FK string sellerId FK string branchId FK decimal total }
    SALE_LINES { string id PK string saleId FK string productId FK decimal quantity decimal unitPrice decimal subtotal }
    RECEIPTS { string id PK string saleId FK string type string series string number }
    DEPARTMENTS { string id PK string code UK string name }
    PROVINCES { string id PK string code UK string departmentId FK }
    DISTRICTS { string id PK string code UK string provinceId FK }
    ETL_CONNECTIONS { string id PK string name UK string server string engine boolean credentialConfigured }
    ETL_EXECUTIONS { string id PK string state datetime startedAt integer extracted integer loaded }
    ETL_EXECUTION_SOURCES { string executionId FK string source PK string executionId }
    ETL_LOG_EVENTS { string id PK string executionId FK string level string stage string message }
    ETL_SOURCE_METRICS { string id PK string executionId FK string source integer extracted integer loaded }
    ETL_STAGE_ERRORS { string id PK string executionId FK string source string stage string message }
    ETL_LOAD_VALIDATIONS { string executionId PK_FK integer totalRows integer uniqueSourceKeys boolean passed }
    AUDIT_LOGS { string id PK string actorId FK string action string target string result }
    ETL_SOURCES { string name PK }
```

`SALE_LINES` y las tablas auxiliares ETL son una representación normalizada para PostgreSQL. En IndexedDB son arreglos embebidos dentro de `sales` y `etlExecutions`.
