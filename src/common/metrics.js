// @ts-check

/**
 * Performance metrics collector.
 */
class MetricsCollector {
  constructor() {
    /** @type {{ apiCalls: Record<string, number>, cacheHits: number, cacheMisses: number, rateLimitUsage: Record<string, number>, responseTimes: Record<string, number[]> }} */
    this.metrics = {
      apiCalls: {},
      cacheHits: 0,
      cacheMisses: 0,
      rateLimitUsage: {},
      responseTimes: {},
    };
  }

  /**
   * Time a function execution.
   *
   * @param {string} name - Metric name.
   * @param {Function} fn - Function to time.
   * @returns {Promise<any>} Function result.
   */
  async time(name, fn) {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordResponseTime(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordResponseTime(`${name}_error`, duration);
      throw error;
    }
  }

  /**
   * Record API call.
   *
   * @param {string} endpoint - API endpoint.
   */
  recordApiCall(endpoint) {
    if (!this.metrics.apiCalls[endpoint]) {
      this.metrics.apiCalls[endpoint] = 0;
    }
    this.metrics.apiCalls[endpoint]++;
  }

  /**
   * Record cache hit.
   */
  recordCacheHit() {
    this.metrics.cacheHits++;
  }

  /**
   * Record cache miss.
   */
  recordCacheMiss() {
    this.metrics.cacheMisses++;
  }

  /**
   * Get cache hit rate.
   *
   * @returns {number} Hit rate percentage.
   */
  getCacheHitRate() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    if (total === 0) {
      return 0;
    }
    return (this.metrics.cacheHits / total) * 100;
  }

  /**
   * Record response time.
   *
   * @param {string} name - Metric name.
   * @param {number} duration - Duration in milliseconds.
   */
  recordResponseTime(name, duration) {
    if (!this.metrics.responseTimes[name]) {
      this.metrics.responseTimes[name] = [];
    }
    this.metrics.responseTimes[name].push(duration);
  }

  /**
   * Get metrics summary.
   *
   * @returns {Object} Metrics summary.
   */
  getSummary() {
    return {
      apiCalls: this.metrics.apiCalls,
      cacheHitRate: this.getCacheHitRate(),
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      rateLimitUsage: this.metrics.rateLimitUsage,
      averageResponseTimes: Object.fromEntries(
        Object.entries(this.metrics.responseTimes).map(([key, times]) => [
          key,
          times.reduce((sum, t) => sum + t, 0) / times.length,
        ]),
      ),
    };
  }

  /**
   * Reset all metrics.
   */
  reset() {
    this.metrics = {
      apiCalls: {},
      cacheHits: 0,
      cacheMisses: 0,
      rateLimitUsage: {},
      responseTimes: {},
    };
  }
}

const metrics = new MetricsCollector();

export { metrics, MetricsCollector };
