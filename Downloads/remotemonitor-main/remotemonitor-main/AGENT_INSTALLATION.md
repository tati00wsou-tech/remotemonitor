# Guia de Instalação do Agente Mobile

## Visão Geral

O **Agente Mobile** é uma aplicação que roda no dispositivo Android ou iOS e coleta informações de monitoramento, enviando-as para o painel de controle em tempo real.

## Pré-requisitos

### Android
- Android 8.0 ou superior
- Permissões de localização (GPS)
- Permissões de acessibilidade (opcional, para eventos avançados)
- Conexão com internet (WiFi ou dados móveis)

### iOS
- iOS 13.0 ou superior
- Permissões de localização
- Permissões de notificações
- Conexão com internet

## Processo de Instalação

### Passo 1: Gerar Token de Instalação

1. Faça login no painel de controle
2. Vá para a página de **Dispositivos**
3. Clique em **+ Novo Dispositivo**
4. Preencha os dados:
   - **Nome do Dispositivo**: ex. "iPhone 14 Pro"
   - **Tipo**: Android ou iOS
   - **Descrição** (opcional)
5. Clique em **Criar Dispositivo**
6. Um token de instalação será gerado automaticamente
7. Copie o token (formato: `install_xxxxxxxxxxxxx`)

### Passo 2: Instalar o Agente

#### Android

1. **Via APK**:
   - Baixe o arquivo APK do agente
   - Abra o arquivo no seu dispositivo
   - Autorize a instalação de fontes desconhecidas
   - Siga as instruções de instalação

2. **Via Google Play**:
   - Procure por "Remote Monitor Agent"
   - Clique em Instalar
   - Aguarde a conclusão

#### iOS

1. **Via TestFlight**:
   - Abra o link do TestFlight compartilhado
   - Clique em "Aceitar e Instalar"
   - Aguarde a conclusão

2. **Via App Store**:
   - Procure por "Remote Monitor Agent"
   - Clique em Obter
   - Autorize com Face ID/Touch ID
   - Aguarde a conclusão

### Passo 3: Configurar o Agente

1. Abra o aplicativo instalado
2. Na primeira execução, será solicitado:
   - **Token de Instalação**: Cole o token gerado no painel
   - **Nome do Dispositivo**: Confirme ou altere
   - **Permissões**: Autorize as permissões solicitadas

3. Clique em **Conectar**
4. Aguarde a confirmação de conexão

### Passo 4: Verificar Conexão

1. Retorne ao painel de controle
2. Vá para a página de **Dispositivos**
3. Procure pelo dispositivo que acabou de adicionar
4. Verifique se o status é **Online** (🟢)
5. Se estiver **Offline** (🔴), verifique:
   - Conexão com internet
   - Se o aplicativo está rodando
   - Se o token está correto

## Permissões Necessárias

### Android

| Permissão | Propósito | Obrigatória |
|-----------|----------|-----------|
| `ACCESS_FINE_LOCATION` | Localização GPS | ✅ Sim |
| `ACCESS_COARSE_LOCATION` | Localização aproximada | ✅ Sim |
| `INTERNET` | Conectar ao servidor | ✅ Sim |
| `RECEIVE_BOOT_COMPLETED` | Iniciar ao ligar | ⚠️ Recomendado |
| `WAKE_LOCK` | Manter processamento | ⚠️ Recomendado |
| `READ_PHONE_STATE` | Detectar chamadas | ❌ Opcional |
| `READ_SMS` | Detectar mensagens | ❌ Opcional |

### iOS

| Permissão | Propósito | Obrigatória |
|-----------|----------|-----------|
| `Location` | Localização GPS | ✅ Sim |
| `Notifications` | Receber alertas | ✅ Sim |
| `Internet` | Conectar ao servidor | ✅ Sim |
| `Motion & Fitness` | Dados de movimento | ❌ Opcional |

## Configurações do Agente

### Intervalo de Sincronização

