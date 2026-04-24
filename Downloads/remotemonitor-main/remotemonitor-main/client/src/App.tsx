import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { trpc } from "@/lib/trpc";
import Login from "./pages/Login";
import Home from "./pages/Home";

interface User {
  email: string;
  name: string;
}

function App() {
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await meQuery.refetch();
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogin = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      window.location.href = "/";
    }
  };
  if (meQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-300">Carregando...</p>
        </div>
      </div>
    );
  }

  const user: User | undefined = meQuery.data
    ? {
        email: meQuery.data.email ?? "",
        name: meQuery.data.name || meQuery.data.email || "Administrador",
      }
    : undefined;

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          {!user ? (
            <Login
              onLogin={handleLogin}
              loading={loginMutation.isPending}
              error={loginMutation.error?.message}
            />
          ) : (
            <Home user={user} onLogout={handleLogout} />
          )}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
