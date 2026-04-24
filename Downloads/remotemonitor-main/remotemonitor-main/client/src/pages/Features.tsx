import MainLayout from '@/components/MainLayout';
import { Card } from '@/components/ui/card';
import {
  Smartphone,
  MapPin,
  AlertCircle,
  BarChart3,
  Shield,
  Download,
  Clock,
  Users,
  Lock,
  Zap,
  Eye,
  Bell,
} from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: Smartphone,
      title: 'Monitoramento de Dispositivos',
      description: 'Rastreie múltiplos dispositivos Android em tempo real com informações detalhadas do sistema.',
      color: 'from-blue-600 to-cyan-600',
    },
    {
      icon: MapPin,
      title: 'Localização GPS',
      description: 'Visualize a localização exata de cada dispositivo em um mapa interativo com histórico de movimentação.',
      color: 'from-green-600 to-emerald-600',
    },
    {
      icon: Eye,
      title: 'Captura de Screenshots',
      description: 'Capture screenshots dos dispositivos monitorados para auditoria e conformidade.',
      color: 'from-purple-600 to-pink-600',
    },
    {
      icon: Zap,
      title: 'Monitoramento de Apps',
      description: 'Veja todos os aplicativos abertos e instalados em cada dispositivo em tempo real.',
      color: 'from-orange-600 to-red-600',
    },
    {
      icon: AlertCircle,
      title: 'Alertas Inteligentes',
      description: 'Configure alertas automáticos para acesso a bancos, mudança de localização, bateria baixa e mais.',
      color: 'from-yellow-600 to-orange-600',
    },
    {
      icon: Bell,
      title: 'Notificações em Tempo Real',
      description: 'Receba notificações instantâneas por email ou push quando eventos importantes ocorrem.',
      color: 'from-red-600 to-pink-600',
    },
    {
      icon: BarChart3,
      title: 'Relatórios Detalhados',
      description: 'Gere relatórios completos de produtividade, uso de apps, localização e atividades.',
      color: 'from-indigo-600 to-purple-600',
    },
    {
      icon: Shield,
      title: 'Conformidade LGPD/GDPR',
      description: 'Sistema completo com direitos de acesso, exclusão, correção e auditoria de dados.',
      color: 'from-green-600 to-teal-600',
    },
    {
      icon: Lock,
      title: 'Bloqueio Remoto de Tela',
      description: 'Bloqueie remotamente a tela de um dispositivo com PIN de desbloqueio.',
      color: 'from-red-600 to-orange-600',
    },
    {
      icon: Users,
      title: 'Múltiplos Clientes',
      description: 'Gerencie múltiplos clientes e dispositivos em um único painel centralizado.',
      color: 'from-blue-600 to-purple-600',
    },
    {
      icon: Download,
      title: 'Gerador de APK Dinâmico',
      description: 'Gere APKs customizados diretamente do painel para distribuição aos clientes.',
      color: 'from-cyan-600 to-blue-600',
    },
    {
      icon: Clock,
      title: 'Histórico Completo',
      description: 'Acesse o histórico completo de eventos, localização e atividades de cada dispositivo.',
      color: 'from-slate-600 to-gray-600',
    },
  ];

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-cyan-300 mb-2">Funcionalidades do Painel</h1>
          <p className="text-slate-400">Conheça todos os recursos disponíveis no FazTudo Monitor</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="bg-slate-800/50 border-cyan-400/20 p-6 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20"
              >
                <div className={`bg-gradient-to-br ${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-cyan-300 mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-cyan-400/20 p-6">
            <h2 className="text-xl font-bold text-cyan-300 mb-4">✅ Conformidade Legal</h2>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>✓ LGPD/GDPR compliant</li>
              <li>✓ Direito de acesso aos dados</li>
              <li>✓ Direito de exclusão</li>
              <li>✓ Direito de correção</li>
              <li>✓ Auditoria completa</li>
              <li>✓ Retenção automática de 12 meses</li>
            </ul>
          </Card>

          <Card className="bg-slate-800/50 border-cyan-400/20 p-6">
            <h2 className="text-xl font-bold text-cyan-300 mb-4">🔒 Segurança</h2>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>✓ Autenticação OAuth</li>
              <li>✓ Criptografia de dados</li>
              <li>✓ Validação de tipos TypeScript</li>
              <li>✓ Rate limiting</li>
              <li>✓ Logs de auditoria imutáveis</li>
              <li>✓ Consentimento obrigatório</li>
            </ul>
          </Card>
        </div>

        {/* How to Use */}
        <Card className="bg-slate-800/50 border-cyan-400/20 p-6 mt-6">
          <h2 className="text-xl font-bold text-cyan-300 mb-4">📱 Como Usar</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">
                1
              </div>
              <p className="text-slate-300 text-sm">
                <strong>Gere o APK</strong>
                <br />
                Use o gerador de APK
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">
                2
              </div>
              <p className="text-slate-300 text-sm">
                <strong>Distribua</strong>
                <br />
                Envie o link aos clientes
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">
                3
              </div>
              <p className="text-slate-300 text-sm">
                <strong>Instale</strong>
                <br />
                Clientes instalam no Android
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">
                4
              </div>
              <p className="text-slate-300 text-sm">
                <strong>Monitore</strong>
                <br />
                Veja dados em tempo real
              </p>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
