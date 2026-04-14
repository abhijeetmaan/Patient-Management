const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
  listAllDoctors,
  listAllPatients,
  getAdminStats,
  updateDoctorPermissionsById,
} = require("../controllers/adminController");

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/doctors", listAllDoctors);
router.patch("/doctors/:id/permissions", updateDoctorPermissionsById);
router.get("/patients", listAllPatients);
router.get("/stats", getAdminStats);

module.exports = router;
