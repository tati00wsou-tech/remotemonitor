# Documentação da API - Painel de Monitoramento Remoto

## Visão Geral

A API do painel de monitoramento remoto é construída com **tRPC**, fornecendo endpoints type-safe com autenticação integrada.

## Base URL

```
https://seu-dominio.manus.space/api/trpc
```

## Autenticação

### Tipos de Autenticação

| Tipo | Descrição | Uso |
|------|-----------|-----|
| **OAuth (Painel)** | Login via Manus OAuth | Acesso ao painel web |
| **Token (Agente)** | Token de instalação | Envio de dados do dispositivo |

### OAuth (Painel)

Automaticamente gerenciado pelo navegador via cookies de sessão.

### Token (Agente)

Usado pelos agentes móveis para enviar dados:

```bash
POST /api/trpc/report.reportStatus
Content-Type: application/json

{
  "token": "install_xxxxxxxxxxxxx",
  "status": "online",
  "latitude": -23.5505,
  "longitude": -46.6333
}
```

## Endpoints

### Dispositivos

#### List - Listar Dispositivos

```
GET /api/trpc/device.list
```

**Autenticação**: ✅ Obrigatória (OAuth)

**Response**:
```json
[
  {
    "id": 1,
    "userId": 1,
    "deviceId": "device-123",
    "deviceName": "iPhone 14",
    "deviceType": "ios",
    "osVersion": "17.0",
    "manufacturer": "Apple",
    "model": "iPhone14,2",
    "status": "online",
    "lastLocation": {
      "latitude": -23.5505,
      "longitude": -46.6333,
      "accuracy": 10,
      "timestamp": "2026-04-09T17:18:00Z"
    },
    "lastSeen": "2026-04-09T17:18:00Z",
    "createdAt": "2026-04-09T10:00:00Z",
    "updatedAt": "2026-04-09T17:18:00Z"
  }
]
```

#### Create - Criar Dispositivo

```
POST /api/trpc/device.create
```

**Autenticação**: ✅ Obrigatória (OAuth)

**Input**:
```json
{
  "deviceId": "device-123",
  "deviceName": "iPhone 14",
  "deviceType": "ios",
  "osVersion": "17.0",
  "manufacturer": "Apple",
  "model": "iPhone14,2"
}
```

**Response**:
```json
{
  "id": 1,
  "deviceId": "device-123",
  "deviceName": "iPhone 14",
  "installationToken": "install_abc123xyz789"
}
```

**Erros**:
- `400`: Dados inválidos
- `401`: Não autenticado

#### Update - Atualizar Dispositivo

```
POST /api/trpc/device.update
```

**Autenticação**: ✅ Obrigatória (OAuth)

**Input**:
```json
{
  "id": 1,
  "deviceName": "iPhone 14 Pro",
  "osVersion": "17.1"
}
```

**Response**:
```json
{
  "success": true
}
```

#### Delete - Deletar Dispositivo

```
POST /api/trpc/device.delete
```

**Autenticação**: ✅ Obrigatória (OAuth)

**Input**:
```json
{
  "id": 1
}
```

**Response**:
```json
{
  "success": true
}
```

### Eventos

#### Recent - Eventos Recentes

```
GET /api/trpc/event.recent?hours=24
```

**Autenticação**: ✅ Obrigatória (OAuth)

**Query Parameters**:
- `hours` (number): Últimas N horas (padrão: 24)

**Response**:
```json
[
  {
    "id": 1,
    "userId": 1,
    "deviceId": 1,
    "eventType": "location_update",
    "eventData": {
      "source": "gps"
    },
    "latitude": -23.5505,
    "longitude": -46.6333,
    "accuracy": 10,
    "description": "Location updated",
    "createdAt": "2026-04-09T17:18:00Z"
  }
]
```

#### By Device - Eventos por Dispositivo

```
GET /api/trpc/event.byDevice?deviceId=1&limit=50
```

**Autenticação**: ✅ Obrigatória (OAuth)

**Query Parameters**:
- `deviceId` (number): ID do dispositivo
- `limit` (number): Limite de resultados (padrão: 50)

**Response**: Array de eventos

### Alertas

#### List - Listar Alertas

```
GET /api/trpc/alert.list
```

**Autenticação**: ✅ Obrigatória (OAuth)

**Response**:
```json
[
  {
    "id": 1,
    "userId": 1,
    "deviceId": 1,
    "alertType": "offline",
    "title": "Dispositivo Offline",
    "message": "iPhone 14 ficou offline",
    "isRead": false,
    "emailSent": true,
    "pushSent": false,
    "createdAt": "2026-04-09T17:18:00Z"
  }
]
```

#### Mark as Read - Marcar como Lido

```
POST /api/trpc/alert.markAsRead
```

**Autenticação**: ✅ Obrigatória (OAuth)

**Input**:
```json
{
  "id": 1
}
```

**Response**:
```json
{
  "success": true
}
```

#### Delete - Deletar Alerta

```
POST /api/trpc/alert.delete
```

**Autenticação**: ✅ Obrigatória (OAuth)

**Input**:
```json
{
  "id": 1
}
```

**Response**:
```json
{
  "success": true
}
```

### Tokens de Instalação

#### Generate - Gerar Token

```
POST /api/trpc/token.generate
```

**Autenticação**: ✅ Obrigatória (OAuth)

**Input**:
```json
{
  "deviceId": 1,
  "tokenType": "ios"
}
```

