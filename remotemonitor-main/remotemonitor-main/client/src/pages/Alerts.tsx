import { Card } from "@/components/ui/card";

export default function AlertsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-300 mb-2">Alertas</h1>
        <p className="text-slate-400 mb-8">Gerencie alertas e notificações</p>

        <Card className="bg-slate-900/50 backdrop-blur-xl border-cyan-400/30 p-8 text-center">
          <p className="text-slate-400">Página de Alertas em desenvolvimento</p>
        </Card>
      </div>
    </div>
  );
}
