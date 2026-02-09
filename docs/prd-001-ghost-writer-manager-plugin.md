---
id: PRD-001
name: Ghost Writer Manager Plugin for Obsidian
version: 1.0.0
created: 2026-02-08
updated: 2026-02-08
status: approved
created_by: Diego Eis
last_editor: Diego Eis
---

# PRD-001: Ghost Writer Manager Plugin for Obsidian

## TL;DR

- **What** to solve:
  - Criadores de conteúdo que usam Ghost precisam alternar entre o editor do Ghost e suas ferramentas de escrita, criando fricção no fluxo de trabalho
  - Não existe integração nativa entre Obsidian e Ghost, forçando processos manuais de copiar/colar conteúdo e gerenciar metadados
  - O controle editorial (status, tags, agendamento) está isolado no Ghost Admin, sem visibilidade no ambiente de escrita do autor
- **Why** solve it:
  - Reduzir o tempo gasto em tarefas operacionais de publicação, permitindo que criadores foquem na escrita
  - Centralizar o fluxo de criação e publicação em um único ambiente (Obsidian), eliminando a troca de contexto
  - Dar ao autor controle total sobre suas publicações usando arquivos Markdown e propriedades YAML, formatos que já domina
- **How** to solve:
  - Plugin Obsidian que sincroniza bidirecionalmente posts do Ghost com notas Markdown no vault, usando a Admin API do Ghost
  - Controle editorial via propriedades YAML (status, tags, imagem de destaque, excerpt) com prefixo configurável
  - Calendário editorial na sidebar do Obsidian com visualização por data de publicação e acesso direto às notas e ao Ghost Admin

## Context

Criadores de conteúdo que utilizam Ghost como plataforma de publicação frequentemente adotam Obsidian como ferramenta principal de escrita devido ao seu suporte nativo a Markdown, sistema de links bidirecionais e capacidade de organização via vault. No entanto, a falta de integração entre essas duas ferramentas cria um fluxo fragmentado: o autor escreve no Obsidian, copia manualmente para o Ghost, e precisa alternar entre os dois ambientes para gerenciar metadados como tags, status de publicação e imagens de destaque.

Esse fluxo manual não apenas consome tempo, mas também introduz riscos de inconsistência entre versões, perda de alterações e falta de visibilidade sobre o calendário editorial. Para autores que publicam com frequência, essa fricção se acumula e impacta diretamente a produtividade.

O Ghost Writer Manager Plugin resolve esse problema ao trazer o gerenciamento completo de publicações Ghost para dentro do Obsidian, permitindo que o autor controle todo o ciclo de vida de um post — da escrita à publicação — sem sair do seu ambiente de trabalho preferido.

### Problem or Opportunity Statement

O fluxo atual de criação e publicação de conteúdo entre Obsidian e Ghost é manual, fragmentado e propenso a erros. Autores perdem tempo com tarefas operacionais que poderiam ser automatizadas, e não possuem uma visão consolidada do seu calendário editorial dentro do ambiente de escrita.

- Sincronização manual de conteúdo entre Obsidian e Ghost: o autor precisa copiar/colar texto entre as duas plataformas, resultando em versões desatualizadas e risco de sobrescrever alterações
- Falta de controle editorial no ambiente de escrita: informações como status de publicação, tags e imagem de destaque só podem ser gerenciadas no Ghost Admin, exigindo troca constante de contexto
- Ausência de visão temporal das publicações: o autor não tem um calendário editorial integrado ao Obsidian, dificultando o planejamento e acompanhamento de publicações

## Solution

Plugin Obsidian que sincroniza bidirecionalmente posts do Ghost com notas Markdown no vault, oferecendo controle editorial via YAML e calendário na sidebar.

O Ghost Writer Manager Plugin é um plugin para Obsidian que conecta diretamente o vault do usuário à sua instância Ghost via Admin API, eliminando a necessidade de copiar conteúdo manualmente entre as plataformas. O plugin sincroniza automaticamente posts do Ghost com arquivos Markdown no Obsidian, permitindo que o autor escreva, edite e gerencie metadados de publicação usando propriedades YAML familiares.

A sincronização bidirecional garante que alterações feitas em qualquer uma das plataformas sejam refletidas na outra, com resolução inteligente de conflitos quando ambas são editadas simultaneamente. Um calendário editorial na sidebar do Obsidian oferece visão temporal das publicações, organizado por data de publicação e agrupado por status.

O custo de oportunidade de não implementar essa solução é a continuidade de um fluxo manual que consome tempo, introduz erros e fragmenta a experiência do criador de conteúdo.

*Listing of functionalities that make up the solution scope:*

