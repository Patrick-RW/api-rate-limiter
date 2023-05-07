/**
 *
 * @description An API rate limitter based on the sliding window logs algorithm and redis sorted sets
 */
class APIRateLimitter {
  /**
   *
   * @param {object} redisClient an instance of redis client with connection
   * @param {'monthly' | 'system'} limitType
   * @param {number} windowSizeInMs an integer(time in milliseconds) representing the size of the rate limit window
   * @param {number} maxRequestsPerWindow an integer(time in milliseconds) representing the size of the maximum requests per rate limit window
   */
  constructor(redisClient, limitType, windowSizeInMs, maxRequestsPerWindow) {
    this.redisClient = redisClient;
    this.limitType = limitType;
    this.windowSizeInMs = windowSizeInMs;
    this.maxRequestsPerWindow = maxRequestsPerWindow;
    this.currentWindowRequestsCount = 0;

    if (!redisClient || typeof redisClient !== "object") {
      throw new Error(
        "No cache client provided!, you must pass a valid redis client with an active connection"
      );
    }

    if (!limitType || !["monthly", "system"].includes(limitType)) {
      throw new Error(
        "No rate limit type provided!, you must pass either 'monthly' or 'system'"
      );
    }

    if (!windowSizeInMs || typeof windowSizeInMs !== "number") {
      throw new Error(
        "No rate limit window size provided!, you must pass a valid integer representing the size of the rate limit window"
      );
    }

    if (!maxRequestsPerWindow || typeof maxRequestsPerWindow !== "number") {
      throw new Error(
        "No maximum requests per rate limit window provided!, you must pass a valid integer representing the size of the maximum requests per rate limit window"
      );
    }
  }

  /**
   *
   * @param {string} uniqueRequestId
   * @returns {Promise<boolean>} a boolean specifying whether a request has to be dropped or not
   */
  async checkRateLimit(uniqueRequestId) {
    try {
      const nowMs = Date.now();

      const windowStartInMs = nowMs - this.windowSizeInMs;

      const windowKey = `${uniqueRequestId}:${this.limitType}`;

      let currentWindowRequestsCount = await this.redisClient.zCount(
        windowKey,
        windowStartInMs,
        nowMs
      );

      this.currentWindowRequestsCount = currentWindowRequestsCount;

      if (currentWindowRequestsCount >= this.maxRequestsPerWindow) {
        return false;
      }

      await this.redisClient.zAdd(windowKey, {
        score: nowMs,
        value: String(nowMs),
      });

      await this.redisClient.zRemRangeByScore(
        windowKey,
        0,
        windowStartInMs - 1
      );

      const windowSizeInSeconds = Math.floor(this.windowSizeInMs / 1000);

      await this.redisClient.expire(windowKey, windowSizeInSeconds);

      return true;
    } catch (error) {
      console.error(error);
    }
  }
}

class APIRateLimitterWithRedis {
  /**
   *
   * @param {object} redisClient an instance of redis client with connection
   * @param {'monthly' | 'system'} limitType
   * @param {number} windowSizeInMs
   * @param {number} maxRequestsPerWindow
   */
  async create(redisClient, limitType, windowSizeInMs, maxRequestsPerWindow) {
    const rateLimitter = new APIRateLimitter(
      redisClient,
      limitType,
      windowSizeInMs,
      maxRequestsPerWindow
    );

    return rateLimitter;
  }
}

module.exports = APIRateLimitterWithRedis;
