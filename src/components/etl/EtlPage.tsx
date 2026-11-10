import { useCallback, useEffect, useMemo, useState } from "react";
import type { EtlSourceName, User } from "@/domain/models";
import { ETL_SOURCE_NAMES } from "@/domain/models";
import { authService } from "@/services/authService";
export interface ApiResponse { status: number; body: unknown }
import { ActionButton } from "@/components/ui/ActionButton";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Database,
  ExternalLink,
  Info,
  Layers,
  LockKeyhole,
  Play,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
} from "lucide-react";

/** Definición y metadatos de endpoints ETL */
export interface Endpoint {
  id: string;
  tag: "Conexiones a fuentes de datos" | "Ejecución y seguimiento ETL";
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  purpose: string;
  whenToUse: string;
  body?: string;
  pathParameter?: string;
  sampleResponse?: string;
  commonErrors?: string[];
}

const connectionExample = (source: EtlSourceName) =>
  JSON.stringify(
    {
      name: source,
      server: "servidor-origen.local",
      engine: "PostgreSQL",
      database: `db_${source}`,
      username: "etl_user",
      password: "credencial_temporal_no_persistida",
    },
    null,
    2
  );

const executionExample = JSON.stringify(
  {
    sourceNames: [
      "ARIMANA_OLTP",
      "siga_1646",
      "SamarImportadora",
      "CASTILLONV2",
      "BD_CASTILLON_VETERINARIA",
    ],
  },
  null,
  2
);

