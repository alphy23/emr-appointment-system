import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import PatientSearch from "./PatientSearch";
import { createAppointmentRequest } from "../../api/appointment.api";

const newPatientSchema = z.object({
  name: z.string().min(2, "Name is required"),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be 10 digits"),
  age: z.coerce.number().int().min(0).optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
});

const purposeSchema = z.object({
  purpose: z.string().min(2, "Purpose is required"),
});

const BookingModal = ({ isOpen, onClose, doctorId, department, date, slot, slotsQueryKey }) => {
  const [mode, setMode] = useState("existing"); // "existing" | "new"
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [serverError, setServerError] = useState("");
  const queryClient = useQueryClient();

  const {
    register: registerNewPatient,
    handleSubmit: handleNewPatientSubmit,
    formState: { errors: newPatientErrors },
    reset: resetNewPatientForm,
  } = useForm({ resolver: zodResolver(newPatientSchema) });

  const {
    register: registerPurpose,
    handleSubmit: handlePurposeSubmit,
    formState: { errors: purposeErrors },
    reset: resetPurposeForm,
  } = useForm({ resolver: zodResolver(purposeSchema) });

  const mutation = useMutation({
    mutationFn: createAppointmentRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slotsQueryKey });
      handleClose();
    },
    onError: (err) => {
      setServerError(err.response?.data?.message || "Failed to book appointment.");
    },
  });

  const handleClose = () => {
    setSelectedPatient(null);
    setMode("existing");
    setServerError("");
    resetNewPatientForm();
    resetPurposeForm();
    onClose();
  };

  const submitBooking = (purposeData, newPatientData = null) => {
    setServerError("");

    const basePayload = {
      doctorId,
      department,
      date,
      slotStartTime: slot.startTime,
      slotEndTime: slot.endTime,
      purpose: purposeData.purpose,
    };

    if (newPatientData) {
      mutation.mutate({ ...basePayload, newPatient: newPatientData });
    } else {
      if (!selectedPatient) {
        setServerError("Please select a patient first.");
        return;
      }
      mutation.mutate({ ...basePayload, patientId: selectedPatient._id });
    }
  };

  // For "existing patient" mode: purpose form submits directly, using selectedPatient
  const onExistingSubmit = (purposeData) => submitBooking(purposeData);

  // For "new patient" mode: both forms must be valid together — we merge them here
  const [pendingPurpose, setPendingPurpose] = useState(null);
  const onNewPatientCollected = (newPatientData) => {
    if (!pendingPurpose) {
      setServerError("Please fill in the purpose field above first.");
      return;
    }
    submitBooking(pendingPurpose, newPatientData);
  };
  const onPurposeCollectedForNewMode = (purposeData) => setPendingPurpose(purposeData);

  if (!slot) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Book Appointment">
      <div className="mb-4 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
        <p><strong>Date:</strong> {date}</p>
        <p><strong>Time:</strong> {slot.startTime} – {slot.endTime}</p>
        <p><strong>Department:</strong> {department}</p>
      </div>

      {serverError && <p className="text-red-600 text-sm mb-4">{serverError}</p>}

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode("existing")}
          className={`flex-1 py-2 rounded-md text-sm font-medium ${
            mode === "existing" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          Existing Patient
        </button>
        <button
          type="button"
          onClick={() => setMode("new")}
          className={`flex-1 py-2 rounded-md text-sm font-medium ${
            mode === "new" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          New Patient
        </button>
      </div>

      {mode === "existing" && (
        <form onSubmit={handlePurposeSubmit(onExistingSubmit)}>
          <PatientSearch onSelectPatient={setSelectedPatient} selectedPatient={selectedPatient} />

          <Input
            label="Purpose of visit"
            {...registerPurpose("purpose")}
            error={purposeErrors.purpose?.message}
            placeholder="e.g. Follow-up consultation"
          />

          <Button type="submit" isLoading={mutation.isPending} className="w-full mt-2">
            Confirm Booking
          </Button>
        </form>
      )}

      {mode === "new" && (
        <div>
          <form onSubmit={handlePurposeSubmit(onPurposeCollectedForNewMode)} className="mb-4">
            <Input
              label="Purpose of visit"
              {...registerPurpose("purpose")}
              error={purposeErrors.purpose?.message}
              placeholder="e.g. First consultation"
            />
            <button type="submit" className="text-sm text-blue-600">
              {pendingPurpose ? "✓ Purpose saved — fill patient details below" : "Save purpose, then continue"}
            </button>
          </form>

          <form onSubmit={handleNewPatientSubmit(onNewPatientCollected)}>
            <Input
              label="Full Name"
              {...registerNewPatient("name")}
              error={newPatientErrors.name?.message}
            />
            <Input
              label="Mobile Number"
              {...registerNewPatient("mobile")}
              error={newPatientErrors.mobile?.message}
              placeholder="10-digit number"
            />
            <Input
              label="Age (optional)"
              type="number"
              {...registerNewPatient("age")}
              error={newPatientErrors.age?.message}
            />

            <Button type="submit" isLoading={mutation.isPending} className="w-full mt-2">
              Register &amp; Book Appointment
            </Button>
          </form>
        </div>
      )}
    </Modal>
  );
};

export default BookingModal;