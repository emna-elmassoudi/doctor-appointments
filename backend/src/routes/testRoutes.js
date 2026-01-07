const router = require("express").Router();
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/admin-only", protect, authorize("admin_facility"), (req, res) => {
  res.json({
    message: "Welcome Admin Facility ✅",
    admin: req.user.fullName,
  });
});

module.exports = router;
