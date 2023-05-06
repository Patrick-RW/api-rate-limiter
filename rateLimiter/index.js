/**
 *
 * @description An API rate limitter based on the sliding window logs algorithm and redis sorted sets
 */
class APIRateLimitter {
  /**
   *
   * @param {object} pgClient an instance of posgres database client
   * @param {object} redisClient an instance of redis client with connection
   * @param {'monthly' | 'system'} limitType
   * @param {number} windowSizeInMs an integer(time in milliseconds) representing the size of the rate limit window
   * @param {number} maxRequestsPerWindow an integer(time in milliseconds) representing the size of the maximum requests per rate limit window
   */
  constructor(
    pgClient,
    redisClient,
    limitType,
    windowSizeInMs,
    maxRequestsPerWindow
  ) {
    this.pgClient = pgClient;
    this.redisClient = redisClient;
    this.limitType = limitType;
    this.windowSizeInMs = windowSizeInMs;
    this.maxRequestsPerWindow = maxRequestsPerWindow;
    this.currentWindowRequestsCount = 0;

    if (!pgClient || typeof pgClient !== "object") {
      throw new Error(
        "No database client provided!, you must pass a valid database client/pool with an active connection"
      );
    }

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

      // if (!currentWindowRequestsCount) {
      //   const res = await this.pgClient.query(
      //     "SELECT windowKey, score FROM api_rate_limiter WHERE windowKey = $1 AND score < $2 AND score > $3",
      //     [windowKey, nowMs, windowStartInMs]
      //   );

      //   if (res.rowCount > 0) {
      //     const newMembersToCache = res.rows.map((row) => {
      //       return this.redisClient.zAdd(windowKey, {
      //         score: row.score,
      //         value: String(row.score),
      //       });
      //     });

      //     await Promise.all(newMembersToCache);

      //     console.log("ADDED TO CACHE COUNT=", res.rowCount);
      //   }

      //   currentWindowRequestsCount = res.rowCount || 0;
      // }

      // this.pgClient.query(
      //   "INSERT INTO api_rate_limiter(windowKey, score) VALUES ($1, $2)",
      //   [windowKey, nowMs]
      // )
      // .catch(console.error);

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

      // this.pgClient.query(
      //   "DELETE FROM api_rate_limiter WHERE windowKey = $1 AND score < $2",
      //   [windowKey, windowStartInMs]
      // )
      // .catch(console.error);

      return true;
    } catch (error) {
      console.error(error);
    }
  }
}

class APIRateLimitterWithRedis {
  /**
   *
   * @param {object} pgClient an instance of posgres client
   * @param {object} redisClient an instance of redis client with connection
   * @param {'month' | 'system'} limitType
   * @param {number} windowSizeInMs
   * @param {number} maxRequestsPerWindow
   */
  async create(
    pgClient,
    redisClient,
    limitType,
    windowSizeInMs,
    maxRequestsPerWindow
  ) {
    const rateLimitter = new APIRateLimitter(
      pgClient,
      redisClient,
      limitType,
      windowSizeInMs,
      maxRequestsPerWindow
    );

    return rateLimitter;
  }
}

module.exports = APIRateLimitterWithRedis;
