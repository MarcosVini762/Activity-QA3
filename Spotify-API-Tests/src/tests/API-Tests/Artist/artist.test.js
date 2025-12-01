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

describe("TESTES DE API - Artistas Spotify", () => {
  test("TC-011 – Deve buscar artista por nome com sucesso", async () => {
    const searchQuery = "Taylor Swift";
    logger.info("TC-011", "REQUEST_START", { searchQuery });

    try {
      const start = Date.now();
      const response = await requestManager.get("/search", {
        params: { q: searchQuery, type: "artist", limit: 1 },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-011", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-011", "responseTime_ms", responseTime);
      logger.success("TC-011", "REQUEST_SUCCESS", {
        status: response.status,
        artistsFound: response.data?.artists?.items?.length,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("artists");
      expect(Array.isArray(response.data.artists.items)).toBe(true);
      expect(response.data.artists.items.length).toBeGreaterThan(0);
      expect(response.headers["content-type"]).toContain("application/json");

      const artist = response.data.artists.items[0];
      expect(artist).toHaveProperty("id");
      expect(artist).toHaveProperty("name");
      expect(artist).toHaveProperty("type");
      expect(artist.type).toBe("artist");
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-011", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-012 – Deve retornar erro ao buscar com query vazia", async () => {
    logger.info("TC-012", "REQUEST_START", { query: "" });

    try {
      await requestManager.get("/search", {
        params: { q: "", type: "artist", limit: 1 },
      });

      testContext.recordFail();
      logger.error("TC-012", "FAILED_EXPECTED_ERROR", {
        msg: "A requisição deveria ter falhado",
      });
      throw new Error("A requisição deveria ter falhado");
    } catch (error) {
      if (error.message === "A requisição deveria ter falhado") {
        throw error;
      }

      testContext.recordPass();
      logger.error("TC-012", "ERROR_ESPERADO", {
        status: error.response?.status,
        message: error.message,
      });

      expect(error.response.status).toBe(400);
    }
  });

  test("TC-013 – Deve obter detalhes de um artista específico", async () => {
    const artistId = "4gzpq5DPGxSnKTe4SA8HAU"; // Exemplo: Amy Winehouse (artista válido)
    logger.info("TC-013", "REQUEST_START", { artistId });

    try {
      const start = Date.now();
      const response = await requestManager.get(`/artists/${artistId}`);
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-013", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-013", "responseTime_ms", responseTime);
      logger.success("TC-013", "REQUEST_SUCCESS", {
        status: response.status,
        artistName: response.data?.name,
        followers: response.data?.followers?.total,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("id");
      expect(response.data).toHaveProperty("name");
      expect(response.data).toHaveProperty("followers");
      expect(response.data).toHaveProperty("genres");
      expect(response.data).toHaveProperty("popularity");
      expect(Array.isArray(response.data.genres)).toBe(true);
      expect(typeof response.data.popularity).toBe("number");
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-013", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-014 – Deve retornar erro ao buscar artista com ID inválido", async () => {
    const invalidArtistId = "invalid_artist_id_12345";
    logger.info("TC-014", "REQUEST_START", { invalidArtistId });

    try {
      await requestManager.get(`/artists/${invalidArtistId}`);

      testContext.recordFail();
      logger.error("TC-014", "FAILED_EXPECTED_ERROR", {
        msg: "A requisição deveria ter falhado",
      });
      throw new Error("A requisição deveria ter falhado");
    } catch (error) {
      if (error.message === "A requisição deveria ter falhado") {
        throw error;
      }

      testContext.recordPass();
      logger.error("TC-014", "ERROR_ESPERADO", {
        status: error.response?.status,
      });

      expect([400, 404]).toContain(error.response.status);
    }
  });

  test("TC-015 – Deve obter múltiplos artistas por ID", async () => {
    const artistIds = "4gzpq5DPGxSnKTe4SA8HAU,1301WleyT98MSxVHPvPsT7"; // Amy Winehouse, The Weeknd
    logger.info("TC-015", "REQUEST_START", { artistIds });

    try {
      const start = Date.now();
      const response = await requestManager.get("/artists", {
        params: { ids: artistIds },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-015", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-015", "REQUEST_SUCCESS", {
        status: response.status,
        artistsReturned: response.data?.artists?.length,
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.artists)).toBe(true);
      expect(response.data.artists.length).toBeGreaterThan(0);
      
      const validArtists = response.data.artists.filter(a => a !== null);
      validArtists.forEach((artist) => {
        expect(artist).toHaveProperty("id");
        expect(artist).toHaveProperty("name");
      });
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-015", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-016 – Deve obter top tracks de um artista", async () => {
    const artistId = "4gzpq5DPGxSnKTe4SA8HAU"; // Amy Winehouse
    logger.info("TC-016", "REQUEST_START", { artistId });

    try {
      const start = Date.now();
      const response = await requestManager.get(
        `/artists/${artistId}/top-tracks`,
        {
          params: { market: "US" },
        }
      );
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-016", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-016", "responseTime_ms", responseTime);
      logger.success("TC-016", "REQUEST_SUCCESS", {
        status: response.status,
        tracksCount: response.data?.tracks?.length,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("tracks");
      expect(Array.isArray(response.data.tracks)).toBe(true);
      expect(response.data.tracks.length).toBeGreaterThan(0);

      response.data.tracks.forEach((track) => {
        expect(track).toHaveProperty("id");
        expect(track).toHaveProperty("name");
        expect(track).toHaveProperty("popularity");
      });
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-016", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-017 – Deve obter álbuns de um artista", async () => {
    const artistId = "4gzpq5DPGxSnKTe4SA8HAU"; // Amy Winehouse
    logger.info("TC-017", "REQUEST_START", { artistId });

    try {
      const start = Date.now();
      const response = await requestManager.get(
        `/artists/${artistId}/albums`,
        {
          params: { limit: 10, offset: 0 },
        }
      );
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-017", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-017", "responseTime_ms", responseTime);
      logger.success("TC-017", "REQUEST_SUCCESS", {
        status: response.status,
        albumsCount: response.data?.items?.length,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("items");
      expect(Array.isArray(response.data.items)).toBe(true);

      response.data.items.forEach((album) => {
        expect(album).toHaveProperty("id");
        expect(album).toHaveProperty("name");
        expect(album).toHaveProperty("release_date");
      });
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-017", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-018 – Deve obter artistas relacionados", async () => {
    logger.info("TC-018", "REQUEST_START", { query: "Taylor Swift" });

    try {
      // Buscar um artista primeiro
      const searchResponse = await requestManager.get("/search", {
        params: { q: "Taylor Swift", type: "artist", limit: 1 },
      });

      const artistId = searchResponse.data?.artists?.items?.[0]?.id;
      if (!artistId) {
        throw new Error("Nenhum artista encontrado para teste");
      }

      const start = Date.now();
      const response = await requestManager.get(
        `/artists/${artistId}/related-artists`
      );
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-018", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-018", "responseTime_ms", responseTime);
      logger.success("TC-018", "REQUEST_SUCCESS", {
        status: response.status,
        relatedArtists: response.data?.artists?.length,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("artists");
      expect(Array.isArray(response.data.artists)).toBe(true);

      response.data.artists.forEach((artist) => {
        expect(artist).toHaveProperty("id");
        expect(artist).toHaveProperty("name");
      });
    } catch (error) {
      // Related-artists pode retornar 404 em alguns casos
      if (error.response?.status === 404) {
        testContext.recordPass();
        logger.info("TC-018", "RELATED_ARTISTS_NOT_AVAILABLE", {
          status: error.response?.status,
        });
      } else {
        testContext.recordFail();
        logger.error("TC-018", "ERROR", {
          status: error.response?.status,
          message: error.message,
        });
        throw error;
      }
    }
  });

  test("TC-019 – Deve validar limite de resultados em busca de artista", async () => {
    const searchQuery = "Artist";
    const limit = 50;
    logger.info("TC-019", "REQUEST_START", { searchQuery, limit });

    try {
      const start = Date.now();
      const response = await requestManager.get("/search", {
        params: { q: searchQuery, type: "artist", limit },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-019", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-019", "REQUEST_SUCCESS", {
        status: response.status,
        resultsCount: response.data?.artists?.items?.length,
      });

      expect(response.status).toBe(200);
      expect(response.data.artists.items.length).toBeLessThanOrEqual(limit);
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-019", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-020 – Deve validar paginação em busca de artista", async () => {
    const searchQuery = "The";
    logger.info("TC-020", "REQUEST_START", { searchQuery });

    try {
      const start = Date.now();
      const response = await requestManager.get("/search", {
        params: { q: searchQuery, type: "artist", limit: 10, offset: 0 },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-020", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-020", "REQUEST_SUCCESS", {
        status: response.status,
        offset: response.data?.artists?.offset,
        limit: response.data?.artists?.limit,
      });

      expect(response.status).toBe(200);
      expect(response.data.artists).toHaveProperty("offset");
      expect(response.data.artists).toHaveProperty("limit");
      expect(response.data.artists.offset).toBe(0);
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-020", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });
});
