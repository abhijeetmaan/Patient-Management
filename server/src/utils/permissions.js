const ROLE_PERMISSIONS = {
  admin: {
    view_all_patients: true,
    edit_patient: true,
    delete_patient: true,
    generate_prescription: true,
    create_appointment: true,
  },
  doctor: {
    view_all_patients: false,
    edit_patient: true,
    delete_patient: false,
    generate_prescription: true,
    create_appointment: true,
  },
};

const getPermissionsForRole = (role) => {
  const basePermissions = ROLE_PERMISSIONS[String(role || "").toLowerCase()];
  if (!basePermissions) {
    return {
      view_all_patients: false,
      edit_patient: false,
      delete_patient: false,
      generate_prescription: false,
      create_appointment: false,
    };
  }

  return { ...basePermissions };
};

const normalizePermissions = (permissions, role) => {
  const defaultPermissions = getPermissionsForRole(role);
  const normalizedRole = String(role || "").toLowerCase();
  const sourcePermissions =
    permissions && typeof permissions === "object" ? permissions : {};

  const shouldForcePrescriptionPermission =
    normalizedRole === "admin" || normalizedRole === "doctor";

  return {
    view_all_patients: Boolean(
      sourcePermissions.view_all_patients ??
      defaultPermissions.view_all_patients,
    ),
    edit_patient: Boolean(
      sourcePermissions.edit_patient ?? defaultPermissions.edit_patient,
    ),
    delete_patient: Boolean(
      sourcePermissions.delete_patient ?? defaultPermissions.delete_patient,
    ),
    generate_prescription: shouldForcePrescriptionPermission
      ? true
      : Boolean(
          sourcePermissions.generate_prescription ??
          defaultPermissions.generate_prescription,
        ),
    create_appointment: Boolean(
      sourcePermissions.create_appointment ??
      defaultPermissions.create_appointment,
    ),
  };
};

const hasPermission = (doctor, permission) => {
  if (!doctor) {
    return false;
  }

  if (String(doctor.role || "").toLowerCase() === "admin") {
    return true;
  }

  const permissions = normalizePermissions(doctor.permissions, doctor.role);
  return Boolean(permissions[permission]);
};

const checkPermission = (permission) => (req, res, next) => {
  if (hasPermission(req.user, permission)) {
    return next();
  }

  return res.status(403).json({ message: "Access Denied" });
};

module.exports = {
  ROLE_PERMISSIONS,
  getPermissionsForRole,
  normalizePermissions,
  hasPermission,
  checkPermission,
};
