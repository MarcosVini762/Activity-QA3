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

describe("TESTES DE API - Gerenciamento de Conta Spotify", () => {
  test("TC-009 – Deve consultar perfil do usuário autenticado", async () => {
    const endpoint = testContext.getTestData("albums").endpoints?.me || "/me";
    logger.info("TC-009", "REQUEST_START", { endpoint });

    try {
      const start = Date.now();
      const response = await requestManager.get(endpoint);
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-009", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-009", "responseTime_ms", responseTime);
      logger.success("TC-009", "REQUEST_SUCCESS", {
        status: response.status,
        userId: response.data?.id,
        displayName: response.data?.display_name,
      });

      expect(response.status).toBe(200);

      expect(response.data).toHaveProperty("id");
      expect(response.data).toHaveProperty("display_name");
      expect(response.data).toHaveProperty("country");
      expect(response.data).toHaveProperty("email");

      expect(typeof response.data.id).toBe("string");
      expect(typeof response.data.display_name).toBe("string");
      expect(typeof response.data.country).toBe("string");

      expect(response.headers["content-type"]).toContain(
        testContext.validations.contentTypeJson
      );
    } catch (error) {
      testContext.recordFail();

      logger.error("TC-009", "TOKEN_SCOPE_ERROR", {
        status: error.response?.status,
        message: error.response?.data?.error?.message,
      });

      expect([
        testContext.errorCodes.unauthorized,
        testContext.errorCodes.forbidden,
      ]).toContain(error.response?.status);
    }
  });

  test("TC-010 – Deve consultar perfil de outro usuário por user_id", async () => {
    const userId = testContext.getTestData("users").publicUserId;
    logger.info("TC-010", "REQUEST_START", { userId });

    try {
      const start = Date.now();
      const response = await requestManager.get(`/users/${userId}`);
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-010", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-010", "responseTime_ms", responseTime);
      logger.success("TC-010", "REQUEST_SUCCESS", {
        status: response.status,
        userId: response.data?.id,
        displayName: response.data?.display_name,
      });

      expect(response.status).toBe(200);

      expect(response.data).toHaveProperty("id");
      expect(response.data).toHaveProperty("display_name");
      expect(response.data).toHaveProperty("followers");

      expect(typeof response.data.id).toBe("string");
      expect(response.data.id).toEqual(userId);

      expect(response.data.followers).toHaveProperty("total");
      expect(typeof response.data.followers.total).toBe("number");

      expect(response.headers["content-type"]).toContain(
        testContext.validations.contentTypeJson
      );
    } catch (error) {
      testContext.recordFail();

      logger.error("TC-010", "ERROR", {
        status: error.response?.status,
        message: error.response?.data?.error?.message,
      });
      throw error;
    }
  });

  test("TC-011 – Deve verificar dispositivos disponíveis do usuário", async () => {
    const endpoint = "/me/player/devices";
    logger.info("TC-011", "REQUEST_START", { endpoint });

    try {
      const start = Date.now();
      const response = await requestManager.get(endpoint);
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-011", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-011", "responseTime_ms", responseTime);
      logger.success("TC-011", "REQUEST_SUCCESS", {
        status: response.status,
        devicesCount: response.data?.devices?.length || 0,
      });

      expect(response.status).toBe(200);

      expect(response.data).toHaveProperty("devices");
      expect(Array.isArray(response.data.devices)).toBe(true);

      if (response.data.devices.length > 0) {
        const device = response.data.devices[0];

        expect(device).toHaveProperty("id");
        expect(device).toHaveProperty("name");
        expect(device).toHaveProperty("type");
        expect(device).toHaveProperty("is_active");

        expect(typeof device.id).toBe("string");
        expect(typeof device.name).toBe("string");
        expect(typeof device.type).toBe("string");
        expect(typeof device.is_active).toBe("boolean");

        logger.info("TC-011", "DEVICE_FOUND", {
          deviceId: device.id,
          deviceName: device.name,
          deviceType: device.type,
        });
      }

      expect(response.headers["content-type"]).toContain(
        testContext.validations.contentTypeJson
      );
    } catch (error) {
      testContext.recordFail();

      logger.error("TC-011", "ERROR", {
        status: error.response?.status,
        message: error.response?.data?.error?.message,
      });

      expect([
        testContext.errorCodes.forbidden,
        testContext.errorCodes.notFound,
        testContext.errorCodes.unauthorized,
      ]).toContain(error.response?.status);
    }
  });

  test("TC-012 – Deve pausar a reprodução do usuário autenticado", async () => {
    const endpoint = "/me/player/pause";
    logger.info("TC-012", "REQUEST_START", { endpoint });

    try {
      const start = Date.now();
      const response = await requestManager.put(endpoint);
      const responseTime = Date.now() - start;

      testContext.recordMetric("TC-012", "responseTime_ms", responseTime);
      testContext.recordPass();

      logger.metric("TC-012", "responseTime_ms", responseTime);
      logger.success("TC-012", "REQUEST_SUCCESS", {
        status: response.status,
      });

      expect([200, 204]).toContain(response.status);

      if (response.status === 204) {
        expect(response.data).toBeUndefined();
      }
    } catch (error) {
      testContext.recordFail();

      logger.error("TC-012", "ERROR", {
        status: error.response?.status,
        message: error.response?.data?.error?.message,
      });

      expect([
        testContext.errorCodes.forbidden,
        testContext.errorCodes.notFound,
      ]).toContain(error.response?.status);

      if (error.response?.status === testContext.errorCodes.forbidden) {
        expect(error.response.data).toHaveProperty("error");
        expect(error.response.data.error).toHaveProperty(
          "status",
          testContext.errorCodes.forbidden
        );
        expect(error.response.data.error).toHaveProperty("message");
      }
    }
  });
});
