import { useState } from "react";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";

const CancelModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (reason.trim().length < 3) {
      setError("Please provide a reason (at least 3 characters).");
      return;
    }
    onConfirm(reason);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Appointment">
      <Input
        label="Reason for cancellation"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={error}
        placeholder="e.g. Patient requested reschedule"
      />
      <div className="flex gap-2 justify-end mt-4">
        <Button variant="secondary" onClick={onClose}>Back</Button>
        <Button variant="danger" onClick={handleConfirm} isLoading={isLoading}>
          Confirm Cancellation
        </Button>
      </div>
    </Modal>
  );
};

export default CancelModal;