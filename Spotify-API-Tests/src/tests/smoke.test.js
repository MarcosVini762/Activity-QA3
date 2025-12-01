const axios = require("axios");
const requestManager = require("./requestManager");
const { getSpotifyToken } = require("../utils/spotify_auth");
const logger = require("../utils/logger");
const testContext = require("../utils/testContext");

beforeAll(async () => {
  logger.info("TC-SETUP", "OBTER_TOKEN", {});
  testContext.startTimer();
  testContext.setupEnvironment();

  const token = await getSpotifyToken();

  if (!token) {
    logger.error("TC-SETUP", "TOKEN_INVALIDO");
    testContext.recordFail();
    throw new Error("Token inválido");
  }

  testContext.setToken(token);
  requestManager.setToken(token);
  logger.success("TC-SETUP", "TOKEN_APLICADO");
});

afterAll(() => {
  const summary = testContext.getSummary();
  logger.info("TC-SUMMARY", "EXECUÇÃO_COMPLETA", summary);
  testContext.reset();
});

describe("TESTES SMOKE - Autenticação e Cenários Negativos", () => {
  test("ST-001 – Deve falhar ao fazer requisição sem token", async () => {
    logger.info("ST-001", "REQUEST_START", { description: "Requisição sem token" });

    try {
      const start = Date.now();
      const response = await axios.get("https://api.spotify.com/v1/me", {
        headers: { Authorization: "" },
      });
      const responseTime = Date.now() - start;

      testContext.recordFail();
      logger.error("ST-001", "FAILED_EXPECTED_ERROR");
      throw new Error("A requisição deveria ter falhado");
    } catch (error) {
      if (error.message === "A requisição deveria ter falhado") {
        throw error;
      }

      testContext.recordPass();
      logger.error("ST-001", "ERROR_ESPERADO", {
        status: error.response?.status,
      });

      expect([400, 401]).toContain(error.response.status);
    }
  });

  test("ST-002 – Deve falhar com token inválido", async () => {
    logger.info("ST-002", "REQUEST_START", { description: "Token inválido" });

    try {
      const start = Date.now();
      const response = await axios.get("https://api.spotify.com/v1/me", {
        headers: { Authorization: "Bearer invalid_token_xyz" },
      });
      const responseTime = Date.now() - start;

      testContext.recordFail();
      logger.error("ST-002", "FAILED_EXPECTED_ERROR");
      throw new Error("A requisição deveria ter falhado");
    } catch (error) {
      if (error.message === "A requisição deveria ter falhado") {
        throw error;
      }

      testContext.recordPass();
      logger.error("ST-002", "ERROR_ESPERADO", {
        status: error.response?.status,
      });

      expect(error.response.status).toBe(401);
    }
  });

  test("ST-003 – Deve falhar com credenciais inválidas", async () => {
    logger.info("ST-003", "REQUEST_START", { description: "Credenciais inválidas" });

    try {
      const start = Date.now();
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        {
          grant_type: "client_credentials",
          client_id: "invalid_id",
          client_secret: "invalid_secret",
        },
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );
      const responseTime = Date.now() - start;

      testContext.recordFail();
      logger.error("ST-003", "FAILED_EXPECTED_ERROR");
      throw new Error("A requisição deveria ter falhado");
    } catch (error) {
      if (error.message === "A requisição deveria ter falhado") {
        throw error;
      }

      testContext.recordPass();
      logger.error("ST-003", "ERROR_ESPERADO", {
        status: error.response?.status,
      });

      expect([400, 401]).toContain(error.response.status);
    }
  });

  test("ST-004 – Deve retornar erro 400 para requisição malformada", async () => {
    logger.info("ST-004", "REQUEST_START", { description: "Requisição malformada" });

    try {
      await requestManager.get("/search", {
        params: { type: "artist" }, // Falta o parâmetro 'q'
      });

      testContext.recordFail();
      logger.error("ST-004", "FAILED_EXPECTED_ERROR");
      throw new Error("A requisição deveria ter falhado");
    } catch (error) {
      if (error.message === "A requisição deveria ter falhado") {
        throw error;
      }

      testContext.recordPass();
      logger.error("ST-004", "ERROR_ESPERADO", {
        status: error.response?.status,
      });

      expect(error.response.status).toBe(400);
    }
  });

  test("ST-005 – Deve retornar erro 404 para recurso não encontrado", async () => {
    logger.info("ST-005", "REQUEST_START", { description: "Recurso não encontrado" });

    try {
      await requestManager.get("/artists/invalid_artist_id_xyz");

      testContext.recordFail();
      logger.error("ST-005", "FAILED_EXPECTED_ERROR");
      throw new Error("A requisição deveria ter falhado");
    } catch (error) {
      if (error.message === "A requisição deveria ter falhado") {
        throw error;
      }

      testContext.recordPass();
      logger.error("ST-005", "ERROR_ESPERADO", {
        status: error.response?.status,
      });

      expect([400, 404]).toContain(error.response.status);
    }
  });

  test("ST-006 – Deve retornar erro 404 para endpoint inexistente", async () => {
    logger.info("ST-006", "REQUEST_START", { description: "Endpoint inexistente" });

    try {
      await requestManager.get("/nonexistent-endpoint");

      testContext.recordFail();
      logger.error("ST-006", "FAILED_EXPECTED_ERROR");
      throw new Error("A requisição deveria ter falhado");
    } catch (error) {
      if (error.message === "A requisição deveria ter falhado") {
        throw error;
      }

      testContext.recordPass();
      logger.error("ST-006", "ERROR_ESPERADO", {
        status: error.response?.status,
      });

      expect(error.response.status).toBe(404);
    }
  });

  test("ST-007 – Deve validar tipo de conteúdo da resposta", async () => {
    logger.info("ST-007", "REQUEST_START", { description: "Validar content-type" });

    try {
      const start = Date.now();
      const response = await requestManager.get("/search", {
        params: { q: "test", type: "artist", limit: 1 },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("ST-007", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("ST-007", "REQUEST_SUCCESS", {
        status: response.status,
        contentType: response.headers["content-type"],
      });

      expect(response.headers["content-type"]).toContain("application/json");
    } catch (error) {
      testContext.recordFail();
      logger.error("ST-007", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("ST-008 – Deve validar presença de propriedades obrigatórias", async () => {
    logger.info("ST-008", "REQUEST_START", { description: "Validar propriedades" });

    try {
      const start = Date.now();
      const response = await requestManager.get("/search", {
        params: { q: "test", type: "artist", limit: 1 },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("ST-008", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("ST-008", "REQUEST_SUCCESS", {
        status: response.status,
      });

      expect(response.data).toHaveProperty("artists");
      expect(response.data.artists).toHaveProperty("items");
      expect(Array.isArray(response.data.artists.items)).toBe(true);
    } catch (error) {
      testContext.recordFail();
      logger.error("ST-008", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("ST-009 – Deve validar tempo de resposta aceitável", async () => {
    logger.info("ST-009", "REQUEST_START", { description: "Validar tempo resposta" });

    try {
      const start = Date.now();
      const response = await requestManager.get("/search", {
        params: { q: "test", type: "artist", limit: 1 },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("ST-009", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("ST-009", "responseTime_ms", responseTime);
      logger.success("ST-009", "REQUEST_SUCCESS", {
        status: response.status,
        responseTime,
      });

      expect(responseTime).toBeLessThan(5000); // 5 segundos
    } catch (error) {
      testContext.recordFail();
      logger.error("ST-009", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("ST-010 – Deve lidar com limite máximo de resultados", async () => {
    logger.info("ST-010", "REQUEST_START", { description: "Limite máximo" });

    try {
      const start = Date.now();
      const response = await requestManager.get("/search", {
        params: { q: "test", type: "artist", limit: 50 },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("ST-010", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("ST-010", "REQUEST_SUCCESS", {
        status: response.status,
        resultsCount: response.data?.artists?.items?.length,
      });

      expect(response.data.artists.items.length).toBeLessThanOrEqual(50);
    } catch (error) {
      testContext.recordFail();
      logger.error("ST-010", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("ST-011 – Deve validar paginação com offset alto", async () => {
    logger.info("ST-011", "REQUEST_START", { description: "Offset alto" });

    try {
      const start = Date.now();
      //spotify permite offset até 100 por padrão.valores muito altos resultam em erro 400
      const response = await requestManager.get("/search", {
        params: { q: "test", type: "artist", limit: 10, offset: 100 },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("ST-011", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("ST-011", "REQUEST_SUCCESS", {
        status: response.status,
        offset: response.data?.artists?.offset,
      });

      expect(response.status).toBe(200);
      expect(response.data.artists.offset).toBe(100);
    } catch (error) {
      testContext.recordPass();
      logger.info("ST-011", "OFFSET_LIMIT_REACHED", {
        status: error.response?.status,
      });
      //spotify pode retornar 400 para offsets muito altos
      expect([200, 400]).toContain(error.response?.status);
    }
  });

  test("ST-012 – Deve validar caracteres especiais em query", async () => {
    logger.info("ST-012", "REQUEST_START", { description: "Caracteres especiais" });

    try {
      const start = Date.now();
      const response = await requestManager.get("/search", {
        params: { q: "café ñ é", type: "artist", limit: 10 },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("ST-012", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("ST-012", "REQUEST_SUCCESS", {
        status: response.status,
      });

      expect(response.status).toBe(200);
    } catch (error) {
      testContext.recordFail();
      logger.error("ST-012", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("ST-013 – Deve validar resposta com múltiplos tipos de busca", async () => {
    logger.info("ST-013", "REQUEST_START", { description: "Múltiplos tipos" });

    try {
      const start = Date.now();
      const response = await requestManager.get("/search", {
        params: { q: "test", type: "artist,track,album", limit: 5 },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("ST-013", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("ST-013", "REQUEST_SUCCESS", {
        status: response.status,
        hasArtists: !!response.data.artists,
        hasTracks: !!response.data.tracks,
        hasAlbums: !!response.data.albums,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("artists");
      expect(response.data).toHaveProperty("tracks");
      expect(response.data).toHaveProperty("albums");
    } catch (error) {
      testContext.recordFail();
      logger.error("ST-013", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("ST-014 – Deve validar estrutura de erro em resposta 400", async () => {
    logger.info("ST-014", "REQUEST_START", { description: "Estrutura de erro" });

    try {
      await requestManager.get("/search", {
        params: { q: "", type: "artist" },
      });

      testContext.recordFail();
      logger.error("ST-014", "FAILED_EXPECTED_ERROR");
      throw new Error("A requisição deveria ter falhado");
    } catch (error) {
      if (error.message === "A requisição deveria ter falhado") {
        throw error;
      }

      testContext.recordPass();
      logger.error("ST-014", "ERROR_ESPERADO", {
        status: error.response?.status,
      });

      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty("error");
    }
  });

  test("ST-015 – Deve validar status HTTP de sucesso", async () => {
    logger.info("ST-015", "REQUEST_START", { description: "Status HTTP 200" });

    try {
      const start = Date.now();
      const response = await requestManager.get("/search", {
        params: { q: "test", type: "artist", limit: 1 },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("ST-015", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("ST-015", "REQUEST_SUCCESS", {
        status: response.status,
      });

      expect([200, 201]).toContain(response.status);
    } catch (error) {
      testContext.recordFail();
      logger.error("ST-015", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("ST-016 – Deve validar campos nulos em resposta", async () => {
    logger.info("ST-016", "REQUEST_START", { description: "Campos nulos" });

    try {
      const start = Date.now();
      const response = await requestManager.get("/search", {
        params: { q: "test", type: "artist", limit: 1 },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("ST-016", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("ST-016", "REQUEST_SUCCESS", {
        status: response.status,
      });

      expect(response.data.artists).not.toBeNull();
      expect(response.data.artists.items).not.toBeNull();
    } catch (error) {
      testContext.recordFail();
      logger.error("ST-016", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("ST-017 – Deve validar tipos de dados em resposta", async () => {
    logger.info("ST-017", "REQUEST_START", { description: "Tipos de dados" });

    try {
      const start = Date.now();
      const response = await requestManager.get("/search", {
        params: { q: "test", type: "artist", limit: 1 },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("ST-017", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("ST-017", "REQUEST_SUCCESS", {
        status: response.status,
      });

      expect(typeof response.data).toBe("object");
      expect(Array.isArray(response.data.artists.items)).toBe(true);
      expect(typeof response.data.artists.limit).toBe("number");
      expect(typeof response.data.artists.offset).toBe("number");
    } catch (error) {
      testContext.recordFail();
      logger.error("ST-017", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("ST-018 – Deve validar URLs em resposta", async () => {
    logger.info("ST-018", "REQUEST_START", { description: "URLs em resposta" });

    try {
      const start = Date.now();
      const response = await requestManager.get("/search", {
        params: { q: "test", type: "artist", limit: 1 },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("ST-018", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("ST-018", "REQUEST_SUCCESS", {
        status: response.status,
      });

      const artist = response.data.artists.items[0];
      if (artist?.external_urls?.spotify) {
        expect(artist.external_urls.spotify).toMatch(/^https?:\/\//);
      }
      if (artist?.href) {
        expect(artist.href).toMatch(/^https?:\/\//);
      }
    } catch (error) {
      testContext.recordFail();
      logger.error("ST-018", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });
});
