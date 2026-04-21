import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";
import Home from "./pages/Home";

interface User {
  email: string;
  name: string;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | undefined>();
  const [loading, setLoading] = useState(true);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      // Simular carregamento de usuário
      setUser({
        email: "admin@faztudo.com",
        name: "Administrador",
      });
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (email: string, password: string) => {
    // Validação simples (credenciais de teste)
    if (email && password) {
      localStorage.setItem("auth_token", "token_" + Date.now());
      setUser({
        email: email,
        name: email.split("@")[0],
      });
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setUser(undefined);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          {!isAuthenticated ? (
            <Login onLogin={handleLogin} loading={false} />
          ) : (
            <Home user={user} onLogout={handleLogout} />
          )}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
