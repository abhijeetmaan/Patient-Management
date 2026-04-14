const express = require("express");
const { loginDoctor } = require("../controllers/authController");

const router = express.Router();

router.post("/login", loginDoctor);

module.exports = router;