- **[FRD-001](docs/frd/frd-001-calendario-editorial.md):** Calendário editorial na sidebar do Obsidian com visualização de publicações por data, agrupadas por status, com links diretos para as notas no vault e para o Ghost Admin
- **[FRD-002](docs/frd/frd-002-sincronizacao-bidirecional.md):** Sincronização bidirecional automática de posts entre Ghost e Obsidian, com frequência configurável, detecção de conflitos e merge inteligente
- **[FRD-003](docs/frd/frd-003-pasta-sincronizacao.md):** Configuração de pasta de sincronização no vault com movimentação automática de notas e isolamento de arquivos não-sincronizados
- **[FRD-004](docs/frd/frd-004-controle-yaml.md):** Controle de metadados de publicação via propriedades YAML com prefixo configurável, incluindo status, tags, imagem de destaque e flag de no-sync
- **[FRD-005](docs/frd/frd-005-integracao-ghost-api.md):** Integração com Ghost Admin API usando armazenamento seguro de credenciais via Obsidian Keychain, com autenticação JWT
- **[FRD-006](docs/frd/frd-006-conversao-formato.md):** Conversão bidirecional de formato entre Markdown (Obsidian) e Lexical/HTML (Ghost) para sincronização completa de conteúdo

### What this Initiative is Not

Este plugin não é um editor completo do Ghost dentro do Obsidian. Ele não replica funcionalidades exclusivas do Ghost Admin como gerenciamento de membros, newsletters, temas, configurações do site ou analytics. Também não é um sistema de CMS genérico — ele é específico para a integração Ghost + Obsidian. O plugin não gerencia Pages do Ghost, focando exclusivamente em Posts. Não é uma ferramenta de migração em massa de conteúdo — na v1, ele sincroniza apenas publicações criadas a partir da data de instalação.

### Technical Solution Summary

O plugin será desenvolvido em TypeScript seguindo as diretrizes e boas práticas de desenvolvimento de plugins Obsidian (ESLint rules, memory management, type safety, accessibility). Utilizará a Admin API do Ghost com autenticação JWT para operações CRUD de posts, com credenciais armazenadas de forma segura via Obsidian Secret Storage (Keychain). A conversão de conteúdo será feita bidirecionalmente entre Markdown e o formato Lexical/HTML do Ghost.

## Success Indicators

- **Taxa de sincronização bem-sucedida**: ≥ 99% das sincronizações completadas sem erro, medido pelo plugin internamente
- **Redução de tempo operacional**: Redução de pelo menos 10 minutos por post no fluxo de publicação (comparado ao processo manual de copiar/colar e configurar metadados)
- **Adoção de funcionalidades**: ≥ 70% dos usuários ativos utilizando controle via YAML e calendário editorial após 30 dias de uso
- **Resolução de conflitos**: ≥ 95% dos conflitos resolvidos automaticamente pelo merge inteligente sem intervenção manual
- **Integridade de conteúdo**: Zero perda de conteúdo durante sincronizações, verificado por checksums antes e depois do sync

## Scope

### Future Evolutions

- **[FRD-007](docs/frd/frd-007-sincronizacao-historica.md) - Sincronização de publicações históricas** - (ICEBOX): Permitir que o usuário sincronize publicações criadas antes da instalação do plugin, com opções de filtro por data, tag ou status
- **[FRD-008](docs/frd/frd-008-suporte-pages.md) - Suporte a Pages do Ghost** - (ICEBOX): Expandir a sincronização para incluir páginas estáticas do Ghost, além de posts
- **[FRD-009](docs/frd/frd-009-preview-publicacao.md) - Preview de publicação** - (ICEBOX): Visualização prévia de como o post aparecerá no Ghost antes de publicar, diretamente no Obsidian
- **[FRD-010](docs/frd/frd-010-templates-publicacao.md) - Templates de publicação** - (ICEBOX): Templates pré-configurados para novos posts com YAML preenchido e estrutura de conteúdo padrão

### Out of Scope of this Initiative's Concept

- Gerenciamento de membros e assinaturas do Ghost
- Gerenciamento de newsletters e campanhas de email do Ghost
- Configuração de temas e design do site Ghost
- Analytics e métricas de leitura do Ghost
- Gerenciamento de Pages do Ghost (escopo futuro)
- Sincronização de publicações criadas antes da instalação do plugin (escopo futuro)
- Migração em massa de conteúdo entre plataformas
- Suporte a outras plataformas de publicação além do Ghost

## Artifacts and Documentation

- [Ghost Admin API Documentation](https://docs.ghost.org/admin-api/)
- [Ghost Content API Documentation](https://docs.ghost.org/content-api/)
- [Ghost Custom Integrations](https://ghost.org/integrations/custom-integrations/)
- [Obsidian Plugin Developer Docs](https://docs.obsidian.md/)
- [Obsidian Secret Storage (Keychain)](https://docs.obsidian.md/plugins/guides/secret-storage)
- [Obsidian Plugin Guidelines - SKILL.md](.claude/skills/obsidian/SKILL.md)
