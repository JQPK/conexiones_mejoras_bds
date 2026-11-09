import type { APIRoute } from "astro";
import { isSupabaseConfigured, isDwConfigured, getSupabaseOltp, getSupabaseDw } from "@/lib/supabase";

export const prerender = false;

export const GET: APIRoute = async () => {
  const oltpConfigured = isSupabaseConfigured();
  const dwConfigured = isDwConfigured();

  let oltpStatus = "No configurado";
  let oltpConnected = false;
  let oltpTables: string[] = [];

  let dwStatus = "No configurado";
  let dwConnected = false;
  let dwTables: string[] = [];

  // 1. Probar Proyecto 1: OLTP
  if (oltpConfigured) {
    try {
      const oltp = getSupabaseOltp();
      const { error } = await oltp.from("users").select("id").limit(1);
      if (!error) {
        oltpConnected = true;
        oltpStatus = "Conectado exitosamente a Supabase OLTP";
        oltpTables = [
          "users", "customers", "persons", "companies", "categories",
          "products", "branches", "sellers", "sales", "sale_lines",
          "receipts", "payment_methods", "departments", "provinces",
          "districts", "etl_executions", "consolidated_rows", "audit_logs"
        ];
      } else {
        oltpStatus = `Error en consulta OLTP: ${error.message}`;
      }
    } catch (e) {
      oltpStatus = `Error conectando a OLTP: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  // 2. Probar Proyecto 2: OLAP / DW
  if (dwConfigured) {
    try {
      const dw = getSupabaseDw();
      const { error } = await dw.from("fact_ventas").select("id_fact_venta").limit(1);
      if (!error) {
        dwConnected = true;
        dwStatus = "Conectado exitosamente a Supabase DW (OLAP)";
        dwTables = [
          "dim_tiempo", "dim_cliente", "dim_producto", "dim_sucursal",
          "dim_empleado", "fact_ventas"
        ];
      } else {
        dwStatus = `Error en consulta DW: ${error.message}`;
      }
    } catch (e) {
      dwStatus = `Error conectando a DW: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return new Response(
    JSON.stringify({
      status: oltpConnected && dwConnected ? "ok" : "partial",
      timestamp: new Date().toISOString(),
      architecture: "Separación Física Total (2 Proyectos Supabase)",
      databases: {
        oltp: {
          project: "arimana-bazar (Transaccional)",
          url: "https://xhqvdhdftvgnwrgedafz.supabase.co",
          status: oltpStatus,
          connected: oltpConnected,
          tablesFound: oltpTables.length,
          tables: oltpTables,
        },
        olap: {
          project: "arimana-dw (Data Warehouse / Analítica)",
          url: "https://bsnwnxwaonfxoyxylqcj.supabase.co",
          status: dwStatus,
          connected: dwConnected,
          tablesFound: dwTables.length,
          tables: dwTables,
        },
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
