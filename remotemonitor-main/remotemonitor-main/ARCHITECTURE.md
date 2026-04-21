# Arquitetura - Sistema de Monitoramento Remoto

## Visão Geral

O **Sistema de Monitoramento Remoto** é uma plataforma web moderna para monitoramento de dispositivos móveis Android e iOS em tempo real, com interface cyberpunk de alto impacto visual.

## Stack Tecnológico

| Camada | Tecnologia | Descrição |
|--------|-----------|-----------|
| **Frontend** | React 19 + Tailwind CSS 4 | Interface responsiva com tema cyberpunk |
| **Backend** | Node.js + Express + tRPC | APIs type-safe com autenticação OAuth |
| **Banco de Dados** | MySQL/TiDB + Drizzle ORM | Schema relacional com migrações |
| **Tempo Real** | WebSocket (ws) | Atualizações instantâneas do painel |
| **Autenticação** | Manus OAuth | Login seguro integrado |
| **Mapas** | Google Maps API | Visualização de localização em tempo real |

## Arquitetura de Dados

### Tabelas Principais

```
users (autenticação)
├── id (PK)
├── openId (OAuth)
├── name, email
├── role (admin/user)
└── timestamps

devices (dispositivos monitorados)
├── id (PK)
├── userId (FK)
├── deviceId, deviceName
├── deviceType (android/ios)
├── status (online/offline/error)
├── lastLocation (JSON)
├── lastSeen
└── timestamps

events (histórico de atividades)
├── id (PK)
├── userId, deviceId (FK)
├── eventType (location_update, status_change, etc)
├── eventData (JSON)
├── latitude, longitude, accuracy
└── timestamps

alerts (notificações)
├── id (PK)
├── userId, deviceId (FK)
├── alertType (offline, location_change, etc)
├── title, message
├── isRead, emailSent, pushSent
└── timestamps

alertConfigs (configuração de alertas)
├── id (PK)
├── userId, deviceId (FK)
├── alertType
├── isEnabled
├── notificationMethod (email/push/both)
├── threshold (JSON)
└── timestamps

installationTokens (tokens para instalação de agentes)
├── id (PK)
├── userId, deviceId (FK)
├── token (único)
├── tokenType (android/ios)
├── isUsed
├── expiresAt
└── timestamps

websocketSessions (sessões WebSocket ativas)
├── id (PK)
├── userId (FK)
├── sessionId (único)
├── isActive
├── lastHeartbeat
└── timestamps
```

## Fluxo de Dados

### 1. Instalação e Autenticação

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuário faz login no painel (OAuth Manus)               │
│ 2. Cria novo dispositivo no painel                         │
│ 3. Sistema gera token de instalação único                  │
│ 4. Usuário compartilha token com agente mobile             │
│ 5. Agente valida token e começa a enviar dados            │
└─────────────────────────────────────────────────────────────┘
```

### 2. Recebimento de Dados em Tempo Real

```
┌──────────────────────────────────────────────────────────────┐
│ Dispositivo Mobile (Agent)                                   │
│ ├─ Coleta: localização, status, eventos                     │
│ └─ Envia: POST /api/trpc/report.reportStatus                │
│                                                              │
│ ↓                                                             │
│                                                              │
│ Backend (Node.js + tRPC)                                    │
│ ├─ Valida token de instalação                              │
│ ├─ Armazena dados no banco                                 │
│ ├─ Cria evento no histórico                                │
│ ├─ Verifica alertas configurados                           │
│ └─ Emite via WebSocket para clientes conectados            │
│                                                              │
│ ↓                                                             │
│                                                              │
│ Frontend (React)                                            │
│ ├─ Recebe atualização via WebSocket                        │
│ ├─ Atualiza dashboard em tempo real                        │
│ ├─ Mostra notificação visual                               │
│ └─ Sem necessidade de reload da página                     │
└──────────────────────────────────────────────────────────────┘
```

### 3. Sistema de Alertas

```
┌─────────────────────────────────────────────────────────────┐
│ Evento Detectado (offline, localização, bateria baixa)     │
│                                                             │
│ ↓                                                            │
│                                                             │
│ Verificar Configuração de Alerta                           │
│ ├─ Está ativado?                                           │
│ ├─ Qual método? (email/push/ambos)                         │
│ └─ Qual threshold?                                         │
│                                                             │
│ ↓                                                            │
│                                                             │
│ Enviar Notificações                                        │
│ ├─ Email: Via notifyOwner() do Manus                       │
│ ├─ Push: Integração com Firebase/OneSignal                 │
│ └─ Dashboard: WebSocket em tempo real                      │
│                                                             │
│ ↓                                                            │
│                                                             │
│ Registrar no Banco                                         │
│ └─ Criar registro de alerta com status de envio            │
└─────────────────────────────────────────────────────────────┘
```

## APIs tRPC

### Dispositivos (`/device`)

| Procedure | Tipo | Descrição |
|-----------|------|-----------|
| `list` | Query | Listar todos os dispositivos do usuário |
| `create` | Mutation | Criar novo dispositivo |
| `update` | Mutation | Atualizar dados do dispositivo |
| `delete` | Mutation | Deletar dispositivo |
| `getById` | Query | Obter detalhes de um dispositivo |

### Eventos (`/event`)

| Procedure | Tipo | Descrição |
|-----------|------|-----------|
| `recent` | Query | Últimos eventos (últimas 24h) |
| `byDevice` | Query | Eventos de um dispositivo específico |
| `create` | Mutation | Criar novo evento |

### Alertas (`/alert`)

| Procedure | Tipo | Descrição |
|-----------|------|-----------|
| `list` | Query | Listar alertas não lidos |
| `markAsRead` | Mutation | Marcar alerta como lido |
| `delete` | Mutation | Deletar alerta |
| `getConfig` | Query | Obter configuração de alertas |
| `updateConfig` | Mutation | Atualizar configuração |

### Tokens (`/token`)

| Procedure | Tipo | Descrição |
|-----------|------|-----------|
| `generate` | Mutation | Gerar novo token de instalação |
| `list` | Query | Listar tokens de um dispositivo |
| `revoke` | Mutation | Revogar token |

### Relatórios (Público) (`/report`)

| Procedure | Tipo | Descrição |
|-----------|------|-----------|
| `reportStatus` | Mutation | Enviar status do dispositivo |
| `reportEvent` | Mutation | Enviar evento customizado |

## WebSocket

### Conexão

```javascript
// Cliente se conecta
const ws = new WebSocket('wss://domain.com/ws');

