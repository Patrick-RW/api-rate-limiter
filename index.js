const express = require("express");

const limitReqRate = require("./middleware/limitReqRate");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

// WEB SERVICE 1
app.get(
  "/ws-1",
  limitReqRate("monthly"),
  limitReqRate("system"),
  (req, res) => {
    res.json(req.rateLimitInfo || "ok");
  }
);

app.get("/ws-1/:limitType", limitReqRate(), (req, res) => {
  res.json(req.rateLimitInfo || "ok");
});

// WEB SERVICE 2
app.get(
  "/ws-2",
  limitReqRate("monthly"),
  limitReqRate("system"),
  (req, res) => {
    res.json(req.rateLimitInfo || "ok");
  }
);

app.get("/ws-2/:limitType", limitReqRate(), (req, res) => {
  res.json(req.rateLimitInfo);
});

// WEB SERVICE 3
app.get(
  "/ws-3",
  limitReqRate("monthly"),
  limitReqRate("system"),
  (req, res) => {
    res.json(req.rateLimitInfo || "ok");
  }
);

app.get("/ws-3/:limitType", limitReqRate(), (req, res) => {
  res.json(req.rateLimitInfo);
});

app.listen(PORT, () => {
  console.log(`API Rate limitter app listening on port ${PORT}`);
});
