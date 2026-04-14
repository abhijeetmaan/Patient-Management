import { useMemo, useState } from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";

const initialFormState = {
  name: "",
  age: "",
  gender: "",
  admissionDate: getLocalDateInputValue(new Date()),
  symptoms: "",
  diagnosis: "",
  medicines: "",
  notes: "",
};

const AddPatientForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [validationMessage, setValidationMessage] = useState("");

  const isFormInvalid = useMemo(() => {
    return (
      !formData.name.trim() ||
      !formData.age ||
      !formData.gender.trim() ||
      !formData.symptoms.trim() ||
      !formData.diagnosis.trim()
    );
  }, [formData]);

  const updateFormValue = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const submitForm = async (event) => {
    event.preventDefault();

    if (isFormInvalid) {
      setValidationMessage("Please fill all required fields.");
      return;
    }

    const age = Number(formData.age);
    if (Number.isNaN(age) || age <= 0) {
      setValidationMessage("Age should be a positive number.");
      return;
    }

    setValidationMessage("");

    try {
      await onSubmit({
        ...formData,
        age,
        medicines: formData.medicines,
      });

      setFormData(initialFormState);
    } catch (_error) {
      // Parent component already surfaces API errors.
    }
  };

  return (
    <Card className="p-6 transition-all duration-300 md:p-7">
      <div className="mb-6 border-b border-slate-100 pb-4 dark:border-slate-800">
        <h2 className="font-['Sora'] text-2xl font-bold text-slate-800 dark:text-white md:text-[1.65rem]">
          Add Patient
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
          Capture consultation details quickly.
        </p>
      </div>

      <form onSubmit={submitForm} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Name"
            name="name"
            value={formData.name}
            onChange={updateFormValue}
            required
          />
          <InputField
            label="Age"
            type="number"
            name="age"
            value={formData.age}
            onChange={updateFormValue}
            required
          />
        </div>

        <InputField
          label="Gender"
          name="gender"
          value={formData.gender}
          onChange={updateFormValue}
          required
        />

        <InputField
          label="Admission Date"
          type="date"
          name="admissionDate"
          value={formData.admissionDate}
          onChange={updateFormValue}
          required
        />

        <TextAreaField
          label="Symptoms"
          name="symptoms"
          value={formData.symptoms}
          onChange={updateFormValue}
          required
        />

        <TextAreaField
          label="Diagnosis"
          name="diagnosis"
          value={formData.diagnosis}
          onChange={updateFormValue}
          required
        />

        <InputField
          label="Medicines (comma separated)"
          name="medicines"
          value={formData.medicines}
          onChange={updateFormValue}
        />

        <TextAreaField
          label="Notes"
          name="notes"
          value={formData.notes}
          onChange={updateFormValue}
          rows={3}
        />

        {validationMessage && (
          <p className="text-sm font-medium text-red-600">
            {validationMessage}
          </p>
        )}

        <Button
          type="submit"
          loading={loading}
          className="w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : "Submit"}
        </Button>
      </form>
    </Card>
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

const TextAreaField = ({ label, rows = 2, required = false, ...props }) => {
  return (
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label} {required ? <span className="text-red-500">*</span> : null}
      <Textarea rows={rows} {...props} />
    </label>
  );
};

function getLocalDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default AddPatientForm;
