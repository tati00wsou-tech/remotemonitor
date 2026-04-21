import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Dashboard from "./Dashboard";
import DevicesPage from "./Devices";
import AlertsPage from "./Alerts";
import EventsPage from "./Events";
import MapPage from "./Map";
import ReportsPage from "./Reports";
import CompliancePage from "./Compliance";
import APKBuilderPage from "./APKBuilder";
import APKPanel from "./APKPanel";

type PageType = "dashboard" | "devices" | "alerts" | "events" | "map" | "reports" | "compliance" | "apk-builder";

const pathToPage: Record<string, PageType> = {
  "/": "dashboard",
  "/devices": "devices",
  "/alerts": "alerts",
  "/events": "events",
  "/map": "map",
  "/reports": "reports",
  "/compliance": "compliance",
  "/apk-builder": "apk-builder",
};

const pageToPath: Record<PageType, string> = {
  dashboard: "/",
  devices: "/devices",
  alerts: "/alerts",
  events: "/events",
  map: "/map",
  reports: "/reports",
  compliance: "/compliance",
  "apk-builder": "/apk-builder",
};

interface User {
  email: string;
  name: string;
}

interface HomeProps {
  user?: User;
  onLogout: () => void;
}

export default function Home({ user, onLogout }: HomeProps) {
  const [currentPage, setCurrentPage] = useState<PageType>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [pathname, navigate] = useLocation();

  // Detectar mudanças de tamanho de tela
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const resolvedPage = pathToPage[pathname] ?? "dashboard";
    setCurrentPage(resolvedPage);
  }, [pathname]);

  const handleNavigate = (page: PageType) => {
    setCurrentPage(page);
    navigate(pageToPath[page]);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Check if we're on APK panel
  const isAPKPanel = pathname === '/apk-panel';

  const renderPage = () => {
    if (isAPKPanel) {
      return <APKPanel />;
    }

    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "devices":
        return <DevicesPage />;
      case "alerts":
        return <AlertsPage />;
      case "events":
        return <EventsPage />;
      case "map":
        return <MapPage />;
      case "reports":
        return <ReportsPage />;
      case "compliance":
        return <CompliancePage />;
      case "apk-builder":
        return <APKBuilderPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        user={user}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900/50 backdrop-blur-xl border-b border-cyan-400/30 sticky top-0 z-40">
          <div className="px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  {sidebarOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              )}
              <h1 className="text-2xl font-bold text-cyan-300">🖥️ Painel de Monitoramento</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.name || "Usuário"}</p>
                <p className="text-xs text-slate-400">{user?.email || "admin@faztudo.com"}</p>
              </div>
              <Button
                onClick={onLogout}
                variant="outline"
                className="border-red-400/30 text-red-300 hover:bg-red-900/20"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {renderPage()}
        </div>
      </div>

      {/* Overlay para mobile quando sidebar está aberta */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
