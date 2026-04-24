import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAudioAlert } from "@/hooks/useAudioAlert";

interface ConnectionNotificationProps {
  deviceName: string;
  bankName: string;
  onClose?: () => void;
}

export default function ConnectionNotification({
  deviceName,
  bankName,
  onClose,
}: ConnectionNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { playConnectionAlert } = useAudioAlert();

  useEffect(() => {
    // Reproduzir alerta sonoro quando aparecer
    playConnectionAlert();

    // Auto-fechar após 5 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 5000);

    return () => clearTimeout(timer);
  }, [playConnectionAlert, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
      <div className="bg-gradient-to-r from-green-900 to-emerald-900 border border-green-400/50 rounded-lg shadow-2xl p-4 max-w-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {/* Ícone de conexão */}
            <div className="mt-1">
              <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center animate-pulse">
                <div className="w-4 h-4 rounded-full bg-green-400"></div>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="flex-1">
              <h3 className="font-bold text-green-300 text-sm">
                ✅ Novo Cliente Conectado!
              </h3>
              <p className="text-green-200 text-xs mt-1">
                <span className="font-semibold">{deviceName}</span>
              </p>
              <p className="text-green-200/80 text-xs mt-1">
                🏦 Banco: <span className="font-semibold">{bankName}</span>
              </p>
              <p className="text-green-200/60 text-xs mt-2">
                Conectado em {new Date().toLocaleTimeString("pt-BR")}
              </p>
            </div>
          </div>

          {/* Botão fechar */}
          <button
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
            className="text-green-300 hover:text-green-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de progresso */}
        <div className="mt-3 h-1 bg-green-900/50 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 animate-pulse" 
               style={{
                 animation: "shrink 5s linear forwards"
               }}>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
