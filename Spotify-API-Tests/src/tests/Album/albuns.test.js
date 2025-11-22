const requestManager = require("../requestManager");
const { getSpotifyToken } = require("../../utils/spotify_auth");
const logger = require("../../utils/logger");

let token;

beforeAll(async () => {
  
  logger.info("TC-SETUP", "OBTER_TOKEN", {});
  token = await getSpotifyToken();

  if(!token){logger.error("TC-SETUP", "TOKEN_INVALIDO")}

  requestManager.setToken(token);
  logger.success("TC-SETUP", "TOKEN_APLICADO");
  
});

describe("TESTES DE API - Álbuns Spotify", () => {

  test("TC-001 – Deve obter um álbum específico", async () => {
    const albumId = "4aawyAB9vmqN3uQ7FjRGTy";
    const market = "US";

    logger.info("TC-001", "REQUEST_START", { albumId, market });

    const start = Date.now();
    const response = await requestManager.get(`/albums/${albumId}`, {
      params: { market },
    });

    logger.metric("TC-001", "responseTime_ms", Date.now() - start);
    logger.success("TC-001", "REQUEST_SUCCESS", {
      status: response.status,
      albumName: response.data?.name
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("name");
  });

  test("TC-002 – Deve retornar erro ao buscar álbum inválido", async () => {
    const invalidId = "xxxxx";
    const market = "ZZ";

    logger.info("TC-002", "REQUEST_START", { invalidId, market });

    try {
      await requestManager.get(`/albums/${invalidId}`, {
        params: { market },
      });

      const msg = "A requisição deveria ter falhado e não falhou";
      logger.error("TC-002", "FAILED_EXPECTED_ERROR", { msg });
      throw new Error(msg);

    } catch (error) {
      logger.error("TC-002", "SPOTIFY_ERROR", {
        status: error.response?.status,
        message: error.message
      });

      expect(error.response.status).toBe(400);
    }
  });

  test("TC-003 – Deve obter vários álbuns", async () => {
    const ids = "4aawyAB9vmqN3uQ7FjRGTy,382ObEPsp2rxGrnsizN5TX";

    logger.info("TC-003", "REQUEST_START", { ids });

    const response = await requestManager.get(`/albums`, {
      params: { ids, market: "US" },
    });

    logger.success("TC-003", "REQUEST_SUCCESS", {
      status: response.status,
      totalAlbums: response.data.albums.length
    });

    expect(response.status).toBe(200);
    expect(response.data.albums.length).toBeGreaterThan(1);
  });
});
