import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Smartphone,
  AlertCircle,
  Calendar,
  Map,
  BarChart3,
  Shield,
  Download,
  LogOut,
  X,
} from "lucide-react";

type PageType = "dashboard" | "devices" | "alerts" | "events" | "map" | "reports" | "compliance" | "apk-builder";

interface User {
  email?: string;
  name?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  onLogout: () => void;
  user?: User;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "devices", label: "Dispositivos", icon: Smartphone },
  { id: "alerts", label: "Alertas", icon: AlertCircle },
  { id: "events", label: "Eventos", icon: Calendar },
  { id: "map", label: "Mapa", icon: Map },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
  { id: "compliance", label: "Conformidade", icon: Shield },
];

export default function Sidebar({
  isOpen,
  onClose,
  currentPage,
  onNavigate,
  onLogout,
  user,
}: SidebarProps) {
  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed md:static top-0 left-0 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-cyan-400/30 flex flex-col transition-transform duration-300 z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-cyan-400/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-lg">📱</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">FazTudo</h1>
                <p className="text-xs text-slate-400">Monitor</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="bg-slate-800/50 rounded-lg p-3 border border-cyan-400/20">
            <p className="text-xs text-slate-400">Logado como</p>
            <p className="text-sm font-medium text-cyan-300 truncate">
              {user?.name || "admin"}
            </p>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as PageType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                    : "text-slate-300 hover:bg-slate-800/50 hover:text-cyan-300"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* APK Builder Button */}
        <div className="px-4 py-4 border-t border-cyan-400/30 space-y-3">
          <Button
            onClick={() => onNavigate("apk-builder")}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
              currentPage === "apk-builder"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
            }`}
          >
            <Download className="w-5 h-5" />
            Gerar APK
            <span className="ml-auto bg-cyan-400 text-blue-900 text-xs font-bold px-2 py-1 rounded">
              NOVO
            </span>
          </Button>

          {/* Logout Button */}
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full border-red-400/30 text-red-300 hover:bg-red-900/20 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-cyan-400/30 text-center">
          <p className="text-xs text-slate-500">
            © 2026 FazTudo Tecnologia
          </p>
          <p className="text-xs text-slate-600">
            Painel de Monitoramento Corporativo
          </p>
        </div>
      </div>
    </>
  );
}
