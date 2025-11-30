const logger = require("../../../utils/logger");
const { getSpotifyToken } = require("../../../utils/spotify_auth");
const requestManager = require("../../requestManager");
const testContext = require("../../../utils/testContext");

// Função auxiliar para medir tempo de resposta
const measureResponseTime = async (fn) => {
  const start = Date.now();
  try {
    const response = await fn();
    return { response, responseTime: Date.now() - start, error: null };
  } catch (error) {
    return { response: null, responseTime: Date.now() - start, error };
  }
};

describe("Spotify API Tests - Public Endpoints (Refatorado)", () => {
  beforeAll(async () => {
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
    logger.info("TC-SETUP", "TOKEN_OBTIDO");
  });

  afterAll(() => {
    const summary = testContext.getSummary();
    logger.info("TC-SUMMARY", "EXECUÇÃO_COMPLETA", summary);
    testContext.reset();
  });

  const getHeaders = () => ({
    Authorization: `Bearer ${testContext.token}`,
    "Content-Type": "application/json",
  });

  // TC-001 — Buscar Artistas

  describe("TC-001: Buscar artistas", () => {
    let response, responseTime, testError;

    beforeAll(async () => {
      const artistData = testContext.getTestData("artists");
      const { searchQuery, type, limit } = artistData;

      const result = await measureResponseTime(() =>
        requestManager.get(`/search`, {
          headers: getHeaders(),
          params: { q: searchQuery, type, limit },
        })
      );

      response = result.response;
      responseTime = result.responseTime;
      testError = result.error;

      if (!testError) {
        testContext.recordMetric("TC-001", "responseTime_ms", responseTime);
        testContext.recordPass();
      } else {
        testContext.recordFail();
      }
    });

    test("Status 200", () => {
      if (testError) return;
      expect(response.status).toBe(200);
    });

    test("Response time < 1500ms", () => {
      if (testError) return;
      expect(responseTime).toBeLessThan(
        testContext.validations.maxResponseTime
      );
    });

    test("Content-Type JSON", () => {
      if (testError) return;
      expect(response.headers["content-type"]).toContain(
        testContext.validations.contentTypeJson
      );
    });

    test("Estrutura da resposta", () => {
      if (testError) return;

      const { artists } = response.data;

      expect(artists).toHaveProperty("items");
      expect(Array.isArray(artists.items)).toBe(true);
    });

    test("Estrutura do artista", () => {
      if (testError) return;

      const items = response.data.artists.items;
      if (items.length === 0) return;

      const artist = items[0];

      expect(artist).toHaveProperty("id");
      expect(artist).toHaveProperty("name");
      expect(artist.type).toBe("artist");
      expect(typeof artist.name).toBe("string");
    });
  });

  // TC-002 — Obter Álbuns do Artista

  describe("TC-002: Obter álbuns do artista", () => {
    let response, responseTime, testError;

    beforeAll(async () => {
      try {
        const searchRes = await requestManager.get(`/search`, {
          headers: getHeaders(),
          params: { q: "Coldplay", type: "artist", limit: 1 },
        });

        const artistId = searchRes.data.artists.items[0].id;

        logger.info("TC-002", "ARTISTA_ENCONTRADO", { artistId });

        const result = await measureResponseTime(() =>
          requestManager.get(`/artists/${artistId}/albums`, {
            headers: getHeaders(),
            params: { limit: 5, offset: 0 },
          })
        );

        response = result.response;
        responseTime = result.responseTime;
        testError = result.error;

        if (!testError) {
          testContext.recordMetric("TC-002", "responseTime_ms", responseTime);
          testContext.recordPass();
        } else {
          testContext.recordFail();
        }
      } catch (err) {
        testError = err;
        testContext.recordFail();
        logger.error("TC-002", "ERRO_FATAL", { message: err.message });
      }
    });

    test("Status 200", () => {
      if (testError) return;
      expect(response.status).toBe(200);
    });

    test("Response time < 1500ms", () => {
      if (testError) return;
      expect(responseTime).toBeLessThan(
        testContext.validations.maxResponseTime
      );
    });

    test("Content-Type JSON", () => {
      if (testError) return;
      expect(response.headers["content-type"]).toContain(
        testContext.validations.contentTypeJson
      );
    });

    test("Estrutura da resposta", () => {
      if (testError) return;
      expect(Array.isArray(response.data.items)).toBe(true);
    });

    test("Estrutura do álbum", () => {
      if (testError) return;

      const items = response.data.items;
      if (items.length === 0) return;

      const album = items[0];

      expect(album).toHaveProperty("id");
      expect(album).toHaveProperty("name");
      expect(album).toHaveProperty("release_date");
      expect(album).toHaveProperty("total_tracks");
    });
  });

  // TC-003 — Buscar Faixas
  describe("TC-003: Buscar faixas", () => {
    let response, responseTime, testError;

    beforeAll(async () => {
      const result = await measureResponseTime(() =>
        requestManager.get(`/search`, {
          headers: getHeaders(),
          params: { q: "shape of you", type: "track", limit: 3 },
        })
      );

      response = result.response;
      responseTime = result.responseTime;
      testError = result.error;

      if (!testError) {
        testContext.recordMetric("TC-003", "responseTime_ms", responseTime);
        testContext.recordPass();
      } else {
        testContext.recordFail();
      }
    });

    test("Status 200", () => {
      if (testError) return;
      expect(response.status).toBe(200);
    });

    test("Response time < 1500ms", () => {
      if (testError) return;
      expect(responseTime).toBeLessThan(
        testContext.validations.maxResponseTime
      );
    });

    test("Content-Type JSON", () => {
      if (testError) return;
      expect(response.headers["content-type"]).toContain(
        testContext.validations.contentTypeJson
      );
    });

    test("Estrutura da resposta", () => {
      if (testError) return;

      expect(response.data.tracks).toHaveProperty("items");
      expect(Array.isArray(response.data.tracks.items)).toBe(true);
    });

    test("Estrutura da faixa", () => {
      if (testError) return;

      const items = response.data.tracks.items;
      if (items.length === 0) return;

      const track = items[0];

      expect(track).toHaveProperty("id");
      expect(track).toHaveProperty("name");
      expect(track).toHaveProperty("duration_ms");
      expect(track).toHaveProperty("artists");
    });
  });

  // TC-004 — Detalhes do Álbum
  describe("TC-004: Obter informações do álbum", () => {
    let response, responseTime, testError;

    beforeAll(async () => {
      try {
        logger.info("TC-004", "BUSCAR_ALBUM", { query: "album:thriller" });

        const searchRes = await requestManager.get(`/search`, {
          headers: getHeaders(),
          params: { q: "album:thriller", type: "album", limit: 1 },
        });

        const albumId = searchRes.data.albums.items[0].id;

        logger.info("TC-004", "ALBUM_ENCONTRADO", { albumId });

        const result = await measureResponseTime(() =>
          requestManager.get(`/albums/${albumId}`, {
            headers: getHeaders(),
          })
        );

        response = result.response;
        responseTime = result.responseTime;
        testError = result.error;

        if (!testError) {
          testContext.recordMetric("TC-004", "responseTime_ms", responseTime);
          testContext.recordPass();
        } else {
          testContext.recordFail();
        }
      } catch (err) {
        testError = err;
        testContext.recordFail();
        logger.error("TC-004", "ERRO_FATAL", { message: err.message });
      }
    });

    test("Status 200", () => {
      if (testError) return;
      expect(response.status).toBe(200);
    });

    test("Response time < 1000ms", () => {
      if (testError) return;
      expect(responseTime).toBeLessThan(1000);
    });

    test("Content-Type JSON", () => {
      if (testError) return;
      expect(response.headers["content-type"]).toContain(
        testContext.validations.contentTypeJson
      );
    });

    test("Estrutura completa", () => {
      if (testError) return;

      const d = response.data;

      expect(d).toHaveProperty("id");
      expect(d).toHaveProperty("name");
      expect(d).toHaveProperty("artists");
      expect(d).toHaveProperty("tracks");
      expect(d).toHaveProperty("release_date");
      expect(d).toHaveProperty("total_tracks");
    });

    test("Validação de tracks", () => {
      if (testError) return;

      const tracks = response.data.tracks;

      expect(tracks).toHaveProperty("items");
      expect(Array.isArray(tracks.items)).toBe(true);

      if (tracks.items.length > 0) {
        const t = tracks.items[0];
        expect(t).toHaveProperty("id");
        expect(t).toHaveProperty("name");
        expect(t).toHaveProperty("duration_ms");
      }
    });
  });
});
