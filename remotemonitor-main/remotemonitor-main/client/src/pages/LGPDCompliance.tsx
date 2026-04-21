import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Download,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function LGPDCompliance() {
  const { user } = useAuth();

  // Queries
  const consentsQuery = trpc.corporate.consent.list.useQuery({});
  const auditLogsQuery = trpc.corporate.audit.list.useQuery({
    limit: 20,
    daysBack: 90,
  });
  const consentStatusQuery = trpc.lgpd.getConsentStatus.useQuery();
  const lgpdRequestsQuery = trpc.lgpd.getRequests.useQuery();
  const downloadExportQuery = trpc.lgpd.downloadDataExport.useQuery();

  // Mutations
  const accessRequestMutation = trpc.lgpd.requestAccess.useMutation();
  const deletionRequestMutation = trpc.lgpd.requestDeletion.useMutation();
  const correctionRequestMutation = trpc.lgpd.requestCorrection.useMutation();
  const revokeConsentMutation = trpc.lgpd.revokeConsent.useMutation();

  if (!user) return <div>Carregando...</div>;

  const handleAccessRequest = async () => {
    try {
      const result = await accessRequestMutation.mutateAsync({
        dataTypes: ["screenshots", "apps", "location", "events", "all"],
      });
      toast.success(
        `Solicitação enviada! ID: ${result.requestId}\nVocê receberá seus dados em até 15 dias úteis.`
      );
    } catch (error) {
      toast.error("Erro ao processar solicitação");
    }
  };

  const handleDeletionRequest = async () => {
    try {
      const result = await deletionRequestMutation.mutateAsync({
        dataTypes: ["screenshots", "apps", "location", "events"],
        reason: "Solicitação de exclusão de dados pessoais",
      });
      toast.success(
        `Solicitação enviada! ID: ${result.requestId}\nSeus dados serão excluídos em até 30 dias.`
      );
    } catch (error) {
      toast.error("Erro ao processar solicitação");
    }
  };

  const handleCorrectionRequest = async () => {
    try {
      const result = await correctionRequestMutation.mutateAsync({
        dataType: "profile",
        currentValue: "valor atual",
        correctedValue: "valor corrigido",
        reason: "Correção de dados pessoais",
      });
      toast.success(
        `Solicitação enviada! ID: ${result.requestId}\nSua correção será processada em até 5 dias.`
      );
    } catch (error) {
      toast.error("Erro ao processar solicitação");
    }
  };

  const handleDownloadData = () => {
    if (downloadExportQuery.data?.dataUrl) {
      const link = document.createElement("a");
      link.href = downloadExportQuery.data.dataUrl;
      link.download = `meus-dados-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      toast.success("Download iniciado!");
    }
  };

  const handleRevokeConsent = async (consentType: any) => {
    try {
      await revokeConsentMutation.mutateAsync({ consentType });
      toast.success(`Consentimento para ${consentType} foi revogado`);
      consentStatusQuery.refetch();
    } catch (error) {
      toast.error("Erro ao revogar consentimento");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-neon-pink">
            🛡️ Conformidade LGPD
          </h1>
          <p className="text-neon-cyan">Seus direitos de privacidade e dados</p>
        </div>

        {/* Rights Overview */}
        <Card className="mb-6 p-6 border-neon-cyan bg-background/50 backdrop-blur">
          <h2 className="text-2xl font-bold mb-6 text-neon-cyan">Seus Direitos</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Right of Access */}
            <div className="border border-neon-cyan/30 rounded-lg p-4 hover:border-neon-cyan transition">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-neon-pink" />
                <h3 className="font-bold text-neon-cyan">Direito de Acesso</h3>
              </div>
              <p className="text-sm text-gray-300 mb-4">
                Você tem o direito de acessar todos os dados coletados sobre você.
              </p>
              <Button
                onClick={handleAccessRequest}
                disabled={accessRequestMutation.isPending}
                className="w-full bg-neon-cyan text-black hover:bg-neon-cyan/80"
                size="sm"
              >
                {accessRequestMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Solicitar Meus Dados
                  </>
                )}
              </Button>
            </div>

            {/* Right of Deletion */}
            <div className="border border-neon-pink/30 rounded-lg p-4 hover:border-neon-pink transition">
              <div className="flex items-center gap-2 mb-3">
                <Trash2 className="w-5 h-5 text-neon-pink" />
                <h3 className="font-bold text-neon-cyan">Direito de Exclusão</h3>
              </div>
              <p className="text-sm text-gray-300 mb-4">
                Você pode solicitar a exclusão de seus dados a qualquer momento.
              </p>
              <Button
                onClick={handleDeletionRequest}
                disabled={deletionRequestMutation.isPending}
                className="w-full bg-neon-pink text-black hover:bg-neon-pink/80"
                size="sm"
              >
                {deletionRequestMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Solicitar Exclusão
                  </>
                )}
              </Button>
            </div>

            {/* Right of Correction */}
            <div className="border border-neon-cyan/30 rounded-lg p-4 hover:border-neon-cyan transition">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-neon-pink" />
                <h3 className="font-bold text-neon-cyan">Direito de Correção</h3>
              </div>
              <p className="text-sm text-gray-300 mb-4">
                Dados incorretos podem ser corrigidos mediante solicitação.
              </p>
              <Button
                onClick={handleCorrectionRequest}
                disabled={correctionRequestMutation.isPending}
                className="w-full bg-neon-cyan text-black hover:bg-neon-cyan/80"
                size="sm"
              >
                {correctionRequestMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Solicitar Correção
                  </>
                )}
              </Button>
            </div>

            {/* Right of Portability */}
            <div className="border border-neon-cyan/30 rounded-lg p-4 hover:border-neon-cyan transition">
              <div className="flex items-center gap-2 mb-3">
                <Download className="w-5 h-5 text-neon-pink" />
                <h3 className="font-bold text-neon-cyan">Direito de Portabilidade</h3>
              </div>
              <p className="text-sm text-gray-300 mb-4">
                Seus dados podem ser exportados em formato legível.
              </p>
              <Button
                onClick={handleDownloadData}
                disabled={downloadExportQuery.isLoading}
                className="w-full bg-neon-cyan text-black hover:bg-neon-cyan/80"
                size="sm"
              >
                {downloadExportQuery.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Preparando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Meus Dados
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Consents Status */}
        <Card className="mb-6 p-6 border-neon-cyan bg-background/50 backdrop-blur">
          <h2 className="text-xl font-bold mb-4 text-neon-cyan">Status de Consentimentos</h2>

          {consentStatusQuery.isLoading ? (
            <p className="text-gray-400">Carregando...</p>
          ) : consentStatusQuery.data?.length === 0 ? (
            <p className="text-gray-400">Nenhum consentimento registrado</p>
          ) : (
            <div className="space-y-3">
              {consentStatusQuery.data?.map((consent) => (
                <div
                  key={consent.id}
                  className={`flex items-center justify-between p-3 border rounded ${
                    consent.isConsented
                      ? "border-neon-cyan/30 bg-neon-cyan/5"
                      : "border-neon-pink/30 bg-neon-pink/5"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {consent.isConsented ? (
                      <CheckCircle className="w-5 h-5 text-neon-cyan" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-neon-pink" />
                    )}
                    <div>
                      <p className="font-semibold text-neon-cyan">{consent.type}</p>
                      <p className="text-xs text-gray-400">
                        {consent.consentDate
                          ? new Date(consent.consentDate).toLocaleDateString("pt-BR")
                          : "Não consentido"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {consent.expiresAt && (
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="w-4 h-4 text-neon-pink" />
                        <span>
                          {consent.daysUntilExpiration} dias
                        </span>
                      </div>
                    )}
                    {consent.isConsented && (
                      <Button
                        onClick={() => handleRevokeConsent(consent.type)}
                        disabled={revokeConsentMutation.isPending}
                        size="sm"
                        variant="outline"
                        className="text-neon-pink border-neon-pink hover:bg-neon-pink/10"
                      >
                        Revogar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* LGPD Requests History */}
        <Card className="mb-6 p-6 border-neon-cyan bg-background/50 backdrop-blur">
          <h2 className="text-xl font-bold mb-4 text-neon-cyan">Histórico de Solicitações LGPD</h2>

          {lgpdRequestsQuery.isLoading ? (
            <p className="text-gray-400">Carregando...</p>
          ) : lgpdRequestsQuery.data?.length === 0 ? (
            <p className="text-gray-400">Nenhuma solicitação LGPD realizada</p>
          ) : (
            <div className="space-y-2">
              {lgpdRequestsQuery.data?.map((request) => (
                <div
                  key={request.id}
                  className="p-3 border border-neon-cyan/20 rounded bg-neon-cyan/5"
                >
                  <div className="flex justify-between mb-1">
                    <p className="font-semibold text-neon-cyan">{request.type}</p>
                    <p className="text-xs text-neon-pink">{request.status}</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(request.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Audit Trail */}
        <Card className="p-6 border-neon-cyan bg-background/50 backdrop-blur">
          <h2 className="text-xl font-bold mb-4 text-neon-cyan">Histórico de Acessos (90 dias)</h2>

          {auditLogsQuery.isLoading ? (
            <p className="text-gray-400">Carregando...</p>
          ) : auditLogsQuery.data?.length === 0 ? (
            <p className="text-gray-400">Nenhum acesso registrado</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {auditLogsQuery.data?.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 border rounded text-sm ${
                    log.status === "success"
                      ? "border-neon-cyan/20 bg-neon-cyan/5"
                      : "border-neon-pink/20 bg-neon-pink/5"
                  }`}
                >
                  <div className="flex justify-between mb-1">
                    <p className="font-semibold text-neon-cyan">{log.action}</p>
                    <p className={log.status === "success" ? "text-neon-cyan" : "text-neon-pink"}>
                      {log.status}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Information Section */}
        <Card className="mt-6 p-6 border-neon-pink/30 bg-neon-pink/5">
          <h3 className="font-bold text-neon-pink mb-3">📋 Informações Importantes</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              • Seus dados são retidos por até 12 meses conforme política de privacidade
            </li>
            <li>
              • Solicitações de acesso são processadas em até 15 dias úteis
            </li>
            <li>
              • Solicitações de exclusão são processadas em até 30 dias
            </li>
            <li>
              • Você pode revogar consentimentos a qualquer momento
            </li>
            <li>
              • Para dúvidas, contate: privacy@faztudo.com.br
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
