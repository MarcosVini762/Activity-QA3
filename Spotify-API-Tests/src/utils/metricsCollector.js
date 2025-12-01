/**
 * Coletor de métricas de performance para testes da API Spotify
 * Captura tempo de resposta por endpoint e calcula percentis P95 e P99
 */

class MetricsCollector {
  constructor() {
    this.metrics = {};
    this.testResults = [];
  }

  /**
   * registra uma métrica de tempo de resposta para um endpoint
   * @param {string} endpoint - nome do endpoint (ex: "/search", "/artists/{id}")
   * @param {number} responseTime - tempo em millisegundos
   * @param {number} statusCode - cóoigo http de resposta
   */
  recordMetric(endpoint, responseTime, statusCode = 200) {
    if (!this.metrics[endpoint]) {
      this.metrics[endpoint] = {
        responseTimes: [],
        statusCodes: [],
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
      };
    }

    const metric = this.metrics[endpoint];
    metric.responseTimes.push(responseTime);
    metric.statusCodes.push(statusCode);
    metric.count++;
    metric.totalTime += responseTime;
    metric.minTime = Math.min(metric.minTime, responseTime);
    metric.maxTime = Math.max(metric.maxTime, responseTime);
  }

  /**
   *registra resultado de um teste
   * @param {string} testName -nome do teste
   * @param {boolean} passed - se passou ou falhou
   * @param {number} duration - duração em ms
   */
  recordTestResult(testName, passed, duration) {
    this.testResults.push({
      testName,
      passed,
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * calcula percentil de um array
   * @param {number[]} arr - Array de números
   * @param {number} percentile - Percentil (0-100)
   * @returns {number} Valor do percentil
   */
  calculatePercentile(arr, percentile) {
    if (arr.length === 0) return 0;

    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Obtém estatísticas de um endpoint
   * @param {string} endpoint - Nome do endpoint
   * @returns {object} Objeto com estatísticas
   */
  getEndpointStats(endpoint) {
    if (!this.metrics[endpoint]) {
      return null;
    }

    const metric = this.metrics[endpoint];
    const avg = metric.totalTime / metric.count;
    const p95 = this.calculatePercentile(metric.responseTimes, 95);
    const p99 = this.calculatePercentile(metric.responseTimes, 99);

    return {
      endpoint,
      count: metric.count,
      avg: Math.round(avg),
      min: metric.minTime,
      max: metric.maxTime,
      p95: Math.round(p95),
      p99: Math.round(p99),
      statusCodes: [...new Set(metric.statusCodes)],
    };
  }

  /**
   * Obtém estatísticas de todos os endpoints
   * @returns {object[]} Array com estatísticas
   */
  getAllEndpointStats() {
    return Object.keys(this.metrics).map((endpoint) =>
      this.getEndpointStats(endpoint)
    );
  }

  /**
   * Gera relatório completo de métricas
   * @returns {object} Objeto com relatório completo
   */
  generateReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter((t) => t.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.testResults.reduce((sum, t) => sum + t.duration, 0);

    return {
      timestamp: new Date().toISOString(),
      testSummary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) + "%" : "N/A",
        totalDuration: totalDuration,
        averageDuration: totalTests > 0 ? Math.round(totalDuration / totalTests) : 0,
      },
      endpointMetrics: this.getAllEndpointStats(),
      testResults: this.testResults,
    };
  }

  /**
   * Retorna estatísticas em formato JSON para salvar em arquivo
   */
  toJSON() {
    return JSON.stringify(this.generateReport(), null, 2);
  }

  /**
   * Limpa todas as métricas
   */
  reset() {
    this.metrics = {};
    this.testResults = [];
  }
}

module.exports = new MetricsCollector();
