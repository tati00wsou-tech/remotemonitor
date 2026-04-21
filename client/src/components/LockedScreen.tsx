import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LockedScreenProps {
  deviceName: string;
  onUnlock: () => void;
}

export default function LockedScreen({
  deviceName,
  onUnlock,
}: LockedScreenProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(true);

  const correctPassword = "admin123"; // Senha padrão para destravar

  const handleUnlock = () => {
    if (password === correctPassword) {
      setError("");
      setPassword("");
      setAttempts(0);
      setIsLocked(false);
      onUnlock();
    } else {
      setAttempts(attempts + 1);
      setError("❌ Senha incorreta! Tente novamente.");
      setPassword("");

      if (attempts >= 2) {
        setError(
          "🔒 Muitas tentativas! Tela bloqueada por 30 segundos..."
        );
        setTimeout(() => {
          setError("");
          setAttempts(0);
        }, 30000);
      }
    }
  };

  if (!isLocked) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-red-500/50 p-8 max-w-md w-full mx-4">
        <div className="text-center space-y-6">
          {/* Ícone de Trava */}
          <div className="text-6xl animate-pulse">🔒</div>

          {/* Título */}
          <div>
            <h1 className="text-2xl font-bold text-red-400 mb-2">
              Tela Travada
            </h1>
            <p className="text-slate-400">
              {deviceName} está bloqueado pelo administrador
            </p>
          </div>

          {/* Informações */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-300 text-sm">
              ⚠️ Este dispositivo foi travado remotamente. Digite a senha para
              destravar.
            </p>
          </div>

          {/* Campo de Senha */}
          <div className="space-y-2">
            <label className="block text-slate-300 text-sm font-medium">
              Senha de Desbloqueio
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleUnlock()}
              placeholder="Digite a senha..."
              disabled={attempts >= 3}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div
              className={`p-3 rounded-lg text-sm font-medium ${
                attempts >= 3
                  ? "bg-orange-900/30 border border-orange-500/30 text-orange-300"
                  : "bg-red-900/30 border border-red-500/30 text-red-300"
              }`}
            >
              {error}
            </div>
          )}

          {/* Contador de Tentativas */}
          {attempts > 0 && attempts < 3 && (
            <p className="text-slate-400 text-xs">
              Tentativas restantes: {3 - attempts}
            </p>
          )}

          {/* Botão de Desbloqueio */}
          <Button
            onClick={handleUnlock}
            disabled={attempts >= 3 || password.length === 0}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔓 Destravar Tela
          </Button>

          {/* Informação Adicional */}
          <p className="text-slate-500 text-xs">
            Apenas o administrador pode destravar este dispositivo
          </p>
        </div>
      </Card>
    </div>
  );
}
