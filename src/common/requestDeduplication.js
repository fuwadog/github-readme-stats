// @ts-check

/**
 * Request deduplication utility to cache in-flight requests.
 * Prevents duplicate API calls for the same data.
 */
class RequestDeduplicator {
  constructor() {
    /** @type {Map<string, Promise<any>>} */
    this.pendingRequests = new Map();
  }

  /**
   * Execute a request with deduplication.
   * If a request with the same key is already in progress, return that promise.
   *
   * @param {string} key - Unique key for the request.
   * @param {Function} requestFn - Function that returns a promise.
   * @returns {Promise<any>} Request result.
   */
  async execute(key, requestFn) {
    // Return existing in-flight request if available
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request
    const promise = requestFn().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Clear all pending requests.
   */
  clear() {
    this.pendingRequests.clear();
  }

  /**
   * Get count of pending requests.
   *
   * @returns {number} Number of pending requests.
   */
  getPendingCount() {
    return this.pendingRequests.size;
  }
}

// Global deduplicator instance
const requestDeduplicator = new RequestDeduplicator();

/**
 * Generate cache key for GraphQL requests.
 *
 * @param {Object} queryObj - GraphQL query object.
 * @returns {string} Cache key.
 */
const generateGraphQLKey = (queryObj) => {
  return JSON.stringify(queryObj);
};

/**
 * Execute request with deduplication.
 *
 * @param {string} key - Unique key for the request.
 * @param {Function} requestFn - Function that returns a promise.
 * @returns {Promise<any>} Request result.
 */
const deduplicateRequest = (key, requestFn) => {
  return requestDeduplicator.execute(key, requestFn);
};

/**
 * Execute GraphQL request with deduplication.
 *
 * @param {Object} queryObj - GraphQL query object.
 * @param {Function} requestFn - Function that returns a promise.
 * @returns {Promise<any>} Request result.
 */
const deduplicateGraphQLRequest = (queryObj, requestFn) => {
  const key = generateGraphQLKey(queryObj);
  return requestDeduplicator.execute(key, requestFn);
};

export {
  requestDeduplicator,
  RequestDeduplicator,
  deduplicateRequest,
  deduplicateGraphQLRequest,
  generateGraphQLKey,
};
