const { Client } = require("pg");

const PG_CONN_STRING =
  "postgres://qupiheiu:iFBdevRgxC26lT3ONhqkA5Ryt8MD4f9x@arjuna.db.elephantsql.com/qupiheiu";

const pgClient = new Client({
  connectionString: PG_CONN_STRING,
});

pgClient.connect().catch(console.error);

module.exports = pgClient;
