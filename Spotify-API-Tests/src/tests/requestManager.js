const axios = require("axios");

class RequestManager {
  constructor() {
    if (RequestManager.instance) {
      return RequestManager.instance;
    }

    this.client = axios.create({
      baseURL: "https://api.spotify.com/v1",
      timeout: 5000,
    });

    RequestManager.instance = this;
    return this;
  }

  setToken(token) {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  async get(url, options = {}) {
    return this.client.get(url, options);
  }

  async post(url, data, options = {}) {
    return this.client.post(url, data, options);
  }

  async delete(url, data, options = {}){
    return this.client.delete(url, data, options)
  }

}

module.exports = new RequestManager();
