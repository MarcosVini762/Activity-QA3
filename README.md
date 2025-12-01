Framework de Automação de Testes para a API Spotify com integração contínua completa, relatórios em tempo real e cobertura de código automatizada.

## Sumário

- [Visão Geral](#visão-geral)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Execução de Testes](#execução-de-testes)
- [Pipeline de CI/CD](#pipeline-de-cicd)

---

## Visão Geral

Suite completa de automação de testes para a API Spotify com:

- Testes Smoke para validações rápidas
- Testes integrados para Account, Album, Artist, Playlist, Track
- CI/CD Pipeline com GitHub Actions
- Relatórios HTML automáticos
- Análise de cobertura de código
- Execução agendada (diariamente)

## Pré-requisitos

- Node.js v18 ou superior
- npm v9 ou superior
- Git
- Conta de desenvolvedor Spotify ([developer.spotify.com](https://developer.spotify.com/))

## Instalação

```bash
git clone https://github.com/MarcosVini762/Activity-QA3.git
cd Activity-QA3
npm install
```

## Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
CLIENT_ID="seu_client_id_aqui"
CLIENT_SECRET="seu_client_secret_aqui"
```

**Nota**: Nunca faça commit do arquivo `.env` com credenciais reais.

## Execução de Testes

| Comando | Descrição |
|---------|-----------|
| `npm test` | Executa toda a suite de testes |
| `npm run test:smoke` | Executa apenas testes smoke (rápidos) |
| `npm run test:coverage` | Executa testes e gera cobertura |
| `npm run test:watch` | Executa em modo observação |
| `npm run test:all` | Suite completa com verbosidade |
| `npm run test:ci` | Lint + testes + cobertura + relatório |
| `npm run lint` | Verifica qualidade de código |
| `npm run lint:fix` | Corrige problemas de linting |
| `npm run report` | Gera relatório HTML |
| `npm run open:report` | Abre relatório no navegador |

## Estrutura do Projeto

```
Activity-QA3/
├── .github/workflows/
│   └── ci-cd-pipeline.yml        # Pipeline GitHub Actions
├── Spotify-API-Tests/
│   ├── logs/
│   │   └── report.html           # Relatório de testes
│   └── src/
│       ├── tests/
│       │   ├── smoke.test.js
│       │   ├── requestManager.test.js
│       │   └── API-Tests/
│       │       ├── Account/
│       │       ├── Album/
│       │       ├── Artist/
│       │       ├── Coverage/
│       │       ├── Playlist/
│       │       └── Track/
│       └── utils/
│           ├── spotify_auth.js
│           ├── testContext.js
│           ├── logger.js
│           ├── logReportGenerator.js
│           └── metricsCollector.js
├── jest.config.js
├── package.json
├── .env
└── README.md
```

## Pipeline de CI/CD

Pipeline automático que executa em:

1. **Push** em main/develop
2. **Pull Request** para main/develop
3. **Agendado** diariamente às 09:00 UTC

### Fluxo de Execução

```
Evento disparador (push, PR, schedule)
    ↓
Setup Node.js (16.x e 18.x em paralelo)
    ↓
Cache de dependências npm
    ↓
Instalar dependências (npm ci)
    ↓
ESLint - Verificar qualidade de código
    ↓
Executar testes smoke
    ↓
Executar suite completa de testes
    ↓
Gerar cobertura de código
    ↓
Gerar relatório HTML
    ↓
Upload de artefatos (relatórios e cobertura)
    ↓
Comentar resultado em PR (se aplicável)
```

### Métricas de Cobertura

- Branches: Mínimo 30%
- Functions: Mínimo 30%
- Lines: Mínimo 30%
- Statements: Mínimo 30%

## Contribuindo

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

Requisitos para PR:
- Todos os testes passando
- ESLint sem erros
- Cobertura acima de 30%
- Documentação atualizada


## Recursos Úteis

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api/)
- [Jest Documentation](https://jestjs.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [ESLint Documentation](https://eslint.org/)

