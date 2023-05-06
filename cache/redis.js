const { createClient } = require("redis");

const REDIS_CONN_STRING = process.env.REDIS_URL;

const redisClient = createClient({
  url: REDIS_CONN_STRING,
});

redisClient.on("error", (err) => console.error("REDIS ERROR::", err));

redisClient.connect().catch(console.error);

module.exports = redisClient;
