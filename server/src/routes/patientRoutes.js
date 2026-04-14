const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { checkPermission } = require("../utils/permissions");
const {
  addPatientVisit,
  createPatient,
  listPatients,
  removePatient,
  savePrescription,
  updatePatientProfile,
} = require("../controllers/patientController");

const router = express.Router();

router.use(authMiddleware);
router.get("/", listPatients);
router.post("/", createPatient);
router.post("/:id/visit", checkPermission("edit_patient"), addPatientVisit);
router.post(
  "/:id/prescriptions",
  checkPermission("generate_prescription"),
  savePrescription,
);
router.put("/:id", checkPermission("edit_patient"), updatePatientProfile);
router.delete("/:id", checkPermission("delete_patient"), removePatient);

module.exports = router;
