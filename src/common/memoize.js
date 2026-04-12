// @ts-check

/**
 * Memoization cache with LRU eviction.
 */
class MemoizeCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    /** @type {Map<string, { value: any, timestamp: number }>} */
    this.cache = new Map();
  }

  /**
   * Get value from cache.
   *
   * @param {string} key - Cache key.
   * @returns {any | undefined} Cached value or undefined.
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Set value in cache.
   *
   * @param {string} key - Cache key.
   * @param {any} value - Value to cache.
   */
  set(key, value) {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  /**
   * Clear all cache entries.
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size.
   *
   * @returns {number} Number of entries in cache.
   */
  size() {
    return this.cache.size;
  }
}

/**
 * Create a memoized function.
 *
 * @param {Function} fn - Function to memoize.
 * @param {Object} options - Memoization options.
 * @param {number} [options.maxSize=100] - Maximum cache size.
 * @param {Function} [options.keyFn] - Function to generate cache key from arguments.
 * @returns {Function} Memoized function.
 */
const memoize = (fn, options = {}) => {
  const { maxSize = 100, keyFn } = options;
  const cache = new MemoizeCache(maxSize);

  return function (...args) {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);

    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // @ts-ignore - Dynamic function call
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Create a memoized async function.
 *
 * @param {Function} fn - Async function to memoize.
 * @param {Object} options - Memoization options.
 * @param {number} [options.maxSize=100] - Maximum cache size.
 * @param {Function} [options.keyFn] - Function to generate cache key from arguments.
 * @returns {Function} Memoized async function.
 */
const memoizeAsync = (fn, options = {}) => {
  const { maxSize = 100, keyFn } = options;
  const cache = new MemoizeCache(maxSize);

  return async function (...args) {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);

    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // @ts-ignore - Dynamic function call
    const result = await fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
};

export { memoize, memoizeAsync, MemoizeCache };
