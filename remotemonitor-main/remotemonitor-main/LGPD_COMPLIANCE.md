# 📋 Documentação de Conformidade LGPD/GDPR

## FazTudo Tecnologia Ltda
**CNAE:** 6311-9/00 - Tratamento de dados, provedores de aplicação e serviços de hospedagem na internet

---

## 1. Introdução

Este documento descreve como o **Painel de Monitoramento Remoto** da FazTudo Tecnologia implementa conformidade com:

- **LGPD** (Lei Geral de Proteção de Dados - Brasil)
- **GDPR** (General Data Protection Regulation - Europa)
- Políticas internas de privacidade e segurança

---

## 2. Princípios de Privacidade

### 2.1 Transparência
- ✅ Todos os funcionários são informados sobre o monitoramento
- ✅ Termo de consentimento claro e acessível
- ✅ Política de privacidade publicada
- ✅ Direito de acesso aos dados coletados

### 2.2 Minimização de Dados
- ✅ Coleta apenas dados estritamente necessários
- ✅ Sem coleta de dados pessoais não relacionados ao trabalho
- ✅ Monitoramento apenas durante expediente laboral
- ✅ Apenas dispositivos corporativos

### 2.3 Segurança
- ✅ Criptografia de dados em trânsito (HTTPS/TLS)
- ✅ Criptografia de dados em repouso (AES-256)
- ✅ Autenticação OAuth segura
- ✅ Controle de acesso baseado em roles

### 2.4 Retenção de Dados
- ✅ Período máximo de 12 meses
- ✅ Exclusão automática após período de retenção
- ✅ Direito de exclusão sob demanda
- ✅ Logs de exclusão para auditoria

---

## 3. Dados Coletados

### 3.1 Dados Permitidos

| Tipo de Dado | Finalidade | Retenção | Necessário |
|---|---|---|---|
| Localização GPS | Controle de frota, segurança | 12 meses | Sim |
| Apps abertos | Produtividade, segurança | 12 meses | Sim |
| Screenshots | Auditoria, segurança | 12 meses | Sim (com consentimento) |
| Tempo de tela | Produtividade | 12 meses | Sim |
| Acesso a bancos | Prevenção de fraude | 12 meses | Sim |
| Status do dispositivo | Segurança | 12 meses | Sim |

### 3.2 Dados NÃO Coletados

- ❌ Mensagens pessoais
- ❌ Histórico de navegação privada
- ❌ Dados de saúde
- ❌ Dados biométricos
- ❌ Informações financeiras pessoais
- ❌ Dados de dispositivos pessoais

---

## 4. Consentimento

### 4.1 Termo de Consentimento Obrigatório

Todos os funcionários devem assinar termo informando:

```
TERMO DE CONSENTIMENTO PARA MONITORAMENTO

Eu, _________________________, funcionário da FazTudo Tecnologia,
declaro estar ciente e concordo com:

1. Monitoramento de localização GPS do dispositivo corporativo
2. Coleta de informações sobre aplicativos abertos
3. Captura de screenshots durante expediente
4. Monitoramento de tempo de tela
5. Alertas de acesso a aplicativos bancários

Entendo que:
- Dados serão retidos por até 12 meses
- Posso solicitar acesso, correção ou exclusão
- O monitoramento ocorre apenas durante expediente
- Apenas dispositivos corporativos são monitorados

Assinado em: ___/___/______
Assinatura: _____________________
```

### 4.2 Registro de Consentimentos

Sistema registra automaticamente:
- Data e hora do consentimento
- Versão do documento
- Tipo de consentimento
- Status (aceito/rejeitado)
- Validade (365 dias)

---

## 5. Direitos dos Funcionários

### 5.1 Direito de Acesso

Funcionários podem solicitar acesso a:
- Todos os dados coletados sobre eles
- Screenshots capturados
- Histórico de localização
- Apps monitorados
- Logs de acesso

**Acesso via:** Painel de Conformidade → Meus Dados

### 5.2 Direito de Correção

Dados incorretos podem ser corrigidos:
- Solicitar correção via formulário
- Análise por departamento de compliance
- Correção em até 5 dias úteis
- Confirmação por email

### 5.3 Direito de Exclusão

Funcionários podem solicitar exclusão de:
- Dados após período de retenção
- Dados pessoais desnecessários
- Consentimento pode ser revogado

**Processo:**
1. Solicitar exclusão no painel
2. Análise de conformidade
3. Exclusão em até 10 dias úteis
4. Confirmação por email

### 5.4 Direito de Portabilidade

Dados podem ser exportados em formato:
- JSON
- CSV
- PDF
- Formato legível por máquina

---

## 6. Segurança de Dados

### 6.1 Criptografia

