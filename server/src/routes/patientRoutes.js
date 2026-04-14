const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
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
router.post("/", createPatient);
router.get("/", listPatients);
router.post("/:id/visit", addPatientVisit);
router.post("/:id/prescriptions", savePrescription);
router.put("/:id", updatePatientProfile);
router.delete("/:id", removePatient);

module.exports = router;
