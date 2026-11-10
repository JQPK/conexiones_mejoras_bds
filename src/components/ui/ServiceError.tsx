import { AlertTriangle, RefreshCw } from "lucide-react";

interface ServiceErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function ServiceError({ message = "No se pudo conectar con la base de datos. Intenta más tarde.", onRetry }: ServiceErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
      <AlertTriangle className="text-amber-500" size={36} />
      <div>
        <p className="font-semibold text-amber-900">Servicio no disponible</p>
        <p className="mt-1 text-sm text-amber-700">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-200"
        >
          <RefreshCw size={14} />
          Reintentar
        </button>
      )}
    </div>
  );
}
