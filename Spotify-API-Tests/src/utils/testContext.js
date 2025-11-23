const fs = require("fs");
const path = require("path");

class TestContext {
  constructor() {
    this.token = null;
    this.userId = null;
    this.startTime = null;
    this.executionData = {
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      totalTime: 0,
      metrics: {}
    };

    // Dados de teste reutilizáveis
    this.testData = {
      // Álbuns
      albums: {
        validId: "4aawyAB9vmqN3uQ7FjRGTy",
        validIds: "4aawyAB9vmqN3uQ7FjRGTy,382ObEPsp2rxGrnsizN5TX",
        invalidId: "xxxxx",
        market: "US",
        invalidMarket: "ZZ"
      },

      // Artistas
      artists: {
        searchQuery: "Taylor Swift",
        type: "artist",
        limit: 1
      },

      // Playlists
      playlists: {
        searchQuery: "workout",
        type: "playlist",
        limit: 10
      },

      // Usuários
      users: {
        publicUserId: "spotify",
        market: "US"
      },

      // Endpoints
      endpoints: {
        albums: "/albums",
        artists: "/search",
        me: "/me",
        devices: "/me/player/devices",
        users: "/users"
      }
    };

    // Configurações de API
    this.apiConfig = {
      baseURL: "https://api.spotify.com/v1",
      timeout: 5000,
      defaultLimit: 20,
      maxRetries: 3,
      retryDelay: 1000
    };

    // Códigos de erro esperados
    this.errorCodes = {
      badRequest: 400,
      unauthorized: 401,
      forbidden: 403,
      notFound: 404,
      tooManyRequests: 429,
      serverError: 500
    };

    // Validações comuns
    this.validations = {
      contentTypeJson: "application/json",
      maxResponseTime: 1500,
      minResponseTime: 100
    };
  }

 // Define o token de autenticação
  setToken(token) {
    this.token = token;
  }

   //Define o ID do usuário
  setUserId(userId) {
    this.userId = userId;
  }

   //Inicia o cronômetro de execução
  startTimer() {
    this.startTime = Date.now();
  }

 //Calcula o tempo decorrido desde o início
  getElapsedTime() {
    if (!this.startTime) return null;
    return Date.now() - this.startTime;
  }

 
   //Registra uma métrica de teste
  recordMetric(testCase, metricName, value) {
    if (!this.executionData.metrics[testCase]) {
      this.executionData.metrics[testCase] = {};
    }
    this.executionData.metrics[testCase][metricName] = value;
  }


  //Incrementa contador de testes aprovados
  recordPass() {
    this.executionData.passedTests += 1;
  }

 
   //Incrementa contador de testes falhados
  recordFail() {
    this.executionData.failedTests += 1;
  }

   //Incrementa contador de testes ignorados
  recordSkip() {
    this.executionData.skippedTests += 1;
  }


  //Retorna resumo de execução
  getSummary() {
    return {
      ...this.executionData,
      totalTime: this.getElapsedTime(),
      totalTests: this.executionData.passedTests + this.executionData.failedTests,
      successRate: (
        (this.executionData.passedTests /
          (this.executionData.passedTests + this.executionData.failedTests)) *
        100
      ).toFixed(2) + "%"
    };
  }


   // Limpa o contexto
  reset() {
    this.token = null;
    this.userId = null;
    this.startTime = null;
    this.executionData = {
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      totalTime: 0,
      metrics: {}
    };
  }

   // Valida se o token está configurado
  isTokenSet() {
    return !!this.token;
  }


   // Obtém dados de teste por categoria
  getTestData(category) {
    return this.testData[category] || null;
  }

  
   //Obtém configuração de API
  getApiConfig() {
    return this.apiConfig;
  }


   //Valida resposta HTTP padrão
  validateHttpResponse(response, expectedStatus = 200) {
    const validations = {
      statusCode: response.status === expectedStatus,
      contentType: response.headers["content-type"]?.includes(
        this.validations.contentTypeJson
      ),
      hasData: !!response.data
    };

    return {
      isValid: Object.values(validations).every(v => v),
      validations
    };
  }

  
   // Cria estrutura de dados para ambiente de teste
   
  setupEnvironment() {
    const logsDir = path.join(__dirname, "../../logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    return {
      logsDir,
      startTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || "test"
    };
  }
}

// Instância singleton
const contextInstance = new TestContext();

module.exports = contextInstance;
