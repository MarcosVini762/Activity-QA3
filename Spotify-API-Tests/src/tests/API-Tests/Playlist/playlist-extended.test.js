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

describe("TESTES DE API - Playlists Expandidas", () => {
  test("TC-031 – Deve buscar playlists por nome", async () => {
    const query = "workout";
    logger.info("TC-031", "REQUEST_START", { query });

    try {
      const start = Date.now();
      const response = await requestManager.get("/search", {
        params: { q: query, type: "playlist", limit: 10 },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-031", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-031", "responseTime_ms", responseTime);
      logger.success("TC-031", "REQUEST_SUCCESS", {
        status: response.status,
        playlistsFound: response.data?.playlists?.items?.length,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("playlists");
      expect(response.data.playlists).not.toBeNull();
      expect(Array.isArray(response.data.playlists.items)).toBe(true);
      
      const items = response.data.playlists.items.filter(item => item !== null);
      expect(items.length).toBeGreaterThan(0);

      items.forEach((playlist) => {
        if (playlist) {
          expect(playlist).toHaveProperty("id");
          expect(playlist).toHaveProperty("name");
          expect(playlist).toHaveProperty("type");
        }
      });
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-031", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-032 – Deve obter informações de uma playlist específica", async () => {
    logger.info("TC-032", "REQUEST_START", { query: "popular" });

    try {
      // Primeiro, buscar uma playlist
      const searchResponse = await requestManager.get("/search", {
        params: { q: "popular", type: "playlist", limit: 1 },
      });

      const playlistId = searchResponse.data?.playlists?.items?.[0]?.id;
      if (!playlistId) {
        throw new Error("Nenhuma playlist encontrada para teste");
      }

      const start = Date.now();
      const response = await requestManager.get(`/playlists/${playlistId}`);
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-032", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-032", "responseTime_ms", responseTime);
      logger.success("TC-032", "REQUEST_SUCCESS", {
        status: response.status,
        playlistName: response.data?.name,
        followers: response.data?.followers?.total,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("id");
      expect(response.data).toHaveProperty("name");
      expect(response.data).toHaveProperty("owner");
      expect(response.data).toHaveProperty("public");
      expect(response.data).toHaveProperty("followers");
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-032", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-033 – Deve obter faixas de uma playlist com paginação", async () => {
    logger.info("TC-033", "REQUEST_START", { query: "music" });

    try {
      // Buscar uma playlist para obter um ID válido
      const searchResponse = await requestManager.get("/search", {
        params: { q: "music", type: "playlist", limit: 5 },
      });

      const playlists = searchResponse.data?.playlists?.items?.filter(p => p && p.id);
      const playlistId = playlists?.[0]?.id;
      if (!playlistId) {
        testContext.recordPass();
        logger.info("TC-033", "NO_PLAYLISTS_FOUND", {});
        return;
      }

      const start = Date.now();
      const response = await requestManager.get(
        `/playlists/${playlistId}/tracks`,
        {
          params: { limit: 20, offset: 0 },
        }
      );
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-033", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-033", "responseTime_ms", responseTime);
      logger.success("TC-033", "REQUEST_SUCCESS", {
        status: response.status,
        tracksCount: response.data?.items?.length,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("items");
      expect(Array.isArray(response.data.items)).toBe(true);
      expect(response.data).toHaveProperty("limit");
      expect(response.data).toHaveProperty("offset");
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-033", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-034 – Deve validar paginação com diferentes offsets", async () => {
    logger.info("TC-034", "REQUEST_START", { query: "rock" });

    try {
      // Buscar uma playlist
      const searchResponse = await requestManager.get("/search", {
        params: { q: "rock", type: "playlist", limit: 1 },
      });

      const playlistId = searchResponse.data?.playlists?.items?.[0]?.id;
      if (!playlistId) {
        throw new Error("Nenhuma playlist encontrada para teste");
      }

      const offsets = [0, 10, 20];
      const metricsPerOffset = {};
      
      for (const offset of offsets) {
        const start = Date.now();
        const response = await requestManager.get(
          `/playlists/${playlistId}/tracks`,
          {
            params: { limit: 10, offset },
          }
        );
        const responseTime = Date.now() - start;
        metricsPerOffset[offset] = responseTime;

        expect(response.status).toBe(200);
        expect(response.data.offset).toBe(offset);
      }

      const avgTime = Math.round(Object.values(metricsPerOffset).reduce((a, b) => a + b) / metricsPerOffset.length);
      testContext.recordMetric("TC-034", "responseTime_ms", avgTime);
      testContext.recordPass();

      logger.success("TC-034", "REQUEST_SUCCESS", {
        status: 200,
        offsetsValidated: offsets,
      });
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-034", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-035 – Deve validar imagens de playlist", async () => {
    logger.info("TC-035", "REQUEST_START", { query: "playlist" });

    try {
      // Buscar uma playlist
      const searchResponse = await requestManager.get("/search", {
        params: { q: "playlist", type: "playlist", limit: 5 },
      });

      const playlists = searchResponse.data?.playlists?.items?.filter(p => p && p.id);
      const playlistId = playlists?.[0]?.id;
      if (!playlistId) {
        testContext.recordPass();
        logger.info("TC-035", "NO_PLAYLISTS_FOUND", {});
        return;
      }

      const start = Date.now();
      const response = await requestManager.get(`/playlists/${playlistId}`);
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-035", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-035", "REQUEST_SUCCESS", {
        status: response.status,
        imagesCount: response.data?.images?.length,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("images");
      expect(Array.isArray(response.data.images)).toBe(true);
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-035", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-036 – Deve validar informações do proprietário da playlist", async () => {
    logger.info("TC-036", "REQUEST_START", { query: "hip-hop" });

    try {
      // Buscar uma playlist
      const searchResponse = await requestManager.get("/search", {
        params: { q: "hip-hop", type: "playlist", limit: 1 },
      });

      const playlistId = searchResponse.data?.playlists?.items?.[0]?.id;
      if (!playlistId) {
        throw new Error("Nenhuma playlist encontrada para teste");
      }

      const start = Date.now();
      const response = await requestManager.get(`/playlists/${playlistId}`);
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-036", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-036", "REQUEST_SUCCESS", {
        status: response.status,
        ownerName: response.data?.owner?.display_name,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("owner");
      expect(response.data.owner).toHaveProperty("id");
      expect(response.data.owner).toHaveProperty("display_name");
      expect(response.data.owner).toHaveProperty("type");
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-036", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-037 – Deve validar campos opcionais de playlist", async () => {
    logger.info("TC-037", "REQUEST_START", { query: "edm" });

    try {
      // Buscar uma playlist
      const searchResponse = await requestManager.get("/search", {
        params: { q: "edm", type: "playlist", limit: 1 },
      });

      const playlistId = searchResponse.data?.playlists?.items?.[0]?.id;
      if (!playlistId) {
        throw new Error("Nenhuma playlist encontrada para teste");
      }

      const start = Date.now();
      const response = await requestManager.get(`/playlists/${playlistId}`);
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-037", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-037", "REQUEST_SUCCESS", {
        status: response.status,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("name");
      expect(response.data).toHaveProperty("external_urls");
      expect(response.data).toHaveProperty("followers");
      expect(response.data).toHaveProperty("tracks");
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-037", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-038 – Deve validar limite de faixas em playlist", async () => {
    logger.info("TC-038", "REQUEST_START", { query: "tracks", limit: 50 });

    try {
      // Buscar uma playlist
      const searchResponse = await requestManager.get("/search", {
        params: { q: "tracks", type: "playlist", limit: 5 },
      });

      const playlists = searchResponse.data?.playlists?.items?.filter(p => p && p.id);
      const playlistId = playlists?.[0]?.id;
      if (!playlistId) {
        testContext.recordPass();
        logger.info("TC-038", "NO_PLAYLISTS_FOUND", {});
        return;
      }

      const limit = 50;
      const start = Date.now();
      const response = await requestManager.get(
        `/playlists/${playlistId}/tracks`,
        {
          params: { limit },
        }
      );
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-038", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-038", "REQUEST_SUCCESS", {
        status: response.status,
        itemsReturned: response.data?.items?.length,
      });

      expect(response.status).toBe(200);
      expect(response.data.items.length).toBeLessThanOrEqual(limit);
      expect(response.data.limit).toBe(limit);
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-038", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-039 – Deve retornar erro ao buscar playlist inválida", async () => {
    const invalidPlaylistId = "invalid_playlist_id_xyz";
    logger.info("TC-039", "REQUEST_START", { invalidPlaylistId });

    try {
      await requestManager.get(`/playlists/${invalidPlaylistId}`);

      testContext.recordFail();
      logger.error("TC-039", "FAILED_EXPECTED_ERROR");
      throw new Error("A requisição deveria ter falhado");
    } catch (error) {
      if (error.message === "A requisição deveria ter falhado") {
        throw error;
      }

      testContext.recordPass();
      logger.error("TC-039", "ERROR_ESPERADO", {
        status: error.response?.status,
      });

      expect([400, 404]).toContain(error.response.status);
    }
  });

  test("TC-040 – Deve validar estrutura de resposta de playlist com campos aninhados", async () => {
    logger.info("TC-040", "REQUEST_START", { query: "reggae" });

    try {
      // Buscar uma playlist
      const searchResponse = await requestManager.get("/search", {
        params: { q: "reggae", type: "playlist", limit: 1 },
      });

      const playlistId = searchResponse.data?.playlists?.items?.[0]?.id;
      if (!playlistId) {
        throw new Error("Nenhuma playlist encontrada para teste");
      }

      const start = Date.now();
      const response = await requestManager.get(`/playlists/${playlistId}`);
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-040", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-040", "REQUEST_SUCCESS", {
        status: response.status,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("owner");
      expect(response.data.owner).toHaveProperty("external_urls");
      expect(response.data).toHaveProperty("tracks");
      expect(response.data.tracks).toHaveProperty("href");
      expect(response.data.tracks).toHaveProperty("total");
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-040", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });
});
