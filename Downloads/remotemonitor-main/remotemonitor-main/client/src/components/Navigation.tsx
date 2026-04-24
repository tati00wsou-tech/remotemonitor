import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Home, 
  Smartphone, 
  AlertCircle, 
  Clock, 
  Map, 
  BarChart3, 
  Shield, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function Navigation() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const username = localStorage.getItem('username') || 'Admin';

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    setLocation('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: Home, path: '/' },
    { label: 'Dispositivos', icon: Smartphone, path: '/devices' },
    { label: 'Alertas', icon: AlertCircle, path: '/alerts' },
    { label: 'Eventos', icon: Clock, path: '/events' },
    { label: 'Mapa', icon: Map, path: '/map' },
    { label: 'Relatórios', icon: BarChart3, path: '/corporate-reports' },
    { label: 'Conformidade', icon: Shield, path: '/lgpd-compliance' },
    { label: 'Gerar APK', icon: Download, path: '/apk-builder', highlight: true },
    { label: 'Funcionalidades', icon: Smartphone, path: '/features' },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-cyan-400 hover:bg-slate-700/50"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <nav className={`
        fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-950 
        border-r border-cyan-400/20 p-6 overflow-y-auto z-40
        transition-transform duration-300 md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-cyan-300">FazTudo</h1>
              <p className="text-xs text-slate-400">Monitor</p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-cyan-400/20 to-transparent"></div>
        </div>

        {/* User Info */}
        <div className="mb-6 p-3 bg-slate-800/50 rounded-lg border border-cyan-400/20">
          <p className="text-xs text-slate-400">Logado como</p>
          <p className="text-sm font-semibold text-cyan-300">{username}</p>
        </div>

        {/* Navigation Items */}
        <div className="space-y-2 mb-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => {
                  setLocation(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${item.highlight
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-cyan-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
                {item.highlight && <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded">NOVO</span>}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-cyan-400/20 to-transparent mb-6"></div>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-400/30 flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-cyan-400/20">
          <p className="text-xs text-slate-500 text-center">
            © 2026 FazTudo Tecnologia
          </p>
          <p className="text-xs text-slate-600 text-center mt-2">
            Painel de Monitoramento Corporativo
          </p>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
