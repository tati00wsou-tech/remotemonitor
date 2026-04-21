# Remote Monitor - TODO

## Fase 1: Autenticação
- [x] Página de Login com email/senha
- [x] Integração com autenticação OAuth
- [x] Proteção de rotas autenticadas

## Fase 2: Layout Principal
- [x] Sidebar com navegação (Dashboard, Dispositivos, Alertas, Eventos, Mapa, Relatórios, Conformidade)
- [x] Header com informações do usuário
- [x] Botão "Gerar APK" destacado na sidebar
- [x] Botão "Sair" na sidebar
- [x] Layout responsivo com tema dark (preto/azul/cyan)

## Fase 3: Dashboard
- [x] Card "Dispositivos Ativos" com número
- [x] Card "Alertas Hoje" com número
- [x] Card "Conformidade LGPD" com percentual
- [x] Card "Relatórios" com número
- [x] Seção "Ações Rápidas" com botões (Gerar APK, Gerenciar Dispositivos, Conformidade LGPD)
- [x] Seção "Informações" com features

## Fase 4: Página de Dispositivos
- [x] Lista de dispositivos com status online/offline
- [x] Dispositivos online no topo, offline abaixo
- [x] Botão "Controlar" funcional
- [x] Botão "Ver Detalhes" funcional
- [x] Informações: localização, último acesso, modelo, bateria

## Fase 5: Tela de Controle
- [x] Página de controle remoto do dispositivo
- [x] Botões de ação: Tirar Screenshot, Ativar Som, Bloquear Dispositivo, Rastrear Localização, Sincronizar, Travar Tela
- [x] Ações funcionando (feedback visual)
- [x] Botão "Voltar" para retornar à lista

## Fase 6: Tela de Detalhes
- [x] Página com informações completas do dispositivo
- [x] Dados: modelo, sistema operacional, versão, localização, bateria, sinal, memória, temperatura
- [x] Histórico de atividades
- [x] Botão "Voltar"

## Fase 7: APK Builder
- [x] Página com formulário (Nome da Empresa, URL, Logo)
- [x] Pré-visualização do app
- [x] Barra de progresso durante build
- [x] Download do APK gerado
- [x] Integração na sidebar como botão destacado

## Fase 8: Outras Páginas
- [x] Página de Alertas
- [x] Página de Eventos
- [x] Página de Mapa
- [x] Página de Relatórios
- [x] Página de Conformidade LGPD

## Fase 9: Testes e Finalização
- [x] Testar navegação completa
- [x] Testar autenticação
- [x] Testar responsividade
- [x] Salvar checkpoint final


## Fase 10: Refatoração da Tela de Detalhes
- [x] Adicionar abas (Informações, Comandos, Screenshots, Keylogs)
- [x] Implementar visualização ao vivo do dispositivo
- [x] Adicionar botões de ação no topo (Screenshot, Parar, Controle, Travar, Remover)
- [x] Remover botão "Controlar" da lista de dispositivos
- [x] Testar nova estrutura
- [x] Salvar checkpoint refatorado


## Fase 11: Sistema de Trava de Tela com Senha
- [x] Criar componente LockedScreen com modal de trava
- [x] Implementar campo de entrada de senha
- [x] Validação de senha correta (apenas admin consegue destravar)
- [x] Integrar trava na tela de detalhes
- [x] Feedback visual de tela travada
- [x] Testar trava e desbloqueio
- [x] Salvar checkpoint com trava implementada


## Fase 12: Sistema de Alertas Sonoros e Seleção de Bancos
- [x] Criar lista de bancos (Brasil: todos + Internacionais: principais)
- [x] Adicionar dropdown de bancos no APK Builder
- [x] Implementar som de alerta (bip) quando cliente conecta
- [x] Adicionar notificação visual com nome do banco
- [x] Mostrar banco na lista de dispositivos
- [x] Testar alertas sonoros e visuais
- [x] Salvar checkpoint com alertas implementados


## Fase 13: Sistema de Keylogs com Hist\u00f3rico
## Fase 13: Sistema de Keylogs com Histórico
- [x] Criar estrutura de dados para keylogs (timestamp, app, texto)
- [x] Implementar aba Keylogs com lista de digitações
- [x] Adicionar botão para remover keylogs (individual e em lote)
- [x] Criar aba Histórico para keylogs removidos
- [x] Implementar botão restaurar keylogs
- [x] Testar remoção e restauração
- [x] Salvar checkpoint com keylogs implementados


## Fase 14: Keylogs em Tempo Real + Proteção de App + Mockup
- [x] Implementar keylogs em tempo real com backend tRPC
- [x] Capturar digitações conforme o usuário digita
- [x] Enviar keylogs para o painel instantaneamente
- [x] Adicionar proteção contra remoção do app (oculto/protegido)
- [x] Criar componente mockup de celular (moldura + tela)
- [x] Integrar mockup na visualização ao vivo
- [x] Testar keylogs em tempo real
- [x] Testar visualização ao vivo com mockup
- [x] Salvar checkpoint final


## Fase 15: Keylogs em Tempo Real com Backend
- [x] Criar schema de keylogs no banco de dados (drizzle)
- [x] Migração SQL para tabela de keylogs
- [x] Implementar procedures tRPC para criar/listar/deletar/restaurar keylogs
- [x] Integrar keylogs do backend no frontend (remover mock)
- [x] Implementar WebSocket/SSE para sincronização em tempo real
- [x] Criar simulador de envio de keylogs do app mobile
- [x] Testar keylogs em tempo real no painel
- [x] Salvar checkpoint com keylogs tempo real implementados
