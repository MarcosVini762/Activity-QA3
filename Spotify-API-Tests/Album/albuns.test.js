const axios = require('axios');
const { getSpotifyToken } = require('../spotify_auth');

const API_URL = "https://api.spotify.com/v1/albums";

let token;

beforeAll(async () => {
    token = await getSpotifyToken();
});

describe("TESTES DE API - Álbuns Spotify", () => {

    test("TC-001 – Deve obter um álbum específico com id e market válidos", async () => {
        
        const albumId = "4aawyAB9vmqN3uQ7FjRGTy"; 
        const market = "US";

        const response = await axios.get(`${API_URL}/${albumId}`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { market }
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("name");
        expect(response.data).toHaveProperty("total_tracks");
        expect(response.data).toHaveProperty("artists")
    });

    test("TC-002 – Deve retornar erro ao buscar álbum com id inválido", async () => {

        const invalidId = "xxxxx";
        const market = "ZZ";

        try {
            await axios.get(`${API_URL}/${invalidId}`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { market }
            });

            throw new Error("A requisição deveria ter falhado e não falhou");

        } catch (error) {
            expect(error.response.status).toBe(400); 
            expect(error.response.data).toHaveProperty("error");
        }
    });

    test("TC-003 – Deve obter vários álbuns com ids válidos", async () => {

        const ids = "4aawyAB9vmqN3uQ7FjRGTy,382ObEPsp2rxGrnsizN5TX";
        const market = "US";

        const response = await axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` },
            params: { ids, market }
        });

        expect(response.status).toBe(200);
        expect(response.data.albums.length).toBeGreaterThan(1);
        expect(response.data.albums[0]).toHaveProperty("name");
    });

    test("TC-004 – Deve falhar ao tentar obter vários álbuns inválidos", async () => {

        const ids = "xxxx,yyyy,zzzz";
        const market = "AA";

        try {
            await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` },
                params: { ids, market }
            });

            throw new Error("A requisição deveria ter falhado e não falhou");

        } catch (error) {
            expect(error.response.status).toBeGreaterThanOrEqual(400);
            expect(error.response.data).toHaveProperty("error");
        }
    });
});
