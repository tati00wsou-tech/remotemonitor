import React, { useEffect } from 'react';
import { Download, Smartphone, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function DownloadAPK() {
  const apkUrl = '/api/apk/download/demo/faztudo-monitor-latest.apk';

  useEffect(() => {
    // Simular download automático do APK
    // Em produção, isso geraria um APK real via EAS Build
    const downloadAPK = () => {
      // URL do APK (em produção, seria gerada dinamicamente)
      // Criar elemento de link e disparar download
      const link = document.createElement('a');
      link.href = apkUrl;
      link.download = 'FazTudo-Monitor.apk';
      link.click();
    };

    // Aguardar um pouco e iniciar download
    const timer = setTimeout(downloadAPK, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Download Card */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-slate-800/50 backdrop-blur-xl border-cyan-400/30 p-8">
          <div className="text-center">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center animate-pulse">
                <Download className="w-10 h-10 text-slate-900" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-cyan-300 mb-2">FazTudo Monitor</h1>
            <p className="text-slate-400 mb-6">Seu APK está sendo baixado...</p>

            {/* Status */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>APK gerado com sucesso</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Download className="w-5 h-5 text-cyan-400 animate-bounce" />
                <span>Baixando para seu dispositivo...</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-slate-700/30 border border-cyan-400/20 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-sm font-semibold text-cyan-300 mb-3">Próximos Passos:</h3>
              <ol className="space-y-2 text-xs text-slate-300">
                <li>1. Aguarde o download terminar</li>
                <li>2. Abra o gerenciador de arquivos</li>
                <li>3. Localize o arquivo FazTudo-Monitor.apk</li>
                <li>4. Clique para instalar</li>
                <li>5. Ative "Fontes Desconhecidas" se solicitado</li>
              </ol>
            </div>

            {/* Manual Download Link */}
            <a
              href={apkUrl}
              download="FazTudo-Monitor.apk"
              className="inline-block w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              📥 Clique aqui se o download não iniciou
            </a>

            {/* Footer */}
            <p className="text-xs text-slate-500 mt-6">
              © 2026 FazTudo Tecnologia Ltda
            </p>
          </div>
        </Card>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
