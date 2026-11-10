import { describe, it, expect, beforeAll } from "vitest";
import { getSupabaseOltp, getSupabaseDw, isSupabaseConfigured, isDwConfigured } from "@/lib/supabase";

describe("Integración en Tiempo Real con Supabase Cloud (OLTP + DW)", () => {
  beforeAll(() => {
    if (typeof process !== "undefined" && typeof process.loadEnvFile === "function") {
      try {
        process.loadEnvFile(".env");
      } catch {
        // .env ya cargado o no disponible
      }
    }
  });

  it("verifica configuración de conexiones duales a Supabase", () => {
    expect(isSupabaseConfigured()).toBe(true);
    expect(isDwConfigured()).toBe(true);
  });

  it("OLTP: consulta usuarios reales en Supabase (users table)", async () => {
    const supabase = getSupabaseOltp();
    const { data, error, count } = await supabase
      .from("users")
      .select("id, username, display_name, role, status", { count: "exact" })
      .eq("status", "active")
      .limit(10);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
    expect(count).toBe(160);

    const first = data![0];
    expect(first.id).toBeTruthy();
    expect(first.username).toBeTruthy();
    expect(first.role).toBeTruthy();
  });

  it("OLTP: consulta clientes reales con personas y empresas asociadas", async () => {
    const supabase = getSupabaseOltp();
    const { data, error, count } = await supabase
      .from("customers")
      .select("id, kind, status, persons(document_number, first_name), companies(ruc, legal_name)", { count: "exact" })
      .limit(10);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(count).toBe(1321);
  });

  it("OLTP: consulta catálogo de productos (4,438) y categorías (24)", async () => {
    const supabase = getSupabaseOltp();
    const [{ count: productsCount, error: pError }, { count: catCount, error: cError }] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("categories").select("*", { count: "exact", head: true }),
    ]);

    expect(pError).toBeNull();
    expect(cError).toBeNull();
    expect(productsCount).toBe(4438);
    expect(catCount).toBe(24);
  });

  it("OLTP: consulta sucursales (83) y vendedores (156)", async () => {
    const supabase = getSupabaseOltp();
    const [{ count: branchCount, error: bError }, { count: sellerCount, error: sError }] = await Promise.all([
      supabase.from("branches").select("*", { count: "exact", head: true }),
      supabase.from("sellers").select("*", { count: "exact", head: true }),
    ]);

    expect(bError).toBeNull();
    expect(sError).toBeNull();
    expect(branchCount).toBe(83);
    expect(sellerCount).toBe(156);
  });

  it("OLTP: consulta transacciones de ventas reales (26,405)", async () => {
    const supabase = getSupabaseOltp();
    const { count, error } = await supabase
      .from("sales")
      .select("*", { count: "exact", head: true });

    expect(error).toBeNull();
    expect(count).toBe(26405);
  });

  it("OLAP / DW: consulta fact_ventas (35,486 filas) en Supabase DW", async () => {
    const dw = getSupabaseDw();
    const { data, error, count } = await dw
      .from("fact_ventas")
      .select("id_fact_venta, importe_total, utilidad_bruta, tipo_negocio", { count: "exact" })
      .limit(5);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBe(5);
    expect(count).toBe(35486);

    const sample = data![0];
    expect(sample.importe_total).toBeGreaterThan(0);
  });

  it("ETL Pipeline: registra y completa una ejecución en Supabase con auditoría real", async () => {
    const supabase = getSupabaseOltp();

    // Obtener un usuario real para cumplir la foreign key constraint de audit_logs.actor_id
    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("status", "active")
      .limit(1)
      .single();

    const realActorId = userRow?.id ?? "USR-ADMIN-1";
    const testExecutionId = `test_exec_${Date.now()}`;
    const now = new Date().toISOString();

    // 1. Insertar ejecución de prueba
    const { error: insertError } = await supabase.from("etl_executions").insert({
      id: testExecutionId,
      source_names: ["ARIMANA_OLTP", "siga_1646"],
      state: "running",
      started_at: now,
      log: ["[test] Ejecución de prueba de integración Supabase"],
      extracted: 100,
      transformed: 100,
      loaded: 100,
      rejected: 0,
      duration_seconds: 0.1,
      status: "active",
    });

    expect(insertError).toBeNull();

    // 2. Actualizar estado
    const { error: updateError } = await supabase
      .from("etl_executions")
      .update({
        state: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", testExecutionId);

    expect(updateError).toBeNull();

    // 3. Registrar auditoría real con actor_id válido
    const auditId = crypto.randomUUID();
    const { error: auditError } = await supabase.from("audit_logs").insert({
      id: auditId,
      actor_id: realActorId,
      action: "ETL_TEST_VERIFIED",
      target: testExecutionId,
      result: "success",
      message: "Validación de integración contra Supabase exitosa.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
    });

    expect(auditError).toBeNull();

    // 4. Limpieza del registro de auditoría y ejecución de prueba
    await supabase.from("audit_logs").delete().eq("id", auditId);
    await supabase.from("etl_executions").delete().eq("id", testExecutionId);
  });
});
