# 📦 Guia do Gerador de APK Dinâmico

## O Que É?

O gerador de APK dinâmico permite que você crie APKs customizados diretamente do seu painel, sem precisar compilar manualmente. Cada APK é gerado com:

- ✅ URL do seu painel integrada
- ✅ Nome do app customizado
- ✅ Pacote Android único
- ✅ Consentimento LGPD incluído
- ✅ Assinatura digital

## Como Usar

### 1. Acessar o Gerador

Acesse: `https://seu-painel.com/apk-generator`

### 2. Preencher os Dados

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **URL do Painel** | URL onde seus funcionários acessarão | `https://remotemon-vhmaxpe6.manus.space` |
| **Nome do App** | Nome que aparecerá no Android | `FazTudo Monitor` |
| **Nome do Pacote** | Identificador único do app | `com.faztudo.monitor` |

### 3. Gerar APK

Clique em "🚀 Gerar APK" e aguarde 2-5 minutos.

### Opcoes de Entrega do Link

- `Automatico`: tenta EAS, depois storage, depois fallback local
- `EAS`: usa o artefato do EAS Build quando configurado
- `Storage`: publica a APK no storage configurado
- `Local`: disponibiliza download pelo proprio servidor

Para usar `EAS`, configure `EAS_BUILD_TOKEN` e `EAS_PROJECT_ID`.
Para usar `Storage`, configure `BUILT_IN_FORGE_API_URL` e `BUILT_IN_FORGE_API_KEY`.

### 4. Baixar

Quando pronto, clique em "📥 Baixar APK" ou copie o link para distribuir.

## Formato do Nome do Pacote

O nome do pacote deve seguir o formato:

```
com.empresa.app
```

**Regras:**
- Apenas letras minúsculas, números e pontos
- Começar com letra
- Máximo 3-4 partes separadas por ponto

**Exemplos válidos:**
- `com.faztudo.monitor`
- `br.empresa.app`
- `com.mycompany.tracking`

**Exemplos inválidos:**
- `com.FazTudo.Monitor` (maiúsculas)
- `com.empresa-app` (hífen)
- `empresa.app` (sem com/br/org)

## Distribuição

### Opção 1: Link Direto

1. Copie o link de download
2. Compartilhe com seus funcionários por email/WhatsApp
3. Eles clicam e baixam o APK

### Opção 2: Google Play Store

1. Assine o APK com sua chave privada
2. Faça upload na Google Play Console
3. Distribua para seus funcionários

### Opção 3: MDM (Mobile Device Management)

1. Use seu MDM corporativo (Microsoft Intune, Google Workspace, etc)
2. Distribua o APK automaticamente
3. Gerencie permissões centralmente

## Instalação no Android

### Pré-requisitos

- Android 8.0+
- 50MB de espaço livre
- Permissão para instalar de "Fontes desconhecidas"

### Passos

1. **Baixar o APK**
   - Clique no link ou escaneie o QR code

2. **Transferir para o Android**
   - Via USB
   - Via email
   - Via WhatsApp

3. **Ativar "Fontes Desconhecidas"**
   - Configurações → Segurança → Fontes Desconhecidas → Ativar

4. **Instalar**
   - Abra o gerenciador de arquivos
   - Localize o APK
   - Clique para instalar

5. **Abrir o App**
   - Clique em "Abrir"
   - Ou acesse pelo menu de apps

6. **Conectar ao Painel**
   - Gere um token no painel
   - Cole no app
   - Aceite o consentimento LGPD
   - Clique em "Conectar"

## Segurança

### Assinatura Digital

Todos os APKs são assinados digitalmente com a chave privada da FazTudo Tecnologia, garantindo:

- ✅ Autenticidade
- ✅ Integridade
- ✅ Não-repúdio

### Criptografia

Os dados enviados para o painel são criptografados com TLS 1.3.

### Conformidade

Todos os APKs incluem:

- ✅ Consentimento LGPD explícito
- ✅ Direitos dos funcionários garantidos
- ✅ Auditoria completa
- ✅ Política de retenção de 12 meses

## Troubleshooting

### "Erro ao gerar APK"

**Solução:**
1. Verifique a URL do painel (deve ser HTTPS)
2. Verifique o nome do pacote (formato correto)
3. Tente novamente em alguns minutos

### "APK não instala"

**Solução:**
1. Verifique a versão do Android (mínimo 8.0)
2. Ative "Fontes Desconhecidas"
3. Libere espaço no dispositivo (50MB)
4. Tente baixar novamente

### "App não conecta ao painel"

**Solução:**
1. Verifique a URL do painel
2. Verifique a conexão de internet
3. Verifique o token de instalação
4. Tente desinstalar e reinstalar

## Limites

- **Tamanho do APK:** ~50-80MB
- **Tempo de geração:** 2-5 minutos
- **Validade do link:** 30 dias
- **APKs por dia:** Sem limite

## Suporte

**Dúvidas?**
- Email: support@faztudo.com.br
- Painel: https://seu-painel.com/help
- Documentação: https://seu-painel.com/docs

---

**© 2026 FazTudo Tecnologia Ltda**
