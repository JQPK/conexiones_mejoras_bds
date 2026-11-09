import { useState } from "react";
import { localRepository } from "@/persistence/database";
import { RefreshCw, Database, CheckCircle2 } from "lucide-react";

export function SyncRealDataButton() {
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSync() {
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      await localRepository.resetWithRealData();
      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al sincronizar datos reales");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-xl border border-border-default bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
            <Database size={16} aria-hidden="true" /> Base de Datos & Nube
          </p>
          <p className="mt-2 font-bold text-slate-800">Supabase Cloud + Persistencia Local</p>
          <p className="mt-1 text-xs text-text-secondary">
            Conectado a Supabase OLTP y DW. 1,321 clientes reales (con SIGA UE 1646) y 4,438 productos.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-hover disabled:opacity-60"
        >
          <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
          {busy ? "Sincronizando…" : "Sincronizar Datos Reales"}
        </button>
      </div>

      {success && (
        <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-600">
          <CheckCircle2 size={14} /> ¡Datos reales cargados exitosamente! Recargando...
        </p>
      )}
      {error && <p className="mt-3 text-xs font-semibold text-rose-600">{error}</p>}
    </article>
  );
}
