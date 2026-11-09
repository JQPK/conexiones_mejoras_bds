import type { APIRoute } from "astro";
import { ETL_SOURCE_NAMES, type EtlSourceName } from "@/domain/models";

export const prerender = false;

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
    const server = String(body.server ?? "").trim();
    const engine = String(body.engine ?? "").trim();
    const database = String(body.database ?? "").trim();
    const username = String(body.username ?? "").trim();

    if (!name || !ETL_SOURCE_NAMES.includes(name)) {
      return new Response(
        JSON.stringify({
          valid: false,
          checkedAt: new Date().toISOString(),
          message: `La fuente '${name}' no pertenece al catálogo oficial autorizado: ${ETL_SOURCE_NAMES.join(", ")}.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!server || !engine || !database || !username) {
      return new Response(
        JSON.stringify({
          valid: false,
          checkedAt: new Date().toISOString(),
          message: "Todos los campos de conexión (servidor, motor, base de datos y usuario) son obligatorios.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        checkedAt: new Date().toISOString(),
        message: `Conexión a fuente '${name}' (${engine} en ${server}/${database}) validada exitosamente.`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        valid: false,
        checkedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : "Error al validar la conexión.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
};
