const { Client } = require("pg");

const PG_CONN_STRING = process.env.DATABASE_URL;

const pgClient = new Client({
  connectionString: PG_CONN_STRING,
  ssl:
    process.env.NODE_ENV === "development"
      ? false
      : {
          rejectUnauthorized: false,
        },
});

pgClient.connect().catch(console.error);

module.exports = pgClient;
