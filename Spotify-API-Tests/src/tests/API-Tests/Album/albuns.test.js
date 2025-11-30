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

describe("TESTES DE API - Álbuns Spotify", () => {
  test("TC-001 – Deve obter um álbum específico", async () => {
    const albumData = testContext.getTestData("albums");
    const { validId: albumId, market } = albumData;

    logger.info("TC-001", "REQUEST_START", { albumId, market });

    try {
      const start = Date.now();
      const response = await requestManager.get(`/albums/${albumId}`, {
        params: { market },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-001", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-001", "responseTime_ms", responseTime);
      logger.success("TC-001", "REQUEST_SUCCESS", {
        status: response.status,
        albumName: response.data?.name,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("name");
      expect(response.headers["content-type"]).toContain(
        testContext.validations.contentTypeJson
      );
    } catch (error) {
      testContext.recordFail();

      logger.error("TC-001", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });

  test("TC-002 – Deve retornar erro ao buscar álbum inválido", async () => {
    const albumData = testContext.getTestData("albums");
    const { invalidId, invalidMarket: market } = albumData;

    logger.info("TC-002", "REQUEST_START", { invalidId, market });

    try {
      await requestManager.get(`/albums/${invalidId}`, {
        params: { market },
      });

      testContext.recordFail();

      const msg = "A requisição deveria ter falhado e não falhou";
      logger.error("TC-002", "FAILED_EXPECTED_ERROR", { msg });
      throw new Error(msg);
    } catch (error) {
      if (error.message === "A requisição deveria ter falhado e não falhou") {
        throw error;
      }

      testContext.recordPass();

      logger.error("TC-002", "ERROR_ESPERADO", {
        status: error.response?.status,
        message: error.message,
      });

      expect(error.response.status).toBe(testContext.errorCodes.badRequest);
    }
  });

  test("TC-003 – Deve obter vários álbuns", async () => {
    const albumData = testContext.getTestData("albums");
    const { validIds: ids } = albumData;

    logger.info("TC-003", "REQUEST_START", { ids });

    try {
      const start = Date.now();
      const response = await requestManager.get(`/albums`, {
        params: { ids, market: "US" },
      });
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-003", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.success("TC-003", "REQUEST_SUCCESS", {
        status: response.status,
        totalAlbums: response.data.albums.length,
      });

      expect(response.status).toBe(200);
      expect(response.data.albums.length).toBeGreaterThan(1);
      expect(response.headers["content-type"]).toContain(
        testContext.validations.contentTypeJson
      );
    } catch (error) {
      testContext.recordFail();

      logger.error("TC-003", "ERROR", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  });
});
