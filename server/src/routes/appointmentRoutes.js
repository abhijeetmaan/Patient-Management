const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { checkPermission } = require("../utils/permissions");
const {
  createAppointment,
  listAppointments,
  updateAppointmentStatus,
} = require("../controllers/appointmentController");

const router = express.Router();

router.use(authMiddleware);
router.get("/", listAppointments);
router.post("/", checkPermission("create_appointment"), createAppointment);
router.patch("/:id/status", updateAppointmentStatus);

module.exports = router;
