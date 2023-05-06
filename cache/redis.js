const { createClient } = require("redis");

const REDIS_CONN_STRING =
  "redis://default:taLZ2SvlFQVOEhvIj0NTyfFTwy5EPdJa@redis-18279.c290.ap-northeast-1-2.ec2.cloud.redislabs.com:18279";

const redisClient = createClient({
  url: REDIS_CONN_STRING,
});

redisClient.on("error", (err) => console.error("REDIS ERROR::", err));

redisClient.connect().catch(console.error);

module.exports = redisClient;
