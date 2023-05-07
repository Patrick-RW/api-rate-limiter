const express = require("express");

require("dotenv").config();

const limitReqRate = require("./middleware/limitReqRate");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

// WEB SERVICE 1
app.get(
  "/ws-1",
  limitReqRate("system"),
  limitReqRate("monthly"),
  (req, res) => {
    res.json(req.rateLimitInfo.join(" | "));
  }
);

app.get("/ws-1/:limitType", limitReqRate(), (req, res) => {
  res.json(req.rateLimitInfo.join(" | "));
});

// WEB SERVICE 2
app.get(
  "/ws-2",
  limitReqRate("system"),
  limitReqRate("monthly"),
  (req, res) => {
    res.json(req.rateLimitInfo.join(" | "));
  }
);

app.get("/ws-2/:limitType", limitReqRate(), (req, res) => {
  res.json(req.rateLimitInfo.join(" | "));
});

// WEB SERVICE 3
app.get(
  "/ws-3",
  limitReqRate("system"),
  limitReqRate("monthly"),
  (req, res) => {
    res.json(req.rateLimitInfo.join(" | "));
  }
);

app.get("/ws-3/:limitType", limitReqRate(), (req, res) => {
  res.json(req.rateLimitInfo);
});

app.listen(PORT, () => {
  console.log(`API Rate limitter app listening on port ${PORT}`);
});
