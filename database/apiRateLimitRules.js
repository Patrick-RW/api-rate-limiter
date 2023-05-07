const apiRateLimitRules = {
  apiKey: "ARL",
  maxRequestsPerMonth: 30,
  maxRequestsPerWindow: 2,
  windowSizeMs: 1000,
};

module.exports = apiRateLimitRules;
