const statsService = require('../../services/statsService');

// Sprint 5 US#4: GET /api/stats -> { "totalProducts": X, "totalCategories": Y }
function getStats(req, res) {
  res.json(statsService.getStats());
}

module.exports = { getStats };