export const endpoints: Endpoint[] = [
  {
    id: "validate",
    tag: "Conexiones a fuentes de datos",
    method: "POST",
    path: "/api/etl/conexiones/validar",
    description: "Valida los parámetros de conexión sin acceder a un servidor real.",
    purpose:
      "Verifica sintaxis, completitud de campos y autenticidad del motor antes de intentar registrar una fuente.",
    whenToUse:
      "Al registrar una nueva fuente o verificar si las credenciales y el host de origen son válidos.",
    body: connectionExample("siga_1646"),
    sampleResponse: JSON.stringify(
      {
        valid: true,
        message: "Conexión a siga_1646 validada.",
        checkedAt: "2026-11-09T03:00:00.000Z",
      },
      null,
      2
    ),
    commonErrors: [
      "Faltan campos obligatorios (servidor, motor, base de datos o usuario).",
      "El nombre de la fuente no pertenece al catálogo oficial autorizado.",
    ],
  },
  {
    id: "create-connection",
    tag: "Conexiones a fuentes de datos",
    method: "POST",
    path: "/api/etl/conexiones",
    description: "Registra una conexión ETL sin persistir la contraseña.",
    purpose:
      "Almacena la configuración de conexión de una fuente de datos en el repositorio de administración ETL.",
    whenToUse:
      "Para habilitar una fuente dentro del pipeline. La contraseña solo marca el indicador credentialConfigured.",
    body: connectionExample("ARIMANA_OLTP"),
    sampleResponse: JSON.stringify(
      {
        id: "conn-8f92-b41c",
        name: "ARIMANA_OLTP",
        server: "servidor-origen.local",
        engine: "PostgreSQL",
        database: "db_ARIMANA_OLTP",
        username: "etl_user",
        credentialConfigured: true,
        status: "active",
        createdAt: "2026-11-09T03:00:00.000Z",
      },
      null,
      2
    ),
    commonErrors: [
      "Ya existe una conexión registrada con ese mismo nombre de fuente.",
      "Fuente no autorizada en el catálogo ETL_SOURCE_NAMES.",
    ],
  },
  {
    id: "list-connections",
    tag: "Conexiones a fuentes de datos",
    method: "GET",
    path: "/api/etl/conexiones",
    description: "Obtiene las conexiones configuradas.",
    purpose:
      "Devuelve el inventario completo de fuentes y sus datos de host/motor registrados.",
    whenToUse:
      "Al entrar a la sección de ETL o antes de lanzar un lote de extracción para revisar qué fuentes están configuradas.",
    sampleResponse: JSON.stringify(
      [
        {
          id: "conn-01",
          name: "ARIMANA_OLTP",
          server: "supabase.cloud",
          engine: "PostgreSQL",
          database: "postgres",
          username: "postgres",
          credentialConfigured: true,
        },
        {
          id: "conn-02",
          name: "siga_1646",
          server: "siga-acobamba.gob.pe",
          engine: "SQL Server",
          database: "SIGA_1646",
          username: "siga_read",
          credentialConfigured: true,
        },
      ],
      null,
      2
    ),
  },
  {
    id: "update-connection",
    tag: "Conexiones a fuentes de datos",
    method: "PUT",
    path: "/api/etl/conexiones/{id}",
    description: "Actualiza una conexión existente.",
    purpose:
      "Modifica servidor, base de datos, usuario o refresca el estado de credenciales de una fuente ya guardada.",
    whenToUse:
      "Cuando cambia la IP/host de un servidor SQL o se renuevan los accesos de la fuente.",
    pathParameter: "conn-01",
    body: connectionExample("siga_1646"),
    sampleResponse: JSON.stringify(
      {
        id: "conn-01",
        name: "siga_1646",
        server: "nuevo-host.gob.pe",
        engine: "SQL Server",
        database: "SIGA_1646",
        username: "siga_read",
        credentialConfigured: true,
        updatedAt: "2026-11-09T03:05:00.000Z",
      },
      null,
      2
    ),
  },
  {
    id: "delete-connection",
    tag: "Conexiones a fuentes de datos",
    method: "DELETE",
    path: "/api/etl/conexiones/{id}",
    description: "Elimina una conexión y conserva su auditoría.",
    purpose:
      "Da de baja una fuente del registro de ETL sin perder la traza en la bitácora de auditoría inmutable.",
    whenToUse:
      "Cuando una fuente ya no participa en las consolidaciones analíticas.",
    pathParameter: "conn-01",
    sampleResponse: JSON.stringify({ message: "Conexión eliminada." }, null, 2),
  },
  {
    id: "create-execution",
    tag: "Ejecución y seguimiento ETL",
    method: "POST",
    path: "/api/etl/ejecuciones",
    description:
      "Ejecuta una o varias fuentes y actualiza historial, logs y consolidado.",
    purpose:
      "Dispara el proceso central de Extracción, Transformación, Deduplicación y Carga hacia el Consolidado analítico.",
    whenToUse:
      "Para sincronizar periódicamente las transacciones heterogéneas hacia el modelo dimensional de Arimana Bazar.",
    body: executionExample,
    sampleResponse: JSON.stringify(
      {
        id: "exec_1731121200000",
        sourceNames: ["ARIMANA_OLTP", "siga_1646", "SamarImportadora"],
        state: "completed",
        startedAt: "2026-11-09T03:10:00.000Z",
        completedAt: "2026-11-09T03:10:02.300Z",
        durationSeconds: 2.3,
        extracted: 1350,
        transformed: 1350,
        loaded: 1350,
        rejected: 0,
        sourceMetrics: [
          {
            source: "ARIMANA_OLTP",
            extracted: 500,
            transformed: 500,
            loaded: 500,
            rejected: 0,
            durationSeconds: 0.8,
            integrityPassed: true,
          },
          {
            source: "siga_1646",
            extracted: 350,
            transformed: 350,
            loaded: 350,
            rejected: 0,
            durationSeconds: 0.6,
            integrityPassed: true,
          },
        ],
        validation: {
          totalRows: 1350,
          uniqueSourceKeys: 1350,
          orphanRows: 0,
          passed: true,
          checkedAt: "2026-11-09T03:10:02.300Z",
        },
      },
      null,
      2
    ),
    commonErrors: [
      "Existe otra ejecución en estado 'running' para una de las fuentes seleccionadas.",
      "El array sourceNames está vacío o contiene fuentes desconocidas.",
    ],
  },
  {
    id: "list-executions",
    tag: "Ejecución y seguimiento ETL",
    method: "GET",
    path: "/api/etl/ejecuciones",
    description: "Consulta el historial de ejecuciones.",
    purpose:
      "Permite listar todas las ejecuciones realizadas con sus estados, duración y volumen procesado.",
    whenToUse:
      "Para monitorear el desempeño histórico del pipeline y detectar errores en corridas pasadas.",
    sampleResponse: JSON.stringify(
      [
        {
          id: "exec_01",
          state: "completed",
          startedAt: "2026-11-09T02:00:00.000Z",
          loaded: 1200,
          sourceNames: ["ARIMANA_OLTP", "siga_1646"],
        },
      ],
      null,
      2
    ),
  },
  {
    id: "get-execution",
    tag: "Ejecución y seguimiento ETL",
    method: "GET",
    path: "/api/etl/ejecuciones/{id}",
    description:
      "Consulta el estado, métricas y validación de una ejecución.",
    purpose:
      "Obtiene la radiografía completa de una ejecución específica: registros por fase, tiempos y resultado de integridad.",
    whenToUse:
      "Inmediatamente después de lanzar un proceso ETL o al auditar un reporte fallido.",
    pathParameter: "exec_01",
    sampleResponse: JSON.stringify(
      {
        id: "exec_01",
        state: "completed",
        durationSeconds: 1.8,
        extracted: 800,
        loaded: 800,
        rejected: 0,
        validation: { passed: true, totalRows: 800, uniqueSourceKeys: 800 },
      },
      null,
      2
    ),
  },
  {
    id: "get-logs",
    tag: "Ejecución y seguimiento ETL",
    method: "GET",
    path: "/api/etl/ejecuciones/{id}/logs",
    description: "Obtiene los eventos y mensajes de una ejecución.",
    purpose:
      "Proporciona la traza paso a paso (extract, transform, load, validate) para resolución de incidentes.",
    whenToUse:
      "Para depurar registros omitidos, advertencias de duplicidad o errores de integridad.",
    pathParameter: "exec_01",
    sampleResponse: JSON.stringify(
      {
        executionId: "exec_01",
        events: [
          {
            timestamp: "2026-11-09T03:00:00.000Z",
            level: "info",
            stage: "extract",
            message: "Inicio de extracción para 2 fuentes.",
          },
          {
            timestamp: "2026-11-09T03:00:01.000Z",
            level: "info",
            stage: "transform",
            message: "siga_1646 procesado como Cliente Institucional B2G.",
          },
        ],
        messages: [
          "[extract] ARIMANA_OLTP: 500 registros extraídos.",
          "[load] Consolidado completado exitosamente.",
        ],
      },
      null,
      2
    ),
  },
  {
    id: "clear",
    tag: "Ejecución y seguimiento ETL",
    method: "POST",
    path: "/api/etl/consolidado/limpieza",
    description:
      "Limpia el consolidado con confirmación explícita; no elimina fuentes ni auditorías.",
    purpose:
      "Trunca la tabla de hechos consolidados para permitir recargas completas o mantenimiento de espacio.",
    whenToUse:
      "Operación controlada de reset antes de un nuevo proceso ETL global. Requiere flag confirm: true.",
    body: JSON.stringify({ confirm: true }, null, 2),
    sampleResponse: JSON.stringify(
      {
        deletedRows: 1450,
        message:
          "Consolidado limpiado; fuentes y auditorías preservadas.",
      },
      null,
      2
    ),
    commonErrors: [
      "Si el cuerpo no incluye { 'confirm': true }, la solicitud se rechaza con HTTP 400 por protección.",
    ],
  },
  {
    id: "audit",
    tag: "Ejecución y seguimiento ETL",
    method: "GET",
    path: "/api/etl/auditoria",
    description:
      "Consulta la auditoría de conexiones, ejecuciones y limpieza.",
    purpose:
      "Garantiza el cumplimiento normativo y la trazabilidad total de quién ejecutó cada acción y en qué momento.",
    whenToUse:
      "Para revisiones de seguridad, trazabilidad de cambios y reportes de gobierno de datos.",
    sampleResponse: JSON.stringify(
      [
        {
          id: "audit-01",
          actorId: "user-admin",
          action: "ETL_EXECUTION_COMPLETED",
          target: "exec_01",
          result: "success",
          message: "Ejecución completed. Sin credenciales en logs.",
          createdAt: "2026-11-09T03:00:02.000Z",
        },
      ],
      null,
      2
    ),
  },
];

