/**
 *
 * @description An API rate limitter based on the sliding window logs algorithm and redis sorted sets
 */
class APIRateLimitter {
  /**
   *
   * @param {object} redisClient an instance of redis client with connection
   * @param {number} windowSizeInMs an integer(time in milliseconds) representing the size of the rate limit window
   * @param {number} maxRequestsPerWindow an integer(time in milliseconds) representing the size of the maximum requests per rate limit window
   */
  constructor(redisClient, windowSizeInMs, maxRequestsPerWindow) {
    this.redisClient = redisClient;
    this.windowSizeInMs = windowSizeInMs;
    this.maxRequestsPerWindow = maxRequestsPerWindow;
    this.currentWindowRequestsCount = 0;
    this.retryMs = 0;
    this.nextWindowStartMs = 0;

    if (!redisClient || typeof redisClient !== "object") {
      throw new Error(
        "No cache client provided!, you must pass a valid redis client with an active connection"
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
   * @param {string} uniqueRequestId A unique string representing the
   * @returns {Promise<boolean>} A boolean specifying whether a request has to be dropped or not
   */
  async checkRateLimit(uniqueRequestId) {
    const nowMs = Date.now();

    const windowStartInMs = nowMs - this.windowSizeInMs;

    const windowKey = uniqueRequestId;

    const currentWindowRequests = await this.redisClient.zRangeByScore(
      windowKey,
      windowStartInMs,
      nowMs
    );

    this.currentWindowRequestsCount = currentWindowRequests.length;

    if (this.currentWindowRequestsCount >= this.maxRequestsPerWindow) {
      this.nextWindowStartMs =
        Number(currentWindowRequests[0]) + this.windowSizeInMs;

      this.retryMs = this.nextWindowStartMs - nowMs;

      return false;
    }

    await this.redisClient.zAdd(windowKey, {
      score: nowMs,
      value: String(nowMs),
    });

    const windowSizeInSeconds = Math.floor(this.windowSizeInMs / 1000);

    // set expiration time for the new window
    await this.redisClient.expire(windowKey, windowSizeInSeconds);

    // remove all requests older than the start of the current window
    await this.redisClient.zRemRangeByScore(windowKey, 0, windowStartInMs - 1);

    return true;
  }
}

class APIRateLimitterWithRedis {
  /**
   *
   * @param {object} redisClient an instance of redis client with connection
   * @param {number} windowSizeInMs
   * @param {number} maxRequestsPerWindow
   */
  async create(redisClient, windowSizeInMs, maxRequestsPerWindow) {
    const rateLimitter = new APIRateLimitter(
      redisClient,
      windowSizeInMs,
      maxRequestsPerWindow
    );

    return rateLimitter;
  }
}

module.exports = APIRateLimitterWithRedis;