**Response**:
```json
{
  "token": "install_abc123xyz789",
  "expiresAt": "2026-05-09T17:18:00Z"
}
```

#### List - Listar Tokens

```
GET /api/trpc/token.list?deviceId=1
```

**Autenticação**: ✅ Obrigatória (OAuth)

**Query Parameters**:
- `deviceId` (number): ID do dispositivo

**Response**:
```json
[
  {
    "id": 1,
    "token": "install_abc123xyz789",
    "tokenType": "ios",
    "isUsed": false,
    "expiresAt": "2026-05-09T17:18:00Z",
    "createdAt": "2026-04-09T17:18:00Z"
  }
]
```

#### Revoke - Revogar Token

```
POST /api/trpc/token.revoke
```

**Autenticação**: ✅ Obrigatória (OAuth)

**Input**:
```json
{
  "id": 1
}
```

**Response**:
```json
{
  "success": true
}
```

### Relatórios (Público)

#### Report Status - Enviar Status

```
POST /api/trpc/report.reportStatus
```

**Autenticação**: ❌ Pública (Token de Instalação)

**Input**:
```json
{
  "token": "install_abc123xyz789",
  "status": "online",
  "batteryLevel": 85,
  "latitude": -23.5505,
  "longitude": -46.6333,
  "accuracy": 10
}
```

**Response**:
```json
{
  "success": true
}
```

**Erros**:
- `400`: Token inválido ou expirado
- `400`: Dados inválidos

#### Report Event - Enviar Evento

```
POST /api/trpc/report.reportEvent
```

**Autenticação**: ❌ Pública (Token de Instalação)

**Input**:
```json
{
  "token": "install_abc123xyz789",
  "eventType": "location_update",
  "eventData": {
    "source": "gps",
    "accuracy": "high"
  },
  "latitude": -23.5505,
  "longitude": -46.6333,
  "accuracy": 10,
  "description": "Location updated via GPS"
}
```

**Response**:
```json
{
  "success": true
}
```

## Autenticação

### Login

```
GET /api/oauth/login?returnPath=/dashboard
```

Redireciona para o portal de login Manus OAuth.

### Logout

```
POST /api/trpc/auth.logout
```

**Autenticação**: ✅ Obrigatória (OAuth)

**Response**:
```json
{
  "success": true
}
```

### Me - Usuário Atual

```
GET /api/trpc/auth.me
```

**Autenticação**: ✅ Obrigatória (OAuth)

**Response**:
```json
{
  "id": 1,
  "openId": "user-123",
  "name": "João Silva",
  "email": "joao@example.com",
  "role": "admin",
  "createdAt": "2026-04-09T10:00:00Z"
}
```

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `200` | Sucesso |
| `400` | Requisição inválida |
| `401` | Não autenticado |
| `403` | Acesso negado |
| `404` | Recurso não encontrado |
| `500` | Erro interno do servidor |

## Rate Limiting

- **Painel**: 100 requisições por minuto por usuário
- **Agente**: 10 requisições por minuto por token

## Exemplos de Integração

### JavaScript/Node.js

```javascript
// Usando tRPC client
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

const trpc = createTRPCProxyClient({
  links: [
    httpBatchLink({
      url: 'https://seu-dominio.manus.space/api/trpc',
    }),
  ],
});

// Listar dispositivos
const devices = await trpc.device.list.query();

// Criar dispositivo
const newDevice = await trpc.device.create.mutate({
  deviceId: 'device-123',
  deviceName: 'iPhone 14',
  deviceType: 'ios',
  osVersion: '17.0',
  manufacturer: 'Apple',
  model: 'iPhone14,2',
});
```

### Python (Agente)

```python
import requests
import json

# Enviar status
response = requests.post(
    'https://seu-dominio.manus.space/api/trpc/report.reportStatus',
    json={
        'token': 'install_abc123xyz789',
        'status': 'online',
        'batteryLevel': 85,
        'latitude': -23.5505,
        'longitude': -46.6333,
        'accuracy': 10
    }
)

print(response.json())
```

### Swift (iOS)

```swift
import Foundation

let url = URL(string: "https://seu-dominio.manus.space/api/trpc/report.reportStatus")!
var request = URLRequest(url: url)
request.httpMethod = "POST"
request.setValue("application/json", forHTTPHeaderField: "Content-Type")

let payload = [
    "token": "install_abc123xyz789",
    "status": "online",
    "batteryLevel": 85,
    "latitude": -23.5505,
    "longitude": -46.6333,
    "accuracy": 10
] as [String : Any]

request.httpBody = try JSONSerialization.data(withJSONObject: payload)

URLSession.shared.dataTask(with: request) { data, response, error in
    if let data = data {
        let json = try JSONSerialization.jsonObject(with: data)
        print(json)
    }
}.resume()
```

## Webhooks (Futuro)

Integração com webhooks para eventos externos será implementada em breve.

## Changelog

### v1.0.0 (2026-04-09)
- ✅ API inicial com endpoints principais
- ✅ Autenticação OAuth
- ✅ Tokens de instalação
- ✅ Relatórios públicos

### v1.1.0 (Planejado)
- ⏳ Webhooks
- ⏳ Paginação avançada
- ⏳ Filtros complexos
- ⏳ Exportação de dados

## Suporte

Para dúvidas sobre a API:

- 📚 **Documentação**: https://docs.remotemonitor.com
- 💬 **Chat**: Clique em "Ajuda" no painel
- 📧 **Email**: api-support@remotemonitor.com