O agente envia dados em intervalos configuráveis:

- **Modo Normal**: A cada 5 minutos
- **Modo Economia de Bateria**: A cada 15 minutos
- **Modo Crítico**: A cada 1 minuto (quando bateria < 20%)

Para alterar:
1. Abra o aplicativo do agente
2. Vá para **Configurações**
3. Selecione **Intervalo de Sincronização**
4. Escolha a opção desejada

### Dados Coletados

O agente coleta automaticamente:

- ✅ **Localização**: GPS, WiFi, dados móveis
- ✅ **Status**: Online/Offline, bateria, espaço em disco
- ✅ **Eventos**: Chamadas recebidas, mensagens, apps instalados
- ✅ **Conectividade**: WiFi, dados móveis, sinal
- ✅ **Temperatura**: Temperatura do processador
- ✅ **Memória**: RAM disponível, espaço em disco

### Dados Não Coletados

O agente **NÃO** coleta:

- ❌ Conteúdo de mensagens/e-mails
- ❌ Senhas ou dados de login
- ❌ Arquivos pessoais
- ❌ Histórico de navegação
- ❌ Dados de aplicativos privados

## Troubleshooting

### Problema: Dispositivo Offline

**Solução:**
1. Verifique conexão com internet
2. Reinicie o aplicativo
3. Verifique se o token não expirou (válido por 30 dias)
4. Gere um novo token se necessário

### Problema: Localização Não Atualiza

**Solução:**
1. Verifique se GPS está ativado
2. Abra o Google Maps para testar localização
3. Reinicie o aplicativo
4. Verifique permissões de localização

### Problema: Bateria Drena Rápido

**Solução:**
1. Ative o modo "Economia de Bateria" nas configurações
2. Reduza a frequência de sincronização
3. Desative a coleta de eventos avançados
4. Verifique se a tela está sempre ligada

### Problema: Aplicativo Fecha Inesperadamente

**Solução:**
1. Desinstale e reinstale o aplicativo
2. Verifique se há espaço em disco disponível
3. Atualize o sistema operacional
4. Contate o suporte

## Desinstalação

### Android

1. Vá para **Configurações** → **Aplicativos**
2. Procure por "Remote Monitor Agent"
3. Clique em **Desinstalar**
4. Confirme a desinstalação

### iOS

1. Pressione e segure o ícone do aplicativo
2. Clique em **Remover**
3. Selecione **Remover do Home Screen** ou **Remover App**
4. Confirme

## Suporte

Para problemas ou dúvidas:

1. **FAQ**: Consulte a seção de Perguntas Frequentes
2. **Chat**: Entre em contato via chat no painel
3. **Email**: Envie um e-mail para support@remotemonitor.com
4. **Documentação**: Acesse https://docs.remotemonitor.com

## Segurança e Privacidade

### Criptografia

- ✅ Todos os dados são transmitidos via HTTPS/WSS
- ✅ Tokens de instalação são únicos e expiram após 30 dias
- ✅ Senhas nunca são armazenadas no dispositivo

### Privacidade

- ✅ Dados são armazenados apenas no servidor autorizado
- ✅ Você pode deletar dados a qualquer momento
- ✅ Nenhum dado é compartilhado com terceiros
- ✅ Conformidade com LGPD/GDPR

## Atualizações

O agente recebe atualizações automáticas:

- **Android**: Via Google Play Store
- **iOS**: Via App Store

Para verificar atualizações manualmente:
1. Abra a loja de aplicativos
2. Procure por "Remote Monitor Agent"
3. Se houver atualização disponível, clique em **Atualizar**

## Próximas Etapas

Após instalar o agente:

1. ✅ Configure os alertas desejados no painel
2. ✅ Teste a localização no mapa
3. ✅ Verifique o histórico de eventos
4. ✅ Configure notificações por e-mail
5. ✅ Compartilhe o painel com outros usuários (se necessário)
