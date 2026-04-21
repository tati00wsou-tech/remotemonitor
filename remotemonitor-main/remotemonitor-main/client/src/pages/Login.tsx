import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  loading?: boolean;
}

export default function Login({ onLogin, loading = false }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
            <span className="text-2xl">📱</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">FazTudo Monitor</h1>
          <p className="text-slate-400">Sistema de Monitoramento Corporativo</p>
        </div>

        {/* Formulário */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-cyan-400/30 rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-slate-800/50 border-cyan-400/30 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Senha
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-slate-800/50 border-cyan-400/30 text-white placeholder:text-slate-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-cyan-400/20">
            <p className="text-xs text-slate-400 text-center">
              Credenciais de teste: admin / Mm102030@@
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-500">
            © 2026 FazTudo Tecnologia - Painel de Monitoramento Corporativo
          </p>
        </div>
      </div>
    </div>
  );
}
