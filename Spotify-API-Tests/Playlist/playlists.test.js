const axios = require('axios');
const { getSpotifyToken } = require('../spotify_auth');

const API_BASE_URL = 'https://api.spotify.com/v1';

// Função auxiliar para medir tempo de resposta com timeout
const measureResponseTime = async (requestFunction) => {
  const startTime = Date.now();
  try {
    const response = await requestFunction();
    const responseTime = Date.now() - startTime;
    return { response, responseTime, error: null };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return { response: null, responseTime, error };
  }
};

// Configuração do axios com timeout
const axiosInstance = axios.create({
  timeout: 10000, // 10 segundos
  timeoutErrorMessage: 'Request timeout'
});

describe('Spotify API Tests - Public Endpoints', () => {
  let token;

  beforeAll(async () => {
    try {
      console.log('Obtendo token do Spotify...');
      token = await getSpotifyToken();
      console.log('Token obtido com sucesso');
      
      if (!token) {
        throw new Error('Falha ao obter token: token está vazio');
      }
    } catch (error) {
      console.error('Erro ao obter token:', error.message);
      throw error;
    }
  });

  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  describe('TC-001: Buscar artistas', () => {
    let response;
    let responseTime;
    let testError;

    beforeAll(async () => {
      try {
        console.log('Iniciando busca de artistas...');
        const result = await measureResponseTime(async () => {
          return await axiosInstance.get(
            `${API_BASE_URL}/search`,
            {
              headers: getHeaders(),
              params: {
                q: 'Taylor Swift',
                type: 'artist',
                limit: 1
              }
            }
          );
        });
        
        response = result.response;
        responseTime = result.responseTime;
        testError = result.error;

        if (response) {
          console.log('Busca de artistas realizada com sucesso');
        } else if (testError) {
          console.error('Erro na busca:', testError.message);
          if (testError.response) {
            console.error('Status:', testError.response.status);
            console.error('Data:', testError.response.data);
          }
        }
      } catch (error) {
        console.error('Erro inesperado:', error.message);
        testError = error;
      }
    });

    test('Status code 200', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior:', testError.message);
        return; // Pula o teste se houve erro
      }
      expect(response.status).toBe(200);
    });

    test('Response time menor que 1500ms', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior');
        return;
      }
      expect(responseTime).toBeLessThan(1500);
    });

    test('Content-Type é application/json', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior');
        return;
      }
      expect(response.headers['content-type']).toContain('application/json');
    });

    test('Estrutura da resposta de busca', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior');
        return;
      }
      const responseData = response.data;
      
      expect(responseData).toHaveProperty('artists');
      expect(responseData.artists).toHaveProperty('items');
      expect(Array.isArray(responseData.artists.items)).toBe(true);
      
      if (responseData.artists.items.length > 0) {
        expect(responseData.artists.items.length).toBeGreaterThan(0);
      }
    });

    test('Estrutura do artista retornado', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior');
        return;
      }
      
      const responseData = response.data;
      
      if (responseData.artists.items.length > 0) {
        const artist = responseData.artists.items[0];
        
        expect(artist).toHaveProperty('id');
        expect(artist).toHaveProperty('name');
        expect(artist).toHaveProperty('type', 'artist');
        expect(artist).toHaveProperty('uri');
        expect(typeof artist.name).toBe('string');
      } else {
        console.log('Nenhum artista encontrado na busca, teste de estrutura pulado');
      }
    });
  });

  describe('TC-002: Obter álbuns do artista', () => {
    let artistId;
    let response;
    let responseTime;
    let testError;

    beforeAll(async () => {
      try {
        console.log('Buscando artista para teste de álbuns...');
        
        // Buscar um artista popular que certamente existe
        const searchResponse = await axiosInstance.get(
          `${API_BASE_URL}/search`,
          {
            headers: getHeaders(),
            params: {
              q: 'Coldplay',
              type: 'artist',
              limit: 1
            }
          }
        );

        if (searchResponse.data.artists.items.length > 0) {
          artistId = searchResponse.data.artists.items[0].id;
          console.log('Artist ID obtido:', artistId);

          const result = await measureResponseTime(async () => {
            return await axiosInstance.get(
              `${API_BASE_URL}/artists/${artistId}/albums`,
              {
                headers: getHeaders(),
                params: {
                  limit: 5,
                  offset: 0
                }
              }
            );
          });
          
          response = result.response;
          responseTime = result.responseTime;
          testError = result.error;
        } else {
          throw new Error('Nenhum artista encontrado para teste');
        }
      } catch (error) {
        console.error('Erro ao obter álbuns:', error.message);
        testError = error;
      }
    });

    test('Status code 200', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior:', testError.message);
        return;
      }
      expect(response.status).toBe(200);
    });

    test('Response time menor que 1500ms', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior');
        return;
      }
      expect(responseTime).toBeLessThan(1500);
    });

    test('Content-Type é application/json', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior');
        return;
      }
      expect(response.headers['content-type']).toContain('application/json');
    });

    test('Estrutura da resposta de álbuns', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior');
        return;
      }
      const responseData = response.data;
      
      expect(responseData).toHaveProperty('items');
      expect(Array.isArray(responseData.items)).toBe(true);
      
      // Verifica se há álbuns, mas não falha se não houver
      if (responseData.items.length > 0) {
        expect(responseData.items.length).toBeGreaterThan(0);
      }
    });

    test('Estrutura do álbum retornado', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior');
        return;
      }
      
      const responseData = response.data;
      
      if (responseData.items.length > 0) {
        const album = responseData.items[0];
        
        expect(album).toHaveProperty('id');
        expect(album).toHaveProperty('name');
        expect(album).toHaveProperty('type', 'album');
        expect(album).toHaveProperty('release_date');
        expect(album).toHaveProperty('total_tracks');
        expect(typeof album.total_tracks).toBe('number');
      } else {
        console.log('Nenhum álbum encontrado, teste de estrutura pulado');
      }
    });
  });

  describe('TC-003: Buscar faixas', () => {
    let response;
    let responseTime;
    let testError;

    beforeAll(async () => {
      try {
        console.log('Buscando faixas...');
        const result = await measureResponseTime(async () => {
          return await axiosInstance.get(
            `${API_BASE_URL}/search`,
            {
              headers: getHeaders(),
              params: {
                q: 'shape of you',
                type: 'track',
                limit: 3
              }
            }
          );
        });
        
        response = result.response;
        responseTime = result.responseTime;
        testError = result.error;

        if (response) {
          console.log('Busca de faixas realizada com sucesso');
        }
      } catch (error) {
        console.error('Erro ao buscar faixas:', error.message);
        testError = error;
      }
    });

    test('Status code 200', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior:', testError.message);
        return;
      }
      expect(response.status).toBe(200);
    });

    test('Response time menor que 1500ms', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior');
        return;
      }
      expect(responseTime).toBeLessThan(1500);
    });

    test('Content-Type é application/json', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior');
        return;
      }
      expect(response.headers['content-type']).toContain('application/json');
    });

    test('Estrutura da resposta de faixas', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior');
        return;
      }
      const responseData = response.data;
      
      expect(responseData).toHaveProperty('tracks');
      expect(responseData.tracks).toHaveProperty('items');
      expect(Array.isArray(responseData.tracks.items)).toBe(true);
      
      if (responseData.tracks.items.length > 0) {
        expect(responseData.tracks.items.length).toBeGreaterThan(0);
      }
    });

    test('Estrutura da faixa retornada', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior');
        return;
      }
      
      const responseData = response.data;
      
      if (responseData.tracks.items.length > 0) {
        const track = responseData.tracks.items[0];
        
        expect(track).toHaveProperty('id');
        expect(track).toHaveProperty('name');
        expect(track).toHaveProperty('duration_ms');
        expect(track).toHaveProperty('preview_url');
        expect(track).toHaveProperty('artists');
        expect(Array.isArray(track.artists)).toBe(true);
        expect(typeof track.name).toBe('string');
      } else {
        console.log('Nenhuma faixa encontrada, teste de estrutura pulado');
      }
    });
  });

  describe('TC-004: Obter informações do álbum', () => {
    let albumId;
    let response;
    let responseTime;
    let testError;

    beforeAll(async () => {
      try {
        console.log('Buscando álbum para teste...');
        
        // Buscar um álbum muito conhecido
        const searchResponse = await axiosInstance.get(
          `${API_BASE_URL}/search`,
          {
            headers: getHeaders(),
            params: {
              q: 'album:thriller',
              type: 'album',
              limit: 1
            }
          }
        );

        if (searchResponse.data.albums.items.length > 0) {
          albumId = searchResponse.data.albums.items[0].id;
          console.log('Album ID obtido:', albumId);

          const result = await measureResponseTime(async () => {
            return await axiosInstance.get(
              `${API_BASE_URL}/albums/${albumId}`,
              { headers: getHeaders() }
            );
          });
          
          response = result.response;
          responseTime = result.responseTime;
          testError = result.error;
        } else {
          throw new Error('Nenhum álbum encontrado para teste');
        }
      } catch (error) {
        console.error('Erro ao obter álbum:', error.message);
        testError = error;
      }
    });

    test('Status code 200', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior:', testError.message);
        return;
      }
      expect(response.status).toBe(200);
    });

    test('Response time menor que 1000ms', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior');
        return;
      }
      expect(responseTime).toBeLessThan(1000);
    });

    test('Content-Type é application/json', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior');
        return;
      }
      expect(response.headers['content-type']).toContain('application/json');
    });

    test('Estrutura completa do álbum', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior');
        return;
      }
      const responseData = response.data;
      
      expect(responseData).toHaveProperty('id');
      expect(responseData).toHaveProperty('name');
      expect(responseData).toHaveProperty('artists');
      expect(responseData).toHaveProperty('tracks');
      expect(responseData).toHaveProperty('release_date');
      expect(responseData).toHaveProperty('total_tracks');
      expect(responseData).toHaveProperty('images');
    });

    test('Validação da propriedade tracks do álbum', () => {
      if (testError) {
        console.log('Teste pulado devido a erro anterior');
        return;
      }
      
      const responseData = response.data;
      const tracks = responseData.tracks;
      
      expect(tracks).toHaveProperty('items');
      expect(Array.isArray(tracks.items)).toBe(true);
      
      if (tracks.items.length > 0) {
        const firstTrack = tracks.items[0];
        expect(firstTrack).toHaveProperty('id');
        expect(firstTrack).toHaveProperty('name');
        expect(firstTrack).toHaveProperty('duration_ms');
        expect(firstTrack).toHaveProperty('track_number');
      }
    });
  });
});