import type { APIRoute } from "astro";
import { ETL_SOURCE_NAMES, type EtlSourceName } from "@/domain/models";

export const prerender = false;

// Almacén persistente en memoria del servidor
const serverConnections: Array<{
  id: string;
  name: EtlSourceName;
  server: string;
  engine: string;
  database: string;
  username: string;
  credentialConfigured: boolean;
  createdAt: string;
  updatedAt: string;
  status: "active" | "inactive";
}> = [
  {
    id: "conn-arimana-oltp",
    name: "ARIMANA_OLTP",
    server: "db.xhqvdhdftvgnwrgedafz.supabase.co",
    engine: "PostgreSQL",
    database: "postgres",
    username: "postgres",
    credentialConfigured: true,
    createdAt: "2026-11-09T00:00:00.000Z",
    updatedAt: "2026-11-09T00:00:00.000Z",
    status: "active",
  },
  {
    id: "conn-siga-1646",
    name: "siga_1646",
    server: "siga.minsa.gob.pe",
    engine: "SQL Server",
    database: "SIGA_ACOBAMBA_1646",
    username: "siga_b2g_reader",
    credentialConfigured: true,
    createdAt: "2026-11-09T00:00:00.000Z",
    updatedAt: "2026-11-09T00:00:00.000Z",
    status: "active",
  },
  {
    id: "conn-samar-importadora",
    name: "SamarImportadora",
    server: "sql.samarimportadora.pe",
    engine: "SQL Server",
    database: "BD_SAMAR_COMERCIAL",
    username: "etl_samar",
    credentialConfigured: true,
    createdAt: "2026-11-09T00:00:00.000Z",
    updatedAt: "2026-11-09T00:00:00.000Z",
    status: "active",
  },
  {
    id: "conn-dw-samar",
    name: "DW_SamarImportadora",
    server: "dw.samarimportadora.pe",
    engine: "SQL Server",
    database: "DW_SAMAR_HISTORICO",
    username: "etl_dw_reader",
    credentialConfigured: true,
    createdAt: "2026-11-09T00:00:00.000Z",
    updatedAt: "2026-11-09T00:00:00.000Z",
    status: "active",
  },
  {
    id: "conn-castillon-v2",
    name: "CASTILLONV2",
    server: "sql.castillondistribucion.pe",
    engine: "SQL Server",
    database: "CASTILLON_V2",
    username: "etl_castillon",
    credentialConfigured: true,
    createdAt: "2026-11-09T00:00:00.000Z",
    updatedAt: "2026-11-09T00:00:00.000Z",
    status: "active",
  },
  {
    id: "conn-castillon-veterinaria",
    name: "BD_CASTILLON_VETERINARIA",
    server: "sql.castillonagrovet.pe",
    engine: "SQL Server",
    database: "CASTILLON_VET",
    username: "etl_agrovet",
    credentialConfigured: true,
    createdAt: "2026-11-09T00:00:00.000Z",
    updatedAt: "2026-11-09T00:00:00.000Z",
    status: "active",
  },
];

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(serverConnections), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      server?: string;
      engine?: string;
      database?: string;
      username?: string;
      password?: string;
    };

    const name = String(body.name ?? "").trim() as EtlSourceName;
    if (!ETL_SOURCE_NAMES.includes(name)) {
      return new Response(
        JSON.stringify({
          error: {
            code: 400,
            message: `Fuente no autorizada. Debe ser una de: ${ETL_SOURCE_NAMES.join(", ")}`,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const existingIndex = serverConnections.findIndex((c) => c.name === name);
    const now = new Date().toISOString();
    const newConn = {
      id: existingIndex >= 0 ? serverConnections[existingIndex].id : `conn-${Date.now()}`,
      name,
      server: String(body.server ?? "localhost").trim(),
      engine: String(body.engine ?? "PostgreSQL").trim(),
      database: String(body.database ?? `db_${name}`).trim(),
      username: String(body.username ?? "etl_user").trim(),
      credentialConfigured: Boolean(body.password?.trim()),
      createdAt: existingIndex >= 0 ? serverConnections[existingIndex].createdAt : now,
      updatedAt: now,
      status: "active" as const,
    };

    if (existingIndex >= 0) {
      serverConnections[existingIndex] = newConn;
    } else {
      serverConnections.push(newConn);
    }

    return new Response(JSON.stringify(newConn), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: { code: 400, message: error instanceof Error ? error.message : "Error al registrar conexión." },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
};
