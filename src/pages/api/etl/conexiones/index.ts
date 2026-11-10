import type { APIRoute } from "astro";
import { ETL_SOURCE_NAMES, type EtlSourceName } from "@/domain/models";
import { getSupabaseOltp, isSupabaseConfigured } from "@/lib/supabase";

export const prerender = false;

type ConnStatus = "active" | "inactive";

interface ConnectionRow {
  id: string;
  name: EtlSourceName;
  server: string;
  engine: string;
  database: string;
  username: string;
  credential_configured: boolean;
  created_at: string;
  updated_at: string;
  status: ConnStatus;
}

/** Conexiones iniciales por defecto si Supabase no tiene tabla etl_connections */
const DEFAULT_CONNECTIONS: Omit<ConnectionRow, "id" | "created_at" | "updated_at">[] = [
  { name: "ARIMANA_OLTP", server: "db.xhqvdhdftvgnwrgedafz.supabase.co", engine: "PostgreSQL", database: "postgres", username: "postgres", credential_configured: true, status: "active" },
  { name: "siga_1646", server: "siga.minsa.gob.pe", engine: "SQL Server", database: "SIGA_ACOBAMBA_1646", username: "siga_b2g_reader", credential_configured: true, status: "active" },
  { name: "SamarImportadora", server: "sql.samarimportadora.pe", engine: "SQL Server", database: "BD_SAMAR_COMERCIAL", username: "etl_samar", credential_configured: true, status: "active" },
  { name: "DW_SamarImportadora", server: "dw.samarimportadora.pe", engine: "SQL Server", database: "DW_SAMAR_HISTORICO", username: "etl_dw_reader", credential_configured: true, status: "active" },
  { name: "CASTILLONV2", server: "sql.castillondistribucion.pe", engine: "SQL Server", database: "CASTILLON_V2", username: "etl_castillon", credential_configured: true, status: "active" },
  { name: "BD_CASTILLON_VETERINARIA", server: "sql.castillonagrovet.pe", engine: "SQL Server", database: "CASTILLON_VET", username: "etl_agrovet", credential_configured: true, status: "active" },
];

function mapConnection(row: ConnectionRow) {
  return {
    id: row.id,
    name: row.name,
    server: row.server,
    engine: row.engine,
    database: row.database,
    username: row.username,
    credentialConfigured: row.credential_configured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
  };
}

export const GET: APIRoute = async () => {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseOltp();
      const { data, error } = await supabase
        .from("etl_connections")
        .select("*")
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        return new Response(JSON.stringify((data as ConnectionRow[]).map(mapConnection)), {
          status: 200, headers: { "Content-Type": "application/json" },
        });
      }
      // Si la tabla existe pero está vacía, devolver defaults
      if (!error) {
        const now = new Date().toISOString();
        const defaults = DEFAULT_CONNECTIONS.map((c, i) => ({
          id: `conn-default-${i}`,
          ...c,
          created_at: now,
          updated_at: now,
        }));
        return new Response(JSON.stringify(defaults.map(mapConnection)), {
          status: 200, headers: { "Content-Type": "application/json" },
        });
      }
    } catch {
      // tabla no existe o error de red — devolver defaults
    }
  }

  // Sin Supabase: devolver defaults estáticos
  const now = new Date().toISOString();
  const defaults = DEFAULT_CONNECTIONS.map((c, i) => ({
    id: `conn-default-${i}`,
    ...c,
    created_at: now,
    updated_at: now,
  }));
  return new Response(JSON.stringify(defaults.map(mapConnection)), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({})) as {
      name?: string; server?: string; engine?: string;
      database?: string; username?: string; password?: string;
    };

    const name = String(body.name ?? "").trim() as EtlSourceName;
    if (!ETL_SOURCE_NAMES.includes(name)) {
      return new Response(
        JSON.stringify({ error: { code: 400, message: `Fuente no autorizada. Debe ser una de: ${ETL_SOURCE_NAMES.join(", ")}` } }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const now = new Date().toISOString();
    const newConn = {
      id: `conn-${Date.now()}`,
      name,
      server: String(body.server ?? "localhost").trim(),
      engine: String(body.engine ?? "PostgreSQL").trim(),
      database: String(body.database ?? `db_${name}`).trim(),
      username: String(body.username ?? "etl_user").trim(),
      credentialConfigured: Boolean(body.password?.trim()),
      createdAt: now,
      updatedAt: now,
      status: "active" as const,
    };

    // Intentar persistir en Supabase
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseOltp();
        await supabase.from("etl_connections").upsert({
          id: newConn.id,
          name: newConn.name,
          server: newConn.server,
          engine: newConn.engine,
          database: newConn.database,
          username: newConn.username,
          credential_configured: newConn.credentialConfigured,
          created_at: now,
          updated_at: now,
          status: "active",
        });
      } catch {
        // No bloquear si falla la persistencia
      }
    }

    return new Response(JSON.stringify(newConn), {
      status: 201, headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: { code: 400, message: error instanceof Error ? error.message : "Error al registrar conexión." } }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
};
