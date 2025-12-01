const requestManager = require("../../requestManager");
const { getSpotifyToken } = require("../../../utils/spotify_auth");
const logger = require("../../../utils/logger");
const testContext = require("../../../utils/testContext");

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

describe("TESTES DE API - Faixas (Tracks) Spotify", () => {
  test("TC-021 – Deve obter informações de uma faixa específica", async () => {
    const trackId = "3n3Ppam7vgaVa1iaRUc9Lp"; // Blinding Lights (artista: The Weeknd)
    logger.info("TC-021", "REQUEST_START", { trackId });

    try {
      const start = Date.now();
      const response = await requestManager.get(`/tracks/${trackId}`);
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-021", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-021", "responseTime_ms", responseTime);
      logger.success("TC-021", "REQUEST_SUCCESS", {
        status: response.status,
        trackName: response.data?.name,
        duration: response.data?.duration_ms,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("id");
      expect(response.data).toHaveProperty("name");
      expect(response.data).toHaveProperty("duration_ms");
      expect(response.data).toHaveProperty("popularity");
      expect(response.data).toHaveProperty("explicit");
      expect(typeof response.data.duration_ms).toBe("number");
      expect(response.data.duration_ms).toBeGreaterThan(0);
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-021", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-022 – Deve buscar faixas por nome", async () => {
    const query = "Blinding Lights";
    logger.info("TC-022", "REQUEST_START", { query });

    try {
      const start = Date.now();
      const response = await requestManager.get("/search", {
        params: { q: query, type: "track", limit: 10 },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-022", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-022", "responseTime_ms", responseTime);
      logger.success("TC-022", "REQUEST_SUCCESS", {
        status: response.status,
        tracksFound: response.data?.tracks?.items?.length,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("tracks");
      expect(Array.isArray(response.data.tracks.items)).toBe(true);
      expect(response.data.tracks.items.length).toBeGreaterThan(0);

      response.data.tracks.items.forEach((track) => {
        expect(track).toHaveProperty("id");
        expect(track).toHaveProperty("name");
        expect(track).toHaveProperty("artists");
        expect(Array.isArray(track.artists)).toBe(true);
      });
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-022", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-023 – Deve obter múltiplas faixas por ID", async () => {
    const trackIds = "3n3Ppam7vgaVa1iaRUc9Lp,2takcwffpFHUVo6b8tPYDy"; // Blinding Lights, Africa
    logger.info("TC-023", "REQUEST_START", { trackIds });

    try {
      const start = Date.now();
      const response = await requestManager.get("/tracks", {
        params: { ids: trackIds },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-023", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-023", "responseTime_ms", responseTime);
      logger.success("TC-023", "REQUEST_SUCCESS", {
        status: response.status,
        tracksReturned: response.data?.tracks?.length,
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.tracks)).toBe(true);
      expect(response.data.tracks.length).toBeGreaterThan(0);

      const validTracks = response.data.tracks.filter(t => t !== null);
      validTracks.forEach((track) => {
        expect(track).toHaveProperty("id");
        expect(track).toHaveProperty("name");
        expect(track).toHaveProperty("duration_ms");
      });
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-023", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-024 – Deve retornar erro ao buscar com query vazia", async () => {
    logger.info("TC-024", "REQUEST_START", { query: "" });

    try {
      await requestManager.get("/search", {
        params: { q: "", type: "track", limit: 10 },
      });

      testContext.recordFail();
      logger.error("TC-024", "FAILED_EXPECTED_ERROR");
      throw new Error("A requisição deveria ter falhado");
    } catch (error) {
      if (error.message === "A requisição deveria ter falhado") {
        throw error;
      }

      testContext.recordPass();
      logger.error("TC-024", "ERROR_ESPERADO", {
        status: error.response?.status,
      });

      expect(error.response.status).toBe(400);
    }
  });

  test("TC-025 – Deve validar resposta quando audio-features é restrito", async () => {
    const trackId = "3n3Ppam7vgaVa1iaRUc9Lp"; // Blinding Lights
    logger.info("TC-025", "REQUEST_START", { trackId });

    try {
      const start = Date.now();
      const response = await requestManager.get(
        `/audio-features/${trackId}`
      );
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-025", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-025", "responseTime_ms", responseTime);
      logger.success("TC-025", "REQUEST_SUCCESS", {
        status: response.status,
      });

      expect(response.status).toBe(200);
    } catch (error) {
      //audio-features pode retornar 403 dependendo de permissões
      testContext.recordPass();
      logger.info("TC-025", "AUDIO_FEATURES_RESTRICTED", {
        status: error.response?.status,
      });
      
      expect([200, 403]).toContain(error.response?.status);
    }
  });

  test("TC-026 – Deve validar resposta quando audio-analysis é restrito", async () => {
    const trackId = "3n3Ppam7vgaVa1iaRUc9Lp";
    logger.info("TC-026", "REQUEST_START", { trackId });

    try {
      const start = Date.now();
      const response = await requestManager.get(
        `/audio-analysis/${trackId}`
      );
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-026", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-026", "responseTime_ms", responseTime);
      logger.success("TC-026", "REQUEST_SUCCESS", {
        status: response.status,
      });

      expect(response.status).toBe(200);
    } catch (error) {
      // audio-analysis pode retornar 403 dependendo de permissões
      testContext.recordPass();
      logger.info("TC-026", "AUDIO_ANALYSIS_RESTRICTED", {
        status: error.response?.status,
      });
      
      expect([200, 403]).toContain(error.response?.status);
    }
  });

  test("TC-027 – Deve validar bulk audio-features quando restrito", async () => {
    const trackIds = "3n3Ppam7vgaVa1iaRUc9Lp,2takcwffpFHUVo6b8tPYDy";
    logger.info("TC-027", "REQUEST_START", { trackIds });

    try {
      const start = Date.now();
      const response = await requestManager.get(
        `/audio-features`,
        {
          params: { ids: trackIds },
        }
      );
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-027", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-027", "responseTime_ms", responseTime);
      logger.success("TC-027", "REQUEST_SUCCESS", {
        status: response.status,
      });

      expect(response.status).toBe(200);
    } catch (error) {
      // bulk audio-features pode retornar 403 dependendo de permissões
      testContext.recordPass();
      logger.info("TC-027", "BULK_AUDIO_RESTRICTED", {
        status: error.response?.status,
      });
      
      expect([200, 403]).toContain(error.response?.status);
    }
  });

  test("TC-028 – Deve validar propriedades de faixa com mercado específico", async () => {
    const trackId = "3n3Ppam7vgaVa1iaRUc9Lp"; // Blinding Lights
    const market = "BR";
    logger.info("TC-028", "REQUEST_START", { trackId, market });

    try {
      const start = Date.now();
      const response = await requestManager.get(`/tracks/${trackId}`, {
        params: { market },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-028", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-028", "responseTime_ms", responseTime);
      logger.success("TC-028", "REQUEST_SUCCESS", {
        status: response.status,
        trackName: response.data?.name,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("is_playable");
      expect(typeof response.data.is_playable).toBe("boolean");
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-028", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-029 – Deve validar limite de faixas em busca", async () => {
    const query = "love";
    const limit = 50;
    logger.info("TC-029", "REQUEST_START", { query, limit });

    try {
      const start = Date.now();
      const response = await requestManager.get("/search", {
        params: { q: query, type: "track", limit },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-029", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-029", "REQUEST_SUCCESS", {
        status: response.status,
        resultsCount: response.data?.tracks?.items?.length,
      });

      expect(response.status).toBe(200);
      expect(response.data.tracks.items.length).toBeLessThanOrEqual(limit);
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-029", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-030 – Deve validar paginação em busca de faixas", async () => {
    const query = "the";
    logger.info("TC-030", "REQUEST_START", { query });

    try {
      const start = Date.now();
      const response = await requestManager.get("/search", {
        params: { q: query, type: "track", limit: 20, offset: 0 },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-030", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-030", "REQUEST_SUCCESS", {
        status: response.status,
        offset: response.data?.tracks?.offset,
        limit: response.data?.tracks?.limit,
      });

      expect(response.status).toBe(200);
      expect(response.data.tracks).toHaveProperty("offset");
      expect(response.data.tracks).toHaveProperty("limit");
      expect(response.data.tracks.offset).toBe(0);
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-030", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });
});
