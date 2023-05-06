const apiRateLimitRules = require("../database/apiRateLimitRules");
const redisClient = require("../cache/redis");

const pgClient = require("../database/postgres");

const APIRateLimitterWithRedis = require("../rateLimiter");

/**
 *
 * @param {'monthly' | 'system'} limitType it can also be passed to the request's params
 * @returns
 */
const limitReqRate = (limitType = "system") => {
  return async (req, res, next) => {
    try {
      let uniqueRequestId =
        req.query.clientId ||
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress;

      if (uniqueRequestId === "::1") {
        uniqueRequestId = "127.0.0.1";
      }

      let windowSizeInMs;

      let maxRequestsPerWindow;

      const rateLimitType = req.params.limitType || limitType;

      switch (rateLimitType) {
        case "system":
          windowSizeInMs = apiRateLimitRules.windowSizeMs;
          maxRequestsPerWindow = apiRateLimitRules.maxRequestsPerWindow;
          break;

        case "monthly":
          const nowMs = new Date(Date.now()).getTime();

          const currentYear = new Date(nowMs).getFullYear();

          const currentMonth = new Date(nowMs).getMonth();

          const endOfMonthMs = new Date(
            currentYear,
            currentMonth + 1,
            1,
            23,
            59,
            59
          ).getTime();

          windowSizeInMs = endOfMonthMs - nowMs || 0;
          maxRequestsPerWindow = apiRateLimitRules.maxRequestsPerMonth;
          break;

        default:
          windowSizeInMs = apiRateLimitRules.windowSizeMs;
          maxRequestsPerWindow = apiRateLimitRules.maxRequestsPerWindow;
          break;
      }

      const rateLimitterFactory = new APIRateLimitterWithRedis();

      const rateLimitter = await rateLimitterFactory.create(
        pgClient,
        redisClient,
        rateLimitType,
        windowSizeInMs,
        maxRequestsPerWindow
      );

      const isAllowed = await rateLimitter.checkRateLimit(uniqueRequestId);

      if (!isAllowed) {
        return res
          .status(429)
          .send(
            `Rate limit reached! Max ${rateLimitter.maxRequestsPerWindow} ${rateLimitType} requests reached.`
          );
      }

      const rateLimitInfo = req.rateLimitInfo || [];

      rateLimitInfo.push(
        `window=${rateLimitType} max=${maxRequestsPerWindow} left=${
          maxRequestsPerWindow - (rateLimitter.currentWindowRequestsCount + 1)
        }`
      );

      req.rateLimitInfo = rateLimitInfo;

      next();
    } catch (error) {
      console.error(error);

      res.status(500).send("Internal Server Error");
    }
  };
};

module.exports = limitReqRate;