**Em Trânsito:**
- TLS 1.3 para todas as comunicações
- Certificados SSL válidos
- Verificação de hostname

**Em Repouso:**
- AES-256 para dados sensíveis
- Chaves armazenadas em servidor seguro
- Backup criptografado

### 6.2 Controle de Acesso

**Autenticação:**
- OAuth 2.0 obrigatório
- Senhas com hash bcrypt
- Autenticação multifator (opcional)

**Autorização:**
- Role-based access control (RBAC)
- Usuários veem apenas seus dados
- Admins veem dados de seus subordinados
- Compliance vê tudo (auditoria)

### 6.3 Auditoria

Todos os acessos são registrados:
- Quem acessou
- O que foi acessado
- Quando foi acessado
- De qual IP
- Resultado (sucesso/falha)

---

## 7. Processamento de Dados

### 7.1 Responsáveis

**Controlador de Dados:** FazTudo Tecnologia Ltda
- Determina finalidade e meios do processamento
- Responsável por conformidade

**Processador de Dados:** Manus Platform
- Processa dados conforme instruções
- Implementa medidas de segurança
- Assina DPA (Data Processing Agreement)

### 7.2 Transferência de Dados

- Dados armazenados em servidores Brasil
- Sem transferência internacional
- Conformidade com LGPD garantida

---

## 8. Incidentes de Segurança

### 8.1 Plano de Resposta

1. **Detecção:** Monitoramento 24/7
2. **Contenção:** Isolamento imediato
3. **Análise:** Investigação completa
4. **Notificação:** Comunicado em 48h
5. **Remediação:** Correção e prevenção

### 8.2 Notificação de Incidentes

- Funcionários afetados serão notificados
- Órgãos reguladores conforme necessário
- Relatório detalhado disponibilizado
- Medidas preventivas implementadas

---

## 9. Retenção e Exclusão

### 9.1 Política de Retenção

| Tipo de Dado | Período | Ação |
|---|---|---|
| Screenshots | 12 meses | Exclusão automática |
| Localização | 12 meses | Exclusão automática |
| Apps | 12 meses | Exclusão automática |
| Logs de auditoria | 24 meses | Exclusão automática |
| Consentimentos | Indefinido | Mantém para prova |

### 9.2 Exclusão Automática

Sistema executa limpeza automática:
- Diariamente às 02:00 AM
- Verifica período de retenção
- Deleta dados expirados
- Registra exclusão em log

### 9.3 Exclusão Manual

Funcionários podem solicitar exclusão:
- Via painel de conformidade
- Análise por compliance
- Exclusão em até 10 dias
- Confirmação por email

---

## 10. Conformidade Regulatória

### 10.1 LGPD (Brasil)

**Artigos Implementados:**
- Art. 5: Princípios (transparência, segurança, etc)
- Art. 6: Bases legais (consentimento + legítimo interesse)
- Art. 7: Consentimento informado
- Art. 9: Dados sensíveis (não coletamos)
- Art. 12-17: Direitos dos titulares
- Art. 32: Segurança

### 10.2 GDPR (Europa)

**Artigos Implementados:**
- Art. 5: Princípios (legalidade, transparência, etc)
- Art. 6: Bases legais
- Art. 7: Consentimento
- Art. 13-14: Informações ao titular
- Art. 15-22: Direitos dos titulares
- Art. 32: Segurança

---

## 11. Documentação Obrigatória

### 11.1 Registros Mantidos

- ✅ Termo de consentimento assinado
- ✅ Política de privacidade
- ✅ Análise de impacto (DPIA)
- ✅ Contrato de processamento (DPA)
- ✅ Logs de auditoria
- ✅ Registros de incidentes
- ✅ Documentação técnica

### 11.2 Disponibilidade

Todos os documentos estão disponíveis:
- No painel de conformidade
- Para download em PDF
- Com data de última atualização
- Assinados digitalmente

---

## 12. Contato de Privacidade

**Encarregado de Proteção de Dados (DPO):**
- Email: privacy@faztudo.com.br
- Telefone: (62) 3000-0000
- Endereço: Goiânia, GO

**Dúvidas e Reclamações:**
- Canal: https://faztudo.com.br/privacy
- Resposta em até 5 dias úteis

---

## 13. Atualizações e Revisões

| Data | Versão | Alterações |
|---|---|---|
| 2026-04-09 | 1.0 | Versão inicial |

**Próxima revisão:** 2026-10-09

---

## 14. Assinatura

**Responsável pela Conformidade:**

Nome: _____________________
Cargo: _____________________
Data: _____________________
Assinatura: _____________________

---

**Documento Confidencial - Uso Interno Apenas**

*Última atualização: 09 de Abril de 2026*
