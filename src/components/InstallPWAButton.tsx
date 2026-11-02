import React, { useState } from 'react';
import { usePWAInstall } from '../utils/pwa';
import { Download, Smartphone, CheckCircle2, Info, X, Share } from 'lucide-react';

interface InstallPWAButtonProps {
  variant?: 'sidebar' | 'banner' | 'card';
}

export const InstallPWAButton: React.FC<InstallPWAButtonProps> = ({ variant = 'sidebar' }) => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showIosInstructions, setShowIosInstructions] = useState<boolean>(false);

  if (isInstalled) {
    if (variant === 'sidebar') {
      return (
        <div className="flex items-center gap-2 text-emerald-300 text-label-sm font-semibold bg-white/10 px-3 py-2 rounded-xl">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>App Instalada y Offline</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-body-md">
        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
        <div>
          <span className="font-bold block">Aplicación Instalada (PWA)</span>
          <span className="text-label-sm block text-emerald-800">
            PlazoFijo Pro está ejecutándose como aplicación independiente sin conexión.
          </span>
        </div>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosInstructions(true);
      return;
    }

    if (isInstallable) {
      await promptInstall();
    } else {
      // General instructions modal/alert if prompt not directly triggered by browser
      setShowIosInstructions(true);
    }
  };

  return (
    <>
      {variant === 'sidebar' && (
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-tertiary-fixed hover:bg-tertiary-fixed-dim text-tertiary font-bold rounded-xl transition-colors shadow-xs text-body-md text-left"
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 shrink-0" />
            <span>Instalar App PWA</span>
          </div>
          <Download className="w-4 h-4 shrink-0" />
        </button>
      )}

      {variant === 'banner' && (
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0 mt-0.5 sm:mt-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-primary text-body-md">Instalá PlazoFijo Pro en tu dispositivo</h4>
              <p className="text-label-sm text-on-surface-variant">
                Accedé rápidamente desde la pantalla de inicio y usá la aplicación sin conexión a Internet.
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="w-full sm:w-auto px-4 py-2 bg-primary hover:bg-secondary text-on-primary font-bold rounded-xl text-body-md transition-colors shrink-0 flex items-center justify-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Instalar Aplicación</span>
          </button>
        </div>
      )}

      {/* Manual Instructions Modal for iOS or Browsers without automatic prompt */}
      {showIosInstructions && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl shadow-xl border border-outline-variant/30 p-space-lg space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="text-title-md font-bold text-primary flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-secondary" />
                <span>Cómo Instalar PlazoFijo Pro</span>
              </h3>
              <button
                onClick={() => setShowIosInstructions(false)}
                className="p-1 hover:bg-surface-container rounded-lg text-on-surface-variant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-body-md text-on-surface-variant">
              {isIOS ? (
                <>
                  <p>En dispositivos Apple (iOS / Safari):</p>
                  <ol className="list-decimal list-inside space-y-2 text-label-md font-medium">
                    <li>
                      Tocá el botón <span className="font-bold text-primary">Compartir</span>{' '}
                      <Share className="w-4 h-4 inline text-secondary" /> en la barra inferior de Safari.
                    </li>
                    <li>
                      Buscá y seleccioná la opción{' '}
                      <span className="font-bold text-primary">"Añadir a la pantalla de inicio"</span>.
                    </li>
                    <li>
                      Confirmá tocando <span className="font-bold text-primary">"Añadir"</span> arriba a la derecha.
                    </li>
                  </ol>
                </>
              ) : (
                <>
                  <p>En navegadores Android o Escritorio (Chrome, Edge, Firefox, Brave):</p>
                  <ol className="list-decimal list-inside space-y-2 text-label-md font-medium">
                    <li>
                      Abrí el menú del navegador (<span className="font-bold text-primary">⋮</span> o tres puntos arriba a la derecha).
                    </li>
                    <li>
                      Seleccioná <span className="font-bold text-primary">"Instalar aplicación"</span> o{' '}
                      <span className="font-bold text-primary">"Añadir a la pantalla principal"</span>.
                    </li>
                    <li>Aceptá la confirmación para instalar.</li>
                  </ol>
                </>
              )}
            </div>

            <div className="p-3 bg-surface-container-low rounded-xl flex items-start gap-2 text-label-sm text-on-surface-variant">
              <Info className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <span>
                Una vez instalada, la aplicación funcionará de forma independiente y sin requerir conexión a red.
              </span>
            </div>

            <button
              onClick={() => setShowIosInstructions(false)}
              className="w-full py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:bg-secondary transition-colors text-body-md"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
