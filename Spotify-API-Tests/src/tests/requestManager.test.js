const axios = require("axios");

jest.mock("axios");

//depois de mockar axios, importa o RequestManager
delete require.cache[require.resolve("./requestManager")];
const RequestManager = require("./requestManager");

describe("RequestManager - Testes Unitários", () => {
  let mockClientInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    //cria um mock client que o axios.create retornará
    mockClientInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      defaults: {
        headers: {
          common: {},
        },
      },
    };

    //configura o axios.create para retornar nosso mock
    axios.create.mockReturnValue(mockClientInstance);
  });

  //teste 1: Validar criação de instância única (Singleton)
  test("Deve retornar a mesma instância quando chamado múltiplas vezes", () => {
    expect(RequestManager).toBeDefined();
    expect(RequestManager.setToken).toBeDefined();
    expect(RequestManager.get).toBeDefined();
    expect(RequestManager.post).toBeDefined();
  });

  //teste 2: Validar setToken adiciona Bearer token corretamente
  test("Deve adicionar token de autorização com Bearer", () => {
    RequestManager.client = mockClientInstance;
    const token = "test_token_123";

    RequestManager.setToken(token);

    expect(mockClientInstance.defaults.headers.common["Authorization"]).toBe(
      `Bearer ${token}`
    );
  });

  //teste 3 Validar método GET executa corretamente
  test("Deve executar requisição GET com sucesso", async () => {
    RequestManager.client = mockClientInstance;
    const mockResponse = { data: { id: "123", name: "Test" } };
    mockClientInstance.get.mockResolvedValue(mockResponse);

    const response = await RequestManager.get("/tracks/123");

    expect(mockClientInstance.get).toHaveBeenCalledWith("/tracks/123", {});
    expect(response).toEqual(mockResponse);
  });

  //teste 4 Validar método POST executa corretamente
  test("Deve executar requisição POST com dados", async () => {
    RequestManager.client = mockClientInstance;
    const mockResponse = { data: { id: "new", status: "created" } };
    const postData = { name: "New Playlist" };
    mockClientInstance.post.mockResolvedValue(mockResponse);

    const response = await RequestManager.post("/playlists", postData);

    expect(mockClientInstance.post).toHaveBeenCalledWith(
      "/playlists",
      postData,
      {}
    );
    expect(response).toEqual(mockResponse);
  });

  //teste 5 Validar método PUT executa corretamente
  test("Deve executar requisição PUT com atualização de dados", async () => {
    RequestManager.client = mockClientInstance;
    const mockResponse = { data: { id: "123", updated: true } };
    const updateData = { name: "Updated Name" };
    mockClientInstance.put.mockResolvedValue(mockResponse);

    const response = await RequestManager.put("/tracks/123", updateData);

    expect(mockClientInstance.put).toHaveBeenCalledWith(
      "/tracks/123",
      updateData,
      {}
    );
    expect(response).toEqual(mockResponse);
  });

  //teste 6: Validar método DELETE executa corretamente
  test("Deve executar requisição DELETE com sucesso", async () => {
    RequestManager.client = mockClientInstance;
    const mockResponse = { data: { success: true } };
    mockClientInstance.delete.mockResolvedValue(mockResponse);

    const response = await RequestManager.delete("/tracks/123", {});

    expect(mockClientInstance.delete).toHaveBeenCalledWith(
      "/tracks/123",
      {},
      {}
    );
    expect(response).toEqual(mockResponse);
  });

  //teste 7: Validar GET com opções adicionais
  test("Deve executar GET com opções personalizadas", async () => {
    RequestManager.client = mockClientInstance;
    const mockResponse = { data: { items: [] } };
    const options = { params: { limit: 50, offset: 0 } };
    mockClientInstance.get.mockResolvedValue(mockResponse);

    const response = await RequestManager.get("/search", options);

    expect(mockClientInstance.get).toHaveBeenCalledWith("/search", options);
    expect(response).toEqual(mockResponse);
  });

  //teste 8: Validar tratamento de erros em requisição
  test("Deve propagar erro quando requisição falha", async () => {
    RequestManager.client = mockClientInstance;
    const mockError = new Error("Network Error");
    mockClientInstance.get.mockRejectedValue(mockError);

    await expect(RequestManager.get("/invalid")).rejects.toThrow(
      "Network Error"
    );
    expect(mockClientInstance.get).toHaveBeenCalledWith("/invalid", {});
  });
});
