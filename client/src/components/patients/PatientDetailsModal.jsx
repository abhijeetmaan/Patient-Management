import { useMemo, useState } from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import ModalShell from "../ui/ModalShell";
import Textarea from "../ui/Textarea";
import VisitTimeline from "./VisitTimeline";

const initialVisitForm = {
  symptoms: "",
  diagnosis: "",
  medicines: "",
  notes: "",
};

const PatientDetailsModal = ({
  patient,
  onClose,
  onAddVisit,
  addingVisit,
  loadingPatient,
}) => {
  const [formData, setFormData] = useState(initialVisitForm);
  const [validationMessage, setValidationMessage] = useState("");

  const visits = useMemo(() => {
    if (!patient || !Array.isArray(patient.visits)) {
      return [];
    }

    return patient.visits;
  }, [patient]);

  if (!patient) {
    return null;
  }

  const updateForm = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const submitVisit = async (event) => {
    event.preventDefault();

    if (!formData.symptoms.trim() || !formData.diagnosis.trim()) {
      setValidationMessage("Symptoms and diagnosis are required.");
      return;
    }

    setValidationMessage("");

    try {
      await onAddVisit(patient.id, formData);
      setFormData(initialVisitForm);
    } catch (_error) {
      // Parent surfaces API errors.
    }
  };

  return (
    <ModalShell className="max-w-5xl p-5 md:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
        <div>
          <h2 className="font-['Sora'] text-2xl font-bold text-slate-800 dark:text-white">
            {patient.name} Timeline
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            {patient.age} years • {patient.gender}
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

      <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
        <section>
          <h3 className="mb-4 font-['Sora'] text-lg font-bold text-slate-800 dark:text-white">
            Visit Timeline
          </h3>

          <VisitTimeline visits={visits} loading={loadingPatient} />
        </section>

        <Card className="rounded-xl border-slate-200 bg-slate-50/80 p-4 md:p-5 dark:border-slate-700 dark:bg-slate-800/60">
          <h3 className="mb-4 font-['Sora'] text-lg font-bold text-slate-800 dark:text-white">
            Add New Visit
          </h3>

          <form className="space-y-3" onSubmit={submitVisit}>
            <TextAreaField
              label="Symptoms"
              name="symptoms"
              value={formData.symptoms}
              onChange={updateForm}
              required
            />

            <TextAreaField
              label="Diagnosis"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={updateForm}
              required
            />

            <InputField
              label="Medicines (comma separated)"
              name="medicines"
              value={formData.medicines}
              onChange={updateForm}
            />

            <TextAreaField
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={updateForm}
              rows={3}
            />

            {validationMessage && (
              <p className="text-sm font-medium text-red-600">
                {validationMessage}
              </p>
            )}

            <Button
              type="submit"
              loading={addingVisit}
              className="w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {addingVisit ? "Adding Visit..." : "Add Visit"}
            </Button>
          </form>
        </Card>
      </div>
    </ModalShell>
  );
};

const InputField = ({ label, required = false, ...props }) => {
  return (
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label} {required ? <span className="text-red-500">*</span> : null}
      <Input {...props} />
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

export default PatientDetailsModal;
