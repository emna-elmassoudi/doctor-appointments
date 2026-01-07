const router = require("express").Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

module.exports = router;
