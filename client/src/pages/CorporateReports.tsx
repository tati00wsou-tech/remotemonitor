import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Download, AlertTriangle, Lock, Camera, AppWindow } from "lucide-react";
import { useState } from "react";

export default function CorporateReports() {
  const { user } = useAuth();
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);

  // Queries
  const devicesQuery = trpc.device.list.useQuery();
  const screenshotsQuery = trpc.corporate.screenshots.list.useQuery(
    { deviceId: selectedDevice || 0, limit: 20 },
    { enabled: !!selectedDevice }
  );
  const appsQuery = trpc.corporate.apps.list.useQuery(
    { deviceId: selectedDevice || 0 },
    { enabled: !!selectedDevice }
  );
  const bankAccessQuery = trpc.corporate.bankAccess.list.useQuery(
    { deviceId: selectedDevice || 0, hoursBack: 24 },
    { enabled: !!selectedDevice }
  );
  const auditLogsQuery = trpc.corporate.audit.list.useQuery({
    limit: 50,
    daysBack: 30,
  });

  if (!user) return <div>Carregando...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-neon-pink">
            📊 Relatórios Corporativos
          </h1>
          <p className="text-neon-cyan">Monitoramento e conformidade LGPD</p>
        </div>

        {/* Device Selector */}
        <Card className="mb-6 p-6 border-neon-pink bg-background/50 backdrop-blur">
          <h2 className="text-xl font-bold mb-4 text-neon-cyan">Selecione um Dispositivo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {devicesQuery.data?.map((device) => (
              <Button
                key={device.id}
                onClick={() => setSelectedDevice(device.id)}
                variant={selectedDevice === device.id ? "default" : "outline"}
                className={`p-4 text-left ${
                  selectedDevice === device.id
                    ? "bg-neon-pink text-black"
                    : "border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10"
                }`}
              >
                <div>
                  <div className="font-bold">{device.deviceName}</div>
                  <div className="text-sm opacity-75">{device.deviceType}</div>
                  <div className="text-xs opacity-50">
                    {device.status === "online" ? "🟢 Online" : "🔴 Offline"}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </Card>

        {selectedDevice && (
          <>
            {/* Screenshots */}
            <Card className="mb-6 p-6 border-neon-cyan bg-background/50 backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Camera className="w-6 h-6 text-neon-pink" />
                  <h2 className="text-xl font-bold text-neon-cyan">Screenshots</h2>
                </div>
                <Button
                  size="sm"
                  className="bg-neon-pink text-black hover:bg-neon-pink/80"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>

              {screenshotsQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-neon-cyan" />
                </div>
              ) : screenshotsQuery.data?.length === 0 ? (
                <p className="text-center py-8 text-gray-400">Nenhum screenshot capturado</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {screenshotsQuery.data?.map((screenshot) => (
                    <div
                      key={screenshot.id}
                      className="border border-neon-cyan/30 rounded p-2 hover:border-neon-cyan cursor-pointer transition"
                    >
                      <img
                        src={screenshot.screenshotUrl ?? screenshot.imageUrl ?? ""}
                        alt="Screenshot"
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                      <p className="text-xs text-gray-400">
                        {new Date(screenshot.createdAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-neon-cyan">{screenshot.captureType}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Apps */}
            <Card className="mb-6 p-6 border-neon-cyan bg-background/50 backdrop-blur">
              <div className="flex items-center gap-2 mb-4">
                <AppWindow className="w-6 h-6 text-neon-pink" />
                <h2 className="text-xl font-bold text-neon-cyan">Aplicativos Instalados</h2>
              </div>

              {appsQuery.isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-neon-cyan" />
              ) : appsQuery.data?.length === 0 ? (
                <p className="text-gray-400">Nenhum app reportado</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {appsQuery.data?.map((app) => (
                    <div
                      key={app.id}
                      className="flex justify-between items-center p-3 border border-neon-cyan/20 rounded hover:border-neon-cyan/50 transition"
                    >
                      <div>
                        <p className="font-semibold text-neon-cyan">{app.appName}</p>
                        <p className="text-xs text-gray-400">{app.appPackage}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-neon-pink">{app.appType}</p>
                        <p className="text-xs text-gray-400">
                          {app.timeUsed ? `${app.timeUsed}min` : "Não usado"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Bank Access Alerts */}
            <Card className="mb-6 p-6 border-neon-pink bg-background/50 backdrop-blur">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-6 h-6 text-neon-pink" />
                <h2 className="text-xl font-bold text-neon-cyan">Acessos a Bancos (24h)</h2>
              </div>

              {bankAccessQuery.isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-neon-cyan" />
              ) : bankAccessQuery.data?.length === 0 ? (
                <p className="text-gray-400">Nenhum acesso a banco detectado</p>
              ) : (
                <div className="space-y-2">
                  {bankAccessQuery.data?.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 border border-neon-pink/30 rounded bg-neon-pink/5"
                    >
                      <p className="font-semibold text-neon-pink">{alert.bankName}</p>
                      <p className="text-sm text-gray-300">{alert.bankApp}</p>
                      <p className="text-xs text-gray-400">
                        {(alert.accessTime ? new Date(alert.accessTime).toLocaleString() : "Horario indisponivel")} - {alert.duration ?? 0}min
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}

        {/* Audit Logs */}
        <Card className="p-6 border-neon-cyan bg-background/50 backdrop-blur">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-6 h-6 text-neon-pink" />
            <h2 className="text-xl font-bold text-neon-cyan">Logs de Auditoria (30 dias)</h2>
          </div>

          {auditLogsQuery.isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-neon-cyan" />
          ) : auditLogsQuery.data?.length === 0 ? (
            <p className="text-gray-400">Nenhum log de auditoria</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {auditLogsQuery.data?.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 border rounded text-sm ${
                    log.status === "success"
                      ? "border-neon-cyan/20 bg-neon-cyan/5"
                      : "border-neon-pink/30 bg-neon-pink/5"
                  }`}
                >
                  <div className="flex justify-between">
                    <p className="font-semibold text-neon-cyan">{log.action}</p>
                    <p className={log.status === "success" ? "text-neon-cyan" : "text-neon-pink"}>
                      {log.status}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
