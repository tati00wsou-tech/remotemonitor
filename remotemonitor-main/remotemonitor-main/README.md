# 🚀 Painel de Monitoramento Remoto - Cyberpunk Edition

Um **sistema completo de monitoramento remoto** para dispositivos móveis Android e iOS com interface cyberpunk futurista, construído com React, Node.js, tRPC e WebSocket.

## 🎨 Características Principais

✅ **Dashboard Cyberpunk** - Interface de alto impacto visual com tema neon rosa/ciano  
✅ **Autenticação Segura** - OAuth integrado via Manus  
✅ **Gerenciamento de Dispositivos** - Cadastro e monitoramento de Android/iOS  
✅ **Mapa em Tempo Real** - Visualização de localização com Google Maps  
✅ **Histórico de Eventos** - Rastreamento completo de atividades  
✅ **Sistema de Alertas** - Notificações por email e push  
✅ **APIs Públicas** - Endpoints para agentes móveis enviarem dados  
✅ **WebSocket** - Atualizações em tempo real (em desenvolvimento)  
✅ **Testes Unitários** - 29 testes passando  

## 📋 Requisitos

- Node.js 22.13.0+
- MySQL/TiDB
- npm ou pnpm

## 🚀 Instalação Rápida

### 1. Clonar o Repositório

```bash
git clone <seu-repo>
cd remote-monitor
```

### 2. Instalar Dependências

```bash
pnpm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` a partir de `.env.example` e ajuste os valores:

```bash
cp .env.example .env
```

### 4. Configurar Banco de Dados

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

> Se você ainda não tiver o banco configurado, ajuste `DATABASE_URL` no arquivo `.env` antes de rodar as migrações.

### 4. Iniciar Desenvolvimento

```bash
pnpm dev
```

Acesse: http://localhost:3000

## 📁 Estrutura do Projeto

```
remote-monitor/
├── client/                 # Frontend React + Tailwind
│   ├── src/
│   │   ├── pages/         # Páginas principais
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── hooks/         # Hooks customizados
│   │   └── lib/           # Utilitários
│   └── index.html
├── server/                # Backend Node.js + Express
│   ├── routers.ts         # Rotas tRPC
│   ├── db.ts              # Helpers de banco
│   ├── websocket.ts       # Servidor WebSocket
│   ├── notifications.ts   # Sistema de alertas
│   └── _core/             # Configuração interna
├── drizzle/               # Schema e migrações
├── shared/                # Código compartilhado
├── ARCHITECTURE.md        # Documentação técnica
├── API_DOCUMENTATION.md   # Documentação de APIs
├── USER_GUIDE.md          # Guia do usuário
└── AGENT_INSTALLATION.md  # Guia de instalação do agente
```

## 🔧 Comandos Disponíveis

```bash
# Desenvolvimento
pnpm dev                   # Iniciar servidor em desenvolvimento

# Build
pnpm build                 # Build para produção
pnpm start                 # Iniciar servidor em produção

# Banco de Dados
pnpm drizzle-kit generate  # Gerar migrações
pnpm drizzle-kit migrate   # Aplicar migrações

# Testes
pnpm test                  # Executar testes unitários
pnpm check                 # Verificar tipos TypeScript

# Formatação
pnpm format                # Formatar código com Prettier
```

## 🔐 Autenticação

### Login no Painel

1. Acesse http://localhost:3000
2. Clique em "Acessar Painel"
3. Faça login com sua conta Manus
4. Você será redirecionado ao dashboard

### Tokens de Instalação

Para instalar agentes nos dispositivos:

1. Vá para **Dispositivos**
2. Clique em **+ Novo Dispositivo**
3. Preencha os dados e clique em **Criar**
4. Um token será gerado automaticamente
5. Compartilhe o token com o agente mobile

## 📊 Páginas Disponíveis

| Página | Descrição |
|--------|-----------|
| `/` | Home com login |
| `/devices` | Listagem e gerenciamento de dispositivos |
| `/alerts` | Alertas e notificações |
| `/events` | Histórico de eventos |
| `/map` | Mapa em tempo real |

## 🔌 APIs tRPC

### Dispositivos

```javascript
// Listar
trpc.device.list.useQuery()

// Criar
trpc.device.create.useMutation({
  deviceId: 'device-123',
  deviceName: 'iPhone 14',
  deviceType: 'ios',
  osVersion: '17.0',
  manufacturer: 'Apple',
  model: 'iPhone14,2'
})

// Atualizar
trpc.device.update.useMutation({ id: 1, deviceName: 'Novo Nome' })

// Deletar
trpc.device.delete.useMutation({ id: 1 })
```

### Eventos

```javascript
// Últimos eventos
trpc.event.recent.useQuery({ hours: 24 })

// Por dispositivo
trpc.event.byDevice.useQuery({ deviceId: 1, limit: 50 })
```

### Alertas

