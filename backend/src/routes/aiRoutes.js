const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const { aiChat } = require("../controllers/aiController");

router.post("/chat", protect, aiChat);

module.exports = router;
