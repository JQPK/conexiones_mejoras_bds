import type { APIRoute } from "astro";

export const prerender = false;

export const PUT: APIRoute = async ({ params, request }) => {
  const { id } = params;
  const body = await request.json().catch(() => ({}));

  return new Response(
    JSON.stringify({
      id: id || "conn-01",
      name: body.name || "ARIMANA_OLTP",
      server: body.server || "servidor-actualizado.cloud",
      engine: body.engine || "PostgreSQL",
      database: body.database || "db_arimana",
      username: body.username || "etl_user",
      credentialConfigured: true,
      updatedAt: new Date().toISOString(),
      status: "active",
      message: `Conexión '${id}' actualizada correctamente.`,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};

export const DELETE: APIRoute = async ({ params }) => {
  const { id } = params;

  return new Response(
    JSON.stringify({
      id,
      message: `Conexión '${id}' eliminada exitosamente del registro ETL.`,
      deletedAt: new Date().toISOString(),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