// Se inscreve em atualizações
ws.send(JSON.stringify({
  type: 'subscribe',
  userId: 123,
  deviceId: 456,
  sessionId: 'session_xxx'
}));
```

### Mensagens

| Tipo | Direção | Descrição |
|------|---------|-----------|
| `ping` | Server → Client | Manter conexão viva |
| `pong` | Client → Server | Resposta ao ping |
| `device-update` | Server → Client | Atualização de status do dispositivo |
| `event` | Server → Client | Novo evento criado |
| `alert` | Server → Client | Novo alerta gerado |
| `subscribed` | Server → Client | Confirmação de inscrição |

## Fluxo de Autenticação

```
┌────────────────────────────────────────────────────────────┐
│ 1. Usuário clica "Login"                                   │
│ 2. Redireciona para Manus OAuth Portal                     │
│ 3. Usuário autoriza acesso                                 │
│ 4. Callback para /api/oauth/callback                       │
│ 5. Sistema cria/atualiza usuário no banco                  │
│ 6. Define cookie de sessão seguro                          │
│ 7. Redireciona para dashboard                              │
│ 8. Todas as requisições tRPC incluem contexto do usuário   │
│ 9. protectedProcedure valida autenticação                  │
│ 10. publicProcedure permite acesso sem login (ex: /report) │
└────────────────────────────────────────────────────────────┘
```

## Segurança

### Validações Implementadas

- ✅ Autenticação OAuth obrigatória para painel
- ✅ Validação de tokens de instalação com expiração
- ✅ Verificação de propriedade de recurso (userId)
- ✅ Proteção de rotas com `protectedProcedure`
- ✅ Validação de entrada com Zod
- ✅ HTTPS/WSS obrigatório em produção
- ✅ Cookies seguros (httpOnly, secure, sameSite)

### Recomendações Adicionais

- [ ] Implementar rate limiting nos endpoints públicos
- [ ] Adicionar CORS restritivo
- [ ] Implementar audit logging
- [ ] Criptografar dados sensíveis no banco
- [ ] Implementar 2FA para usuários admin
- [ ] Validar certificados SSL/TLS

## Performance

### Índices de Banco de Dados

```sql
-- Queries rápidas por usuário
CREATE INDEX idx_devices_userId ON devices(userId);
CREATE INDEX idx_events_userId_deviceId ON events(userId, deviceId);
CREATE INDEX idx_alerts_userId ON alerts(userId);

-- Queries de localização recente
CREATE INDEX idx_events_createdAt ON events(createdAt DESC);
CREATE INDEX idx_devices_lastSeen ON devices(lastSeen DESC);
```

### Otimizações Frontend

- Lazy loading de páginas
- Memoização de componentes
- Debouncing de WebSocket updates
- Compressão de assets
- CDN para imagens/mídia

## Escalabilidade

### Para Crescimento

1. **Banco de Dados**: Migrar para cluster MySQL/TiDB
2. **WebSocket**: Usar Redis Pub/Sub para múltiplos servidores
3. **Cache**: Implementar Redis para dados frequentes
4. **Notificações**: Usar fila de mensagens (RabbitMQ/SQS)
5. **Monitoramento**: Integrar APM (New Relic, DataDog)

## Deployment

### Ambiente de Produção

```
┌──────────────────────────────────────────────┐
│ Manus Platform                               │
│ ├─ Frontend: React app (Vite build)         │
│ ├─ Backend: Node.js server (Express)        │
│ ├─ Database: MySQL/TiDB gerenciado          │
│ ├─ SSL/TLS: Certificado automático          │
│ └─ Domínio: xxx.manus.space                 │
└──────────────────────────────────────────────┘
```

## Próximas Fases

1. **Sidebar Navigation**: Layout com navegação persistente
2. **Device Details**: Página completa de detalhes do dispositivo
3. **Advanced Filtering**: Filtros avançados de eventos/alertas
4. **Export Data**: Exportar relatórios em PDF/CSV
5. **Mobile App**: Aplicativo nativo para gerenciar painel
6. **Multi-tenant**: Suporte para múltiplas organizações
7. **API Webhooks**: Integração com sistemas externos
8. **Machine Learning**: Detecção de anomalias automática
