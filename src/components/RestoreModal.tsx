import React, { useState } from 'react';
import { BackupData, BackupValidationResult } from '../types';
import { formatCurrencyARS, formatDateAR } from '../utils/financial';
import {
  Database,
  AlertTriangle,
  CheckCircle2,
  X,
  ShieldAlert,
  FileText,
  Landmark,
  Calendar,
  Layers
} from 'lucide-react';

interface RestoreModalProps {
  isOpen: boolean;
  backupData: BackupData | null;
  validation: BackupValidationResult | null;
  onClose: () => void;
  onConfirmRestore: (data: BackupData, mode: 'REPLACE' | 'MERGE') => Promise<void>;
}

export const RestoreModal: React.FC<RestoreModalProps> = ({
  isOpen,
  backupData,
  validation,
  onClose,
  onConfirmRestore,
}) => {
  const [isConfirmChecked, setIsConfirmChecked] = useState<boolean>(false);
  const [mode, setMode] = useState<'REPLACE' | 'MERGE'>('REPLACE');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !backupData || !validation) return null;

  const handleConfirm = async () => {
    if (!isConfirmChecked) return;
    setIsSubmitting(true);
    try {
      await onConfirmRestore(backupData, mode);
      onClose();
    } catch (err) {
      console.error('Error durante la restauración:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-container-lowest max-w-xl w-full rounded-2xl shadow-xl border border-outline-variant/30 p-space-lg space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-secondary" />
            <h3 className="text-title-lg font-bold text-primary">Vista Previa y Confirmación de Respaldo</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Errors */}
        {!validation.isValid ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-body-md">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Archivo de Respaldo Inválido o Corrupto</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-label-md text-rose-700">
              {validation.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
            <p className="text-label-sm text-rose-800 pt-2 border-t border-rose-200/60">
              Por razones de seguridad e integridad financiera, no es posible restaurar este archivo.
            </p>
          </div>
        ) : (
          <>
            {/* Metadata Info Card */}
            <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 space-y-3">
              <div className="flex items-center justify-between text-body-md">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-secondary" />
                  Fecha de exportación:
                </span>
                <span className="font-bold text-primary">
                  {validation.metadata.exportedAt
                    ? new Date(validation.metadata.exportedAt).toLocaleString('es-AR')
                    : 'No especificada'}
                </span>
              </div>
              <div className="flex items-center justify-between text-body-md">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-secondary" />
                  Versión de formato / App:
                </span>
                <span className="font-bold text-primary">
                  v{validation.metadata.backupVersion} (App v{validation.metadata.appVersion})
                </span>
              </div>
            </div>

            {/* Metrics Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-surface-container rounded-xl text-center">
                <span className="text-label-sm text-on-surface-variant block">Plazos Fijos</span>
                <span className="text-title-md font-bold text-primary">{validation.metadata.depositCount}</span>
              </div>
              <div className="p-3 bg-surface-container rounded-xl text-center">
                <span className="text-label-sm text-on-surface-variant block">Historial Eventos</span>
                <span className="text-title-md font-bold text-primary">{validation.metadata.eventCount}</span>
              </div>
              <div className="p-3 bg-surface-container rounded-xl text-center col-span-2 sm:col-span-1">
                <span className="text-label-sm text-on-surface-variant block">Capital Vigente</span>
                <span className="text-body-md font-bold text-primary">
                  {formatCurrencyARS(validation.metadata.activeCapitalTotal)}
                </span>
              </div>
            </div>

            {/* Warnings if any */}
            {validation.warnings.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-label-md">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Advertencias leves detectadas:</span>
                </div>
                <ul className="list-disc list-inside text-label-sm text-amber-800 max-h-24 overflow-y-auto space-y-0.5">
                  {validation.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mode selection */}
            <div className="space-y-2">
              <label className="text-label-md font-bold text-primary block">
                Modo de restauración:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('REPLACE')}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    mode === 'REPLACE'
                      ? 'border-secondary bg-secondary/10 text-primary font-bold'
                      : 'border-outline-variant/40 bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  <span className="block text-body-md">Reemplazo Total</span>
                  <span className="text-label-sm font-normal block text-on-surface-variant/80">
                    Sustituye la base local actual por completo.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('MERGE')}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    mode === 'MERGE'
                      ? 'border-secondary bg-secondary/10 text-primary font-bold'
                      : 'border-outline-variant/40 bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  <span className="block text-body-md">Combinar / Importar</span>
                  <span className="text-label-sm font-normal block text-on-surface-variant/80">
                    Actualiza o agrega registros sin borrar los existentes.
                  </span>
                </button>
              </div>
            </div>

            {/* Confirmation Box */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
              <div className="flex items-start gap-2 text-amber-900 text-body-md">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {mode === 'REPLACE'
                    ? '¡Atención! Esta acción borrará la información actual del navegador y la reemplazará con los datos de este archivo.'
                    : 'Esta acción combinará e insertará las inversiones del archivo en la base actual.'}
                </span>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConfirmChecked}
                  onChange={(e) => setIsConfirmChecked(e.target.checked)}
                  className="w-4 h-4 rounded text-secondary border-outline-variant focus:ring-secondary shrink-0"
                />
                <span className="text-label-md font-bold text-primary">
                  Comprendo los cambios y deseo proceder con la restauración
                </span>
              </label>
            </div>
          </>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high text-primary font-bold rounded-xl transition-colors text-body-md"
          >
            Cancelar
          </button>

          {validation.isValid && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isConfirmChecked || isSubmitting}
              className="px-5 py-2.5 bg-primary hover:bg-secondary text-on-primary font-bold rounded-xl transition-colors text-body-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-xs"
            >
              <Database className="w-4 h-4" />
              <span>{isSubmitting ? 'Restaurando...' : 'Ejecutar Restauración'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
