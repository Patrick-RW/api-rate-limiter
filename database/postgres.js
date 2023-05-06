const { Client } = require("pg");

const PG_CONN_STRING = process.env.DATABASE_URL;

const pgClient = new Client({
  connectionString: PG_CONN_STRING,
});

pgClient.connect().catch(console.error);

module.exports = pgClient;
