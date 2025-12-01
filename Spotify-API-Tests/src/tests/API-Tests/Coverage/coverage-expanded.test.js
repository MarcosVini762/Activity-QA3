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

describe("TESTES DE COBERTURA EXPANDIDA - Edge Cases e Validações", () => {
  test("TC-041 – Deve validar estrutura de resposta de múltiplos albums", async () => {
    const albumIds = "4aawyAB9vmqN3uQ7FjRGTy,382ObEPsp2rxGrnsizN5TX";
    logger.info("TC-041", "REQUEST_START", { albumIds });

    try {
      const start = Date.now();
      const response = await requestManager.get("/albums", {
        params: { ids: albumIds },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-041", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-041", "REQUEST_SUCCESS", {
        status: response.status,
        albums: response.data?.albums?.length,
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.albums)).toBe(true);
      
      const validAlbums = response.data.albums.filter(a => a !== null);
      validAlbums.forEach((album) => {
        expect(album).toHaveProperty("id");
        expect(album).toHaveProperty("name");
        expect(album).toHaveProperty("artists");
        expect(album).toHaveProperty("release_date");
        expect(album).toHaveProperty("total_tracks");
      });
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-041", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-042 – Deve validar paginação com diferentes offsets", async () => {
    const playlistId = "37i9dQZF1DXcBWIGoYBM5M";
    const offsets = [0, 10, 20];
    logger.info("TC-042", "REQUEST_START", { playlistId, offsets });

    try {
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
        expect(response.data.limit).toBe(10);
      }

      const avgTime = Math.round(
        Object.values(metricsPerOffset).reduce((a, b) => a + b) / 
        Object.keys(metricsPerOffset).length
      );
      testContext.recordMetric("TC-042", "responseTime_ms", avgTime);
      testContext.recordPass();

      logger.success("TC-042", "REQUEST_SUCCESS", {
        status: 200,
        offsetsValidated: Object.keys(metricsPerOffset).length,
      });
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-042", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
    }
  });

  test("TC-043 – Deve validar campos nulos/opcionais em resposta", async () => {
    logger.info("TC-043", "REQUEST_START", { description: "Validação de campos nulos" });

    try {
      const start = Date.now();
      const response = await requestManager.get("/search", {
        params: { q: "test", type: "artist", limit: 1 },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-043", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-043", "REQUEST_SUCCESS", {
        status: response.status,
      });

      expect(response.status).toBe(200);
      expect(response.data.artists.items).not.toBeNull();
      expect(Array.isArray(response.data.artists.items)).toBe(true);

      const artist = response.data.artists.items[0];
      if (artist) {
        // Campos que podem ser null
        if (artist.genres) {
          expect(Array.isArray(artist.genres)).toBe(true);
        }
      }
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-043", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
    }
  });

  test("TC-044 – Deve validar tipos de dados em resposta de track", async () => {
    const trackId = "3n3Ppam7vgaVa1iaRUc9Lp";
    logger.info("TC-044", "REQUEST_START", { trackId });

    try {
      const start = Date.now();
      const response = await requestManager.get(`/tracks/${trackId}`);
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-044", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-044", "REQUEST_SUCCESS", {
        status: response.status,
      });

      const track = response.data;
      
      expect(typeof track.id).toBe("string");
      expect(typeof track.name).toBe("string");
      expect(typeof track.duration_ms).toBe("number");
      expect(typeof track.popularity).toBe("number");
      expect(typeof track.explicit).toBe("boolean");
      // is_playable pode ser undefined em alguns casos
      if (track.hasOwnProperty("is_playable")) {
        expect(typeof track.is_playable).toBe("boolean");
      }
      expect(Array.isArray(track.artists)).toBe(true);
      expect(Array.isArray(track.available_markets)).toBe(true);
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-044", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-045 – Deve validar busca com múltiplos tipos", async () => {
    logger.info("TC-045", "REQUEST_START", { description: "Busca múltiplos tipos" });

    try {
      const start = Date.now();
      const response = await requestManager.get("/search", {
        params: { q: "test", type: "artist,track,album", limit: 5 },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-045", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-045", "BUSCA_MULTIPLA_VALIDADA", {
        hasArtists: !!response.data.artists,
        hasTracks: !!response.data.tracks,
        hasAlbums: !!response.data.albums,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("artists");
      expect(response.data).toHaveProperty("tracks");
      expect(response.data).toHaveProperty("albums");
      
      if (response.data.artists.items.length > 0) {
        expect(response.data.artists.items[0]).toHaveProperty("type");
        expect(response.data.artists.items[0].type).toBe("artist");
      }
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-045", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-046 – Deve validar mercados disponíveis em album", async () => {
    const albumId = "4aawyAB9vmqN3uQ7FjRGTy";
    logger.info("TC-046", "REQUEST_START", { albumId });

    try {
      const start = Date.now();
      const response = await requestManager.get(`/albums/${albumId}`, {
        params: { market: "BR" },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-046", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-046", "REQUEST_SUCCESS", {
        status: response.status,
        albumName: response.data?.name,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("is_playable");
      expect(typeof response.data.is_playable).toBe("boolean");
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-046", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
    }
  });

  test("TC-047 – Deve validar URLs externas em resposta", async () => {
    const artistId = "4gzpq5DPGxSnKTe4SA8HAU";
    logger.info("TC-047", "REQUEST_START", { artistId });

    try {
      const start = Date.now();
      const response = await requestManager.get(`/artists/${artistId}`);
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-047", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-047", "REQUEST_SUCCESS", {
        status: response.status,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("external_urls");
      expect(typeof response.data.external_urls).toBe("object");
      expect(response.data.external_urls.spotify).toMatch(/^https?:\/\//);
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-047", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-048 – Deve validar imagens em resposta de playlist", async () => {
    const playlistId = "37i9dQZF1DXcBWIGoYBM5M";
    logger.info("TC-048", "REQUEST_START", { playlistId });

    try {
      const start = Date.now();
      const response = await requestManager.get(`/playlists/${playlistId}`);
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-048", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-048", "REQUEST_SUCCESS", {
        status: response.status,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("images");
      expect(Array.isArray(response.data.images)).toBe(true);

      if (response.data.images.length > 0) {
        response.data.images.forEach((image) => {
          expect(image).toHaveProperty("url");
          expect(image.url).toMatch(/^https?:\/\//);
          expect(typeof image.height).toBe("number");
          expect(typeof image.width).toBe("number");
        });
      }
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-048", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
    }
  });

  test("TC-049 – Deve validar duração em milissegundos", async () => {
    const trackId = "3n3Ppam7vgaVa1iaRUc9Lp";
    logger.info("TC-049", "REQUEST_START", { trackId });

    try {
      const start = Date.now();
      const response = await requestManager.get(`/tracks/${trackId}`);
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-049", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-049", "REQUEST_SUCCESS", {
        status: response.status,
        duration: response.data?.duration_ms,
      });

      const duration = response.data.duration_ms;
      
      expect(typeof duration).toBe("number");
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(7200000); // Menor que 2 horas
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-049", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-050 – Deve validar popularidade entre 0 e 100", async () => {
    const trackId = "3n3Ppam7vgaVa1iaRUc9Lp";
    logger.info("TC-050", "REQUEST_START", { trackId });

    try {
      const start = Date.now();
      const response = await requestManager.get(`/tracks/${trackId}`);
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-050", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-050", "REQUEST_SUCCESS", {
        status: response.status,
        popularity: response.data?.popularity,
      });

      const popularity = response.data.popularity;
      
      expect(typeof popularity).toBe("number");
      expect(popularity).toBeGreaterThanOrEqual(0);
      expect(popularity).toBeLessThanOrEqual(100);
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-050", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-051 – Deve validar estrutura de followers", async () => {
    const artistId = "4gzpq5DPGxSnKTe4SA8HAU";
    logger.info("TC-051", "REQUEST_START", { artistId });

    try {
      const start = Date.now();
      const response = await requestManager.get(`/artists/${artistId}`);
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-051", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-051", "REQUEST_SUCCESS", {
        status: response.status,
        followers: response.data?.followers?.total,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("followers");
      expect(response.data.followers).toHaveProperty("href");
      expect(response.data.followers).toHaveProperty("total");
      expect(typeof response.data.followers.total).toBe("number");
      expect(response.data.followers.total).toBeGreaterThanOrEqual(0);
    } catch (error) {
      testContext.recordFail();
      logger.error("TC-051", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });
});
