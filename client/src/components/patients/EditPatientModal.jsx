import { useEffect, useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import ModalShell from "../ui/ModalShell";

const EditPatientModal = ({ patient, onClose, onSubmit, saving }) => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
  });
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    if (!patient) {
      return;
    }

    setFormData({
      name: patient.name || "",
      age: String(patient.age || ""),
      gender: patient.gender || "",
    });
  }, [patient]);

  if (!patient) {
    return null;
  }

  const updateFormValue = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const submitForm = async (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.age || !formData.gender.trim()) {
      setValidationMessage("Name, age, and gender are required.");
      return;
    }

    const parsedAge = Number(formData.age);
    if (Number.isNaN(parsedAge) || parsedAge <= 0) {
      setValidationMessage("Age should be a positive number.");
      return;
    }

    setValidationMessage("");

    try {
      await onSubmit(patient.id, {
        name: formData.name,
        age: parsedAge,
        gender: formData.gender,
      });
    } catch (_error) {
      // Parent surfaces API errors.
    }
  };

  return (
    <ModalShell className="max-w-xl p-5 md:p-7">
      <div className="mb-5 flex items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
        <div>
          <h2 className="font-['Sora'] text-2xl font-bold text-slate-800 dark:text-white">
            Edit Patient
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            Update patient profile details.
          </p>
        </div>
        <Button
          onClick={onClose}
          variant="secondary"
          className="px-3 py-1.5 text-sm"
        >
          Close
        </Button>
      </div>

      <form onSubmit={submitForm} className="space-y-4">
        <InputField
          label="Name"
          name="name"
          value={formData.name}
          onChange={updateFormValue}
          required
        />

        <InputField
          label="Age"
          name="age"
          type="number"
          value={formData.age}
          onChange={updateFormValue}
          required
        />

        <InputField
          label="Gender"
          name="gender"
          value={formData.gender}
          onChange={updateFormValue}
          required
        />

        {validationMessage && (
          <p className="text-sm font-medium text-red-600">
            {validationMessage}
          </p>
        )}

        <Button
          type="submit"
          loading={saving}
          className="w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Updating..." : "Save Changes"}
        </Button>
      </form>
    </ModalShell>
  );
};

const InputField = ({ label, type = "text", required = false, ...props }) => {
  return (
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label} {required ? <span className="text-red-500">*</span> : null}
      <Input type={type} {...props} />
    </label>
  );
};

export default EditPatientModal;
