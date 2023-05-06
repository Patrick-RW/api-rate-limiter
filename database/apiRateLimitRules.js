const apiRateLimitRules = {
  apiKey: "SOME_API_KEY",
  maxRequestsPerMonth: 30,
  maxRequestsPerWindow: 2,
  windowSizeMs: 1000,
};

module.exports = apiRateLimitRules;
