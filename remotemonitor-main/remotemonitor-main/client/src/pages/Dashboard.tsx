import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Smartphone, AlertCircle, Shield, BarChart3, Download, Zap, Lock } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Título */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-cyan-300 mb-2">Dashboard</h1>
          <p className="text-slate-400">Bem-vindo ao painel de monitoramento corporativo</p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Dispositivos Ativos */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border-cyan-400/30 p-6 hover:border-cyan-400/60 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Dispositivos Ativos</p>
                <h3 className="text-3xl font-bold text-cyan-300">12</h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </Card>

          {/* Alertas Hoje */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border-cyan-400/30 p-6 hover:border-cyan-400/60 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Alertas Hoje</p>
                <h3 className="text-3xl font-bold text-orange-300">3</h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </Card>

          {/* Conformidade LGPD */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border-cyan-400/30 p-6 hover:border-cyan-400/60 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Conformidade LGPD</p>
                <h3 className="text-3xl font-bold text-green-300">100%</h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </Card>

          {/* Relatórios */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border-cyan-400/30 p-6 hover:border-cyan-400/60 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Relatórios</p>
                <h3 className="text-3xl font-bold text-purple-300">8</h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ações Rápidas */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border-cyan-400/30 p-6">
            <h2 className="text-xl font-bold text-cyan-300 mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Ações Rápidas
            </h2>
            <div className="space-y-3">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Gerar APK
              </Button>
              <Button className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-400/30 font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                <Smartphone className="w-5 h-5" />
                Gerenciar Dispositivos
              </Button>
              <Button className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-400/30 font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" />
                Conformidade LGPD
              </Button>
            </div>
          </Card>

          {/* Informações */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border-cyan-400/30 p-6">
            <h2 className="text-xl font-bold text-cyan-300 mb-6">ℹ️ Informações</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-white">Sistema de monitoramento corporativo completo</p>
                  <p className="text-xs text-slate-400">Monitore múltiplos dispositivos em tempo real</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-white">Conformidade LGPD/GDPR garantida</p>
                  <p className="text-xs text-slate-400">Proteção de dados e privacidade asseguradas</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-white">Gerador de APK dinâmico integrado</p>
                  <p className="text-xs text-slate-400">Crie APKs customizados em minutos</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-white">Suporte a múltiplos dispositivos por cliente</p>
                  <p className="text-xs text-slate-400">Gerencie toda a frota corporativa</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-white">Alertas em tempo real</p>
                  <p className="text-xs text-slate-400">Receba notificações instantâneas de eventos</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