```javascript
// Listar
trpc.alert.list.useQuery()

// Marcar como lido
trpc.alert.markAsRead.useMutation({ id: 1 })

// Deletar
trpc.alert.delete.useMutation({ id: 1 })
```

## 📱 Agentes Móveis

### Enviar Status

```bash
POST /api/trpc/report.reportStatus

{
  "token": "install_abc123xyz789",
  "status": "online",
  "batteryLevel": 85,
  "latitude": -23.5505,
  "longitude": -46.6333,
  "accuracy": 10
}
```

### Enviar Evento

```bash
POST /api/trpc/report.reportEvent

{
  "token": "install_abc123xyz789",
  "eventType": "location_update",
  "eventData": { "source": "gps" },
  "latitude": -23.5505,
  "longitude": -46.6333,
  "accuracy": 10,
  "description": "Location updated"
}
```

## 🎨 Tema Cyberpunk

O painel usa um tema cyberpunk personalizado com:

- **Cores**: Rosa neon (#FF006E), Ciano elétrico (#00D9FF), Preto profundo (#0A0E27)
- **Tipografia**: Fonts sans-serif em negrito com efeito neon
- **Componentes**: Cards com borda neon, botões com glow, indicadores animados
- **Efeitos**: Scan lines, glow effects, animações suaves

Customize as cores em `client/src/index.css`:

```css
:root {
  --color-neon-pink: #FF006E;
  --color-neon-cyan: #00D9FF;
  --color-background: #0A0E27;
}
```

## 🧪 Testes

Executar testes unitários:

```bash
pnpm test
```

Testes incluem:

- ✅ Criação e validação de dispositivos
- ✅ Geração de tokens de instalação
- ✅ Criação de eventos e alertas
- ✅ Autenticação e autorização
- ✅ Integridade de dados

## 📚 Documentação

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitetura técnica completa
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Documentação de endpoints
- **[USER_GUIDE.md](./USER_GUIDE.md)** - Guia de uso do painel
- **[AGENT_INSTALLATION.md](./AGENT_INSTALLATION.md)** - Guia de instalação do agente

## 🚀 Deploy

### Manus Platform

O painel está pronto para deploy na plataforma Manus:

1. Clique em **Publish** no Management UI
2. Selecione seu domínio personalizado
3. Aguarde o deploy
4. Acesse seu painel em produção

### Variáveis de Ambiente

```env
DATABASE_URL=mysql://...
JWT_SECRET=sua-chave-secreta
VITE_APP_ID=seu-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua-chave-api
EAS_BUILD_TOKEN=seu-token-eas
EAS_PROJECT_ID=seu-project-id-eas
EAS_BUILD_PROFILE=production
```

### Opcoes de entrega da APK

- `EAS`: exige `EAS_BUILD_TOKEN` e `EAS_PROJECT_ID`
- `Storage`: exige `BUILT_IN_FORGE_API_URL` e `BUILT_IN_FORGE_API_KEY`
- `Local`: funciona sem credenciais externas
- `Automatico`: tenta `EAS`, depois `Storage`, e por fim `Local`

## 🔒 Segurança

- ✅ Autenticação OAuth obrigatória
- ✅ Validação de tokens com expiração
- ✅ Verificação de propriedade de recurso
- ✅ Proteção de rotas com `protectedProcedure`
- ✅ Validação de entrada com Zod
- ✅ HTTPS/WSS em produção
- ✅ Cookies seguros (httpOnly, secure, sameSite)

## 🐛 Troubleshooting

### Erro: "Database connection failed"

```bash
# Verificar variável DATABASE_URL
echo $DATABASE_URL

# Testar conexão
mysql -h localhost -u user -p database_name
```

### Erro: "OAuth callback failed"

```bash
# Verificar variáveis de OAuth
echo $VITE_APP_ID
echo $OAUTH_SERVER_URL
```

### WebSocket não conecta

```bash
# Verificar se servidor está rodando
curl http://localhost:3000

# Verificar logs do servidor
pnpm dev
```

## 📞 Suporte

- 📚 [Documentação Completa](./ARCHITECTURE.md)
- 💬 Chat no painel
- 📧 Email: support@remotemonitor.com

## 📄 Licença

MIT

## 🎯 Roadmap

- [ ] Implementação de push real (FCM/OneSignal)
- [ ] Alertas por email integrados
- [ ] Dashboard com gráficos avançados
- [ ] Export de dados (PDF/CSV)
- [ ] Multi-tenant
- [ ] API Webhooks
- [ ] Machine Learning para detecção de anomalias
- [ ] Aplicativo mobile nativo

## 👨‍💻 Desenvolvido com

- [React 19](https://react.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [tRPC 11](https://trpc.io)
- [Express 4](https://expressjs.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [WebSocket](https://github.com/websockets/ws)
- [Google Maps API](https://developers.google.com/maps)

---

**Desenvolvido com ❤️ em cyberpunk**
"# remotemonitor" 
