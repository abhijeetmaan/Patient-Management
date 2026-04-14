const JWT_SECRET = process.env.JWT_SECRET || "pm_dev_secret_change_me";
const JWT_EXPIRES_IN = "1d";

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
};