const methodStyle = {
  GET: "border-sky-300 bg-sky-50 text-sky-700 font-bold",
  POST: "border-emerald-300 bg-emerald-50 text-emerald-700 font-bold",
  PUT: "border-amber-300 bg-amber-50 text-amber-700 font-bold",
  DELETE: "border-rose-300 bg-rose-50 text-rose-700 font-bold",
} as const;

const sourceCatalog = [
  {
    name: "siga_1646" as const,
    system: "SIGA (Gobierno de Perú)",
    type: "B2G Institucional",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    description:
      "Red de Salud Acobamba (Unidad Ejecutora 1646). Representa órdenes de compra estatales. ¡Regla vital: SIGA es siempre CLIENTE/comprador institucional B2G, jamás un proveedor!",
  },
  {
    name: "SamarImportadora" as const,
    system: "SQL Server Transaccional",
    type: "Comercial / Venta Directa",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    description:
      "Base de datos de ventas de Samar Importadora S.A.C. Fuente primaria de operaciones comerciales retail y mayoristas.",
  },
  {
    name: "DW_SamarImportadora" as const,
    system: "SQL Server Data Warehouse",
    type: "Analítica / Deduplicación",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    description:
      "Vista previa del DW de Samar. Se aplica regla de deduplicación automática: si se ejecuta junto a SamarImportadora, las ventas ya procesadas se descartan.",
  },
  {
    name: "CASTILLONV2" as const,
    system: "SQL Server Comercial",
    type: "Comercial / Distribuidora",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    description:
      "Sistema de ventas de Distribuidora Castillón Versión 2. Se normalizan productos, clientes y líneas de venta hacia el modelo analítico.",
  },
  {
    name: "BD_CASTILLON_VETERINARIA" as const,
    system: "SQL Server Especializado",
    type: "Agro-Veterinaria",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
    description:
      "Módulo de productos veterinarios y agropecuarios. Homologa categorías y artículos hacia el catálogo centralizado de Arimana Bazar.",
  },
  {
    name: "ARIMANA_OLTP" as const,
    system: "Supabase Cloud PostgreSQL",
    type: "Base Operacional Central",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
    description:
      "Base de datos transaccional operativa de Arimana Bazar alojada en la nube de Supabase. Representa el núcleo vivo del negocio.",
  },
];

function safeJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error("El Request Body no contiene JSON válido.");
  }
}

function displayResponse(response: ApiResponse | null) {
  return response ? JSON.stringify(response.body, null, 2) : "";
}

export function EtlPage() {
  const [actor, setActor] = useState<User | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"interactive" | "docs">("docs");
  const [expanded, setExpanded] = useState<string | null>("create-execution");
  const [tryIt, setTryIt] = useState<Record<string, boolean>>({});
  const [bodies, setBodies] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      endpoints
        .filter((item) => item.body)
        .map((item) => [item.id, item.body!])
    )
  );
  const [parameters, setParameters] = useState<Record<string, string>>({
    "update-connection": "conn-01",
    "delete-connection": "conn-01",
    "get-execution": "exec_01",
    "get-logs": "exec_01",
  });
  const [responses, setResponses] = useState<Record<string, ApiResponse | null>>(
    {}
  );
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    void authService.currentUser().then((current) => {
      if (!current) {
        window.location.replace("/login/");
      } else {
        setActor(current);
        if (current.role === "Administrador") {
          setAuthorized(true);
        }
      }
    });
  }, []);

  const grouped = useMemo(
    () =>
      endpoints.reduce<Record<string, Endpoint[]>>((result, endpoint) => {
        (result[endpoint.tag] ??= []).push(endpoint);
        return result;
      }, {}),
    []
  );

  async function authorize() {
    const current = await authService.currentUser();
    if (current?.role === "Administrador") {
      setAuthorized(true);
    }
  }

  async function execute(endpoint: Endpoint) {
    if (!actor || !authorized) return;
    setBusy((current) => ({ ...current, [endpoint.id]: true }));
    try {
      const path = endpoint.path.replace(
        "{id}",
        encodeURIComponent(parameters[endpoint.id] || "")
      );
      const parsedBody = endpoint.body ? safeJson(bodies[endpoint.id] ?? "{}") : undefined;

      let resStatus = 200;
      let resBody: unknown = null;

      try {
        // Ejecución HTTP Real directa contra el backend y bases de datos Supabase
        const httpRes = await fetch(path, {
          method: endpoint.method,
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: parsedBody ? JSON.stringify(parsedBody) : undefined,
        });

        resStatus = httpRes.status;
        resBody = await httpRes.json().catch(() => ({}));
      } catch (err) {
        resStatus = 503;
        resBody = {
          error: {
            code: 503,
            message: err instanceof Error ? err.message : "Error de conexión con el servicio Supabase.",
          },
        };
      }

      setResponses((current) => ({
        ...current,
        [endpoint.id]: {
          status: resStatus,
          body: resBody,
        },
      }));
    } catch (error) {
      setResponses((current) => ({
        ...current,
        [endpoint.id]: {
          status: 400,
          body: {
            error: {
              code: 400,
              message:
                error instanceof Error ? error.message : "JSON inválido",
            },
          },
        },
      }));
    } finally {
      setBusy((current) => ({ ...current, [endpoint.id]: false }));
    }
  }

  function copyText(id: string, text: string) {
    void navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  /** Conmuta a la consola interactiva y expande el endpoint seleccionado */
  function jumpToEndpoint(endpointId: string) {
    setActiveTab("interactive");
    setExpanded(endpointId);
    setTryIt((prev) => ({ ...prev, [endpointId]: true }));
    setTimeout(() => {
      const el = document.getElementById(`endpoint-${endpointId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
  }

  if (!actor) {
    return (
      <div className="rounded-xl border border-border-default bg-surface-card p-10 text-center text-sm text-text-secondary shadow-card">
        Cargando módulo de Administración ETL…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado principal */}
      <header className="rounded-2xl border border-border-default bg-surface-sidebar p-6 text-white shadow-card sm:p-8">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-active">
                <Database size={16} />
                Gestión de Integración y Datos
              </div>
              <h1 className="mt-1 flex items-center gap-3 text-2xl font-black text-white sm:text-3xl">
                <Server size={28} className="text-primary-active" />
                Administración ETL y APIs
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-300">
                Pipeline analítico de extracción, homologación y carga desde fuentes
                heterogéneas (SQL Server, SIGA B2G) hacia el Data Warehouse en Supabase Cloud.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-slate-200">
                Modo: Simulación Local (IndexedDB) + Supabase
              </span>
              <button
                type="button"
                onClick={() => void authorize()}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold transition-colors ${
                  authorized
                    ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                    : "border-white/40 text-white hover:bg-white/10"
                }`}
              >
                <LockKeyhole size={15} />
                {authorized ? "Autorizado (Admin)" : "Autorizar Admin"}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <ShieldCheck size={15} className="text-emerald-400" />
            {authorized
              ? "Sesión de Administrador activa con permisos plenos para ejecutar operaciones ETL."
              : "Se requiere rol de Administrador para disparar las operaciones de carga y limpieza."}
          </div>
        </div>
      </header>

      {/* Navegación por Pestañas */}
      <nav
        aria-label="Pestañas de Administración ETL"
        className="flex border-b border-border-default bg-surface-card px-2 pt-2 rounded-t-xl"
      >
        <button
          type="button"
          onClick={() => setActiveTab("docs")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
            activeTab === "docs"
              ? "border-primary-active text-primary-active"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <BookOpen size={18} />
          Documentación y Guía de Endpoints
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("interactive")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
            activeTab === "interactive"
              ? "border-primary-active text-primary-active"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <Terminal size={18} />
          Consola Interactiva (OpenAPI / Swagger)
        </button>
      </nav>

      {/* CONTENIDO: PESTAÑA DE DOCUMENTACIÓN */}
      {activeTab === "docs" && (
        <div className="space-y-8 animate-fadeIn">
          {/* 1. Introducción al ETL */}
          <section className="rounded-2xl border border-border-default bg-white p-6 shadow-card">
            <h2 className="flex items-center gap-2 text-xl font-black text-text-primary">
              <Layers size={22} className="text-primary-active" />
              ¿Qué es y cómo funciona el ETL de Arimana Bazar?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              El proceso <strong>ETL (Extract, Transform, Load)</strong> consolida las operaciones comerciales
              dispersas en múltiples bases de datos transaccionales hacia un único repositorio analítico
              (Data Warehouse en Supabase Cloud). Esto permite alimentar los dashboards ejecutivos,
              calcular rentabilidad real y mantener la trazabilidad de cada transacción.
            </p>

            <div className="mt-5 grid gap-4 rounded-xl border border-border-default bg-slate-50 p-4 sm:grid-cols-4">
              <div className="rounded-lg bg-white p-3 shadow-sm border border-slate-200">
                <span className="text-xs font-black uppercase text-blue-600">
                  1. Extracción (E)
                </span>
                <p className="mt-1 text-xs text-text-secondary">
                  Lee registros desde las 6 fuentes registradas (SQL Server, SIGA y Supabase OLTP).
                </p>
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm border border-slate-200">
                <span className="text-xs font-black uppercase text-purple-600">
                  2. Transformación (T)
                </span>
                <p className="mt-1 text-xs text-text-secondary">
                  Homologa tipos de cambio, normaliza nombres, clasifica SIGA como cliente B2G y deduplica Samar DW.
                </p>
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm border border-slate-200">
                <span className="text-xs font-black uppercase text-emerald-600">
                  3. Carga (L)
                </span>
                <p className="mt-1 text-xs text-text-secondary">
                  Inserta las filas limpias en la tabla analítica consolidada (`consolidatedRows`).
                </p>
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm border border-slate-200">
                <span className="text-xs font-black uppercase text-amber-600">
                  4. Validación (V)
                </span>
                <p className="mt-1 text-xs text-text-secondary">
                  Verifica que no existan claves duplicadas ni registros huérfanos antes de dar por cerrada la corrida.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Catálogo de Fuentes Autorizadas */}
          <section className="rounded-2xl border border-border-default bg-white p-6 shadow-card">
            <h2 className="flex items-center gap-2 text-xl font-black text-text-primary">
              <Database size={22} className="text-primary-active" />
              Catálogo Oficial de Fuentes de Datos (6 Orígenes)
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Cada fuente cuenta con reglas de homologación específicas garantizadas por el adaptador del sistema:
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sourceCatalog.map((source) => (
                <article
                  key={source.name}
                  className="flex flex-col justify-between rounded-xl border border-border-default bg-white p-4 shadow-sm hover:border-primary-active transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800">
                        {source.name}
                      </code>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${source.badgeColor}`}
                      >
                        {source.type}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-text-secondary">
                      {source.system}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-text-primary">
                      {source.description}
                    </p>
                  </div>
                  <div className="mt-4 border-t border-border-default pt-2 text-[11px] text-text-secondary flex items-center justify-between">
                    <span>Estado: Autorizado</span>
                    <span className="font-semibold text-emerald-600">✓ En Catálogo</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* 3. Guía Paso a Paso de Ejecución Recomendada */}
          <section className="rounded-2xl border border-border-default bg-white p-6 shadow-card">
            <h2 className="flex items-center gap-2 text-xl font-black text-text-primary">
              <RefreshCw size={22} className="text-primary-active" />
              Flujo de Trabajo Recomendado (Paso a Paso)
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-active font-bold text-white text-xs">
                  1
                </span>
                <div>
                  <p className="text-sm font-bold text-text-primary">
                    Revisar conexiones activas
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Ejecuta <code className="font-mono text-primary-active">GET /api/etl/conexiones</code> para
                    confirmar qué fuentes tienen credenciales y servidores configurados.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-active font-bold text-white text-xs">
                  2
                </span>
                <div>
                  <p className="text-sm font-bold text-text-primary">
                    Disparar la consolidación ETL
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Envía <code className="font-mono text-primary-active">POST /api/etl/ejecuciones</code> con
                    las fuentes que deseas sincronizar. Puedes incluir todas las fuentes o solo las críticas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-active font-bold text-white text-xs">
                  3
                </span>
                <div>
                  <p className="text-sm font-bold text-text-primary">
                    Comprobar el resultado y validación
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Verifica que el estado final sea <span className="font-semibold text-emerald-600">"completed"</span> y que
                    en la propiedad <code className="font-mono">validation.passed</code> figure <span className="font-semibold text-emerald-600">true</span>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-active font-bold text-white text-xs">
                  4
                </span>
                <div>
                  <p className="text-sm font-bold text-text-primary">
                    Consultar el Dashboard Analítico
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Navega a la sección <a href="/dashboard/" className="font-bold text-primary-active hover:underline">Dashboard</a> para
                    apreciar las ventas, márgenes e indicadores alimentados con la nueva corrida.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Detalle exhaustivo de cada Endpoint */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-text-primary">
                Documentación Detallada de los 11 Endpoints
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Haz clic en <strong>"Probar en consola interactiva →"</strong> en cualquiera de ellos para
                abrirlo directamente en la pestaña OpenAPI con sus parámetros listos para ejecutar.
              </p>
            </div>

            <div className="space-y-4">
              {endpoints.map((ep) => (
                <article
                  key={ep.id}
                  className="rounded-2xl border border-border-default bg-white p-5 shadow-card hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border-default pb-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`rounded border px-2.5 py-1 text-xs font-mono font-bold ${
                          methodStyle[ep.method]
                        }`}
                      >
                        {ep.method}
                      </span>
                      <code className="text-sm font-mono font-extrabold text-text-primary">
                        {ep.path}
                      </code>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {ep.tag}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => jumpToEndpoint(ep.id)}
                      className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-primary-subtle px-3 py-1.5 text-xs font-bold text-primary-active hover:bg-primary-subtle/80 transition-colors"
                    >
                      Probar en consola interactiva
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2 text-xs">
                    <div>
                      <p className="font-bold text-text-secondary uppercase tracking-wider text-[11px]">
                        ¿Para qué sirve?
                      </p>
                      <p className="mt-1 text-sm font-semibold text-text-primary">
                        {ep.purpose}
                      </p>

                      <p className="mt-3 font-bold text-text-secondary uppercase tracking-wider text-[11px]">
                        ¿Cuándo usarlo?
                      </p>
                      <p className="mt-1 text-text-secondary leading-relaxed">
                        {ep.whenToUse}
                      </p>

                      {ep.commonErrors && ep.commonErrors.length > 0 && (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                          <p className="font-bold text-amber-800 flex items-center gap-1">
                            <AlertCircle size={13} />
                            Puntos de atención y validaciones:
                          </p>
                          <ul className="mt-1 list-disc list-inside space-y-0.5 text-amber-900">
                            {ep.commonErrors.map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {ep.body && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-text-secondary uppercase tracking-wider text-[11px]">
                              Ejemplo de Request Body
                            </span>
                            <button
                              type="button"
                              onClick={() => copyText(`doc-body-${ep.id}`, ep.body!)}
                              className="inline-flex items-center gap-1 text-[11px] text-text-secondary hover:text-text-primary"
                            >
                              {copiedId === `doc-body-${ep.id}` ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                              {copiedId === `doc-body-${ep.id}` ? "Copiado" : "Copiar"}
                            </button>
                          </div>
                          <pre className="max-h-40 overflow-auto rounded-lg bg-slate-900 p-2.5 font-mono text-[11px] text-emerald-400">
                            {ep.body}
                          </pre>
                        </div>
                      )}

                      {ep.sampleResponse && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-text-secondary uppercase tracking-wider text-[11px]">
                              Ejemplo de Respuesta HTTP (200/201)
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                copyText(`doc-resp-${ep.id}`, ep.sampleResponse!)
                              }
                              className="inline-flex items-center gap-1 text-[11px] text-text-secondary hover:text-text-primary"
                            >
                              {copiedId === `doc-resp-${ep.id}` ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                              {copiedId === `doc-resp-${ep.id}` ? "Copiado" : "Copiar"}
                            </button>
                          </div>
                          <pre className="max-h-40 overflow-auto rounded-lg bg-slate-900 p-2.5 font-mono text-[11px] text-sky-300">
                            {ep.sampleResponse}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* 5. Reglas de Seguridad y Buenas Prácticas */}
          <section className="rounded-2xl border border-border-default bg-white p-6 shadow-card">
            <h2 className="flex items-center gap-2 text-xl font-black text-text-primary">
              <ShieldCheck size={22} className="text-emerald-600" />
              Garantías de Seguridad y Reglas de Integridad
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3 text-xs leading-relaxed">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-bold text-text-primary text-sm">
                  Cero contraseñas persistidas
                </p>
                <p className="mt-1 text-text-secondary">
                  Las contraseñas de las bases de datos de origen nunca se almacenan
                  en texto plano ni se devuelven en logs o auditorías. Solo se conserva la bandera booleana <code className="font-mono">credentialConfigured</code>.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-bold text-text-primary text-sm">
                  Clasificación estricta B2G
                </p>
                <p className="mt-1 text-text-secondary">
                  La fuente <code className="font-mono">siga_1646</code> siempre se homologa con tipo de negocio <code className="font-mono">b2g-order</code> y dimensión <code className="font-mono">Contrato SIGA B2G</code>. Acobamba es cliente institucional del Estado.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-bold text-text-primary text-sm">
                  Protección ante duplicidad
                </p>
                <p className="mt-1 text-text-secondary">
                  Si se procesa <code className="font-mono">DW_SamarImportadora</code> en la misma corrida que <code className="font-mono">SamarImportadora</code>, el motor descarta las filas ya existentes sin interrumpir la ejecución.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* CONTENIDO: CONSOLA INTERACTIVA (OPENAPI) */}
      {activeTab === "interactive" && (
        <main className="space-y-6 animate-fadeIn">
          <div className="rounded-xl border border-border-default bg-white p-4 text-xs text-text-secondary shadow-card flex items-center justify-between flex-wrap gap-2">
            <div>
              <strong>Consola Interactiva OpenAPI 3.x</strong> · Ejecución directa con adaptador local y persistencia en IndexedDB/Supabase.
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-slate-700">Listo para pruebas</span>
            </div>
          </div>

          {Object.entries(grouped).map(([tag, items]) => (
            <section key={tag} className="mb-6">
              <h2 className="border-b border-border-default px-2 py-3 text-lg font-bold text-text-primary">
                {tag}
              </h2>
              <div className="mt-3 space-y-3">
                {items.map((endpoint) => (
                  <EndpointRow
                    key={endpoint.id}
                    endpoint={endpoint}
                    open={expanded === endpoint.id}
                    onToggle={() =>
                      setExpanded(expanded === endpoint.id ? null : endpoint.id)
                    }
                    tryIt={Boolean(tryIt[endpoint.id])}
                    onTry={() =>
                      setTryIt((current) => ({
                        ...current,
                        [endpoint.id]: !current[endpoint.id],
                      }))
                    }
                    body={bodies[endpoint.id] ?? ""}
                    setBody={(value) =>
                      setBodies((current) => ({
                        ...current,
                        [endpoint.id]: value,
                      }))
                    }
                    parameter={parameters[endpoint.id] ?? ""}
                    setParameter={(value) =>
                      setParameters((current) => ({
                        ...current,
                        [endpoint.id]: value,
                      }))
                    }
                    response={responses[endpoint.id] ?? null}
                    busy={Boolean(busy[endpoint.id])}
                    onExecute={() => void execute(endpoint)}
                    onCopy={() => {
                      if (bodies[endpoint.id] || endpoint.body) {
                        copyText(
                          `body-${endpoint.id}`,
                          bodies[endpoint.id] ?? endpoint.body ?? ""
                        );
                      }
                    }}
                    copied={copiedId === `body-${endpoint.id}`}
                    authorized={authorized}
                  />
                ))}
              </div>
            </section>
          ))}
        </main>
      )}
    </div>
  );
}

/** Componente de fila interactiva para cada Endpoint */
function EndpointRow({
  endpoint,
  open,
  onToggle,
  tryIt,
  onTry,
  body,
  setBody,
  parameter,
  setParameter,
  response,
  busy,
  onExecute,
  onCopy,
  copied,
  authorized,
}: {
  endpoint: Endpoint;
  open: boolean;
  onToggle: () => void;
  tryIt: boolean;
  onTry: () => void;
  body: string;
  setBody: (value: string) => void;
  parameter: string;
  setParameter: (value: string) => void;
  response: ApiResponse | null;
  busy: boolean;
  onExecute: () => void;
  onCopy: () => void;
  copied: boolean;
  authorized: boolean;
}) {
  const displayPath = endpoint.path.replace("{id}", parameter || "{id}");

  return (
    <article
      id={`endpoint-${endpoint.id}`}
      className={`border ${
        open ? "border-primary-active shadow-card ring-1 ring-primary-active/20" : "border-border-default"
      } rounded-xl bg-white shadow-sm transition-all`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-wrap items-center gap-3 p-3.5 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="text-text-secondary">
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
        <span
          className={`min-w-20 rounded border px-2.5 py-1 text-center text-xs font-mono font-bold ${
            methodStyle[endpoint.method]
          }`}
        >
          {endpoint.method}
        </span>
        <code className="font-mono text-sm font-bold text-text-primary">
          {displayPath}
        </code>
        <span className="text-xs text-text-secondary line-clamp-1 ml-auto">
          {endpoint.description}
        </span>
      </button>

      {open && (
        <div className="border-t border-border-default p-5 text-sm bg-slate-50/50">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 font-bold text-text-primary text-xs uppercase tracking-wider">
                Parámetros de Ruta
              </h3>
              {endpoint.pathParameter ? (
                <label className="grid gap-1.5 text-xs font-semibold text-text-secondary">
                  <span>ID de entidad ({endpoint.pathParameter}):</span>
                  <input
                    value={parameter}
                    onChange={(event) => setParameter(event.target.value)}
                    placeholder={endpoint.pathParameter}
                    className="min-h-10 rounded-lg border border-border-default bg-white px-3 py-2 font-mono text-xs font-normal outline-none focus:border-primary-active"
                  />
                </label>
              ) : (
                <p className="text-xs text-text-secondary">
                  Este endpoint no requiere parámetros de ruta.
                </p>
              )}

              <h3 className="mb-2 mt-5 font-bold text-text-primary text-xs uppercase tracking-wider">
                Request Body (JSON)
              </h3>
              {endpoint.body ? (
                <div className="relative">
                  <button
                    type="button"
                    aria-label="Copiar ejemplo"
                    onClick={onCopy}
                    className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded bg-slate-800/80 px-2 py-1 text-[11px] text-white hover:bg-slate-800"
                  >
                    {copied ? (
                      <Check size={13} className="text-emerald-400" />
                    ) : (
                      <Copy size={13} />
                    )}
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                  <textarea
                    value={body}
                    disabled={!tryIt}
                    onChange={(event) => setBody(event.target.value)}
                    rows={8}
                    className="w-full rounded-lg border border-border-default bg-slate-900 p-3 font-mono text-xs text-emerald-300 disabled:opacity-85 focus:outline-none focus:ring-1 focus:ring-primary-active"
                  />
                </div>
              ) : (
                <p className="text-xs text-text-secondary">
                  Este endpoint no requiere cuerpo de petición.
                </p>
              )}

              <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                <p className="text-xs font-bold text-blue-900 flex items-center gap-1">
                  <Info size={14} />
                  Propósito en el sistema:
                </p>
                <p className="mt-1 text-xs text-blue-800 leading-relaxed">
                  {endpoint.purpose}
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-bold text-text-primary text-xs uppercase tracking-wider">
                Ejecución y Prueba Interactiva
              </h3>
              <div className="flex flex-wrap gap-2.5 items-center">
                <ActionButton
                  variant="secondary"
                  icon={Play}
                  onClick={onTry}
                >
                  {tryIt ? "Modo Lectura" : "Habilitar Edición"}
                </ActionButton>
                <ActionButton
                  icon={Play}
                  disabled={!authorized || busy}
                  onClick={onExecute}
                >
                  {busy ? "Ejecutando…" : "Execute"}
                </ActionButton>
              </div>
              <p className="mt-2 text-xs text-text-secondary">
                {authorized
                  ? "✓ Administrador autorizado para ejecutar."
                  : "⚠ Pulsa 'Autorizar Admin' en la cabecera para habilitar la ejecución."}
              </p>

              <h3 className="mb-2 mt-5 font-bold text-text-primary text-xs uppercase tracking-wider">
                Respuesta del Servidor (Response Body)
              </h3>
              {response ? (
                <>
                  <div
                    className={`mb-2 inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-mono font-bold ${
                      response.status >= 400
                        ? "bg-rose-100 text-rose-700 border border-rose-200"
                        : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    <span>HTTP {response.status}</span>
                    <span>{response.status >= 400 ? "Error" : "Éxito"}</span>
                  </div>
                  <pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-emerald-400 border border-slate-800">
                    {displayResponse(response)}
                  </pre>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-text-secondary bg-white">
                  Presiona el botón <strong>Execute</strong> para enviar la petición y ver la respuesta JSON en tiempo real.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
