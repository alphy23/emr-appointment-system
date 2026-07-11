import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Badge from "../common/Badge";
import Button from "../common/Button";
import CancelModal from "./CancelModal";
import {
  markArrivedRequest,
  completeAppointmentRequest,
  cancelAppointmentRequest,
} from "../../api/appointment.api";

/**
 * Role-scoped action visibility mirrors the backend's RBAC rules exactly
 * (Step 7/8) — buttons that would just 403 anyway are hidden rather than
 * shown-then-rejected, for a cleaner UX. The backend remains the real
 * enforcement point regardless of what's rendered here.
 */
const AppointmentTable = ({ appointments, userRole, listQueryKey }) => {
  const [cancelTarget, setCancelTarget] = useState(null);
  const [actionError, setActionError] = useState("");
  const queryClient = useQueryClient();

  const invalidateList = () => queryClient.invalidateQueries({ queryKey: listQueryKey });

  const arriveMutation = useMutation({
    mutationFn: markArrivedRequest,
    onSuccess: invalidateList,
    onError: (err) => setActionError(err.response?.data?.message || "Failed to mark arrived."),
  });

  const completeMutation = useMutation({
    mutationFn: completeAppointmentRequest,
    onSuccess: invalidateList,
    onError: (err) => setActionError(err.response?.data?.message || "Failed to complete appointment."),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => cancelAppointmentRequest(id, reason),
    onSuccess: () => {
      invalidateList();
      setCancelTarget(null);
    },
    onError: (err) => setActionError(err.response?.data?.message || "Failed to cancel appointment."),
  });

  if (!appointments || appointments.length === 0) {
    return <p className="text-gray-500 text-sm">No appointments found.</p>;
  }

  return (
    <>
      {actionError && <p className="text-red-600 text-sm mb-3">{actionError}</p>}

      <div className="overflow-x-auto border border-gray-200 rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-2">Patient</th>
              <th className="px-4 py-2">Doctor</th>
              <th className="px-4 py-2">Department</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {appointments.map((appt) => (
              <tr key={appt._id}>
                <td className="px-4 py-2">
                  <div className="font-medium text-gray-800">{appt.patient?.name}</div>
                  <div className="text-gray-500">{appt.patient?.mobile}</div>
                </td>
                <td className="px-4 py-2">{appt.doctor?.name}</td>
                <td className="px-4 py-2">{appt.department}</td>
                <td className="px-4 py-2">{appt.date}</td>
                <td className="px-4 py-2">{appt.slotStartTime} – {appt.slotEndTime}</td>
                <td className="px-4 py-2"><Badge status={appt.status} /></td>
                <td className="px-4 py-2">
                  <div className="flex gap-2 flex-wrap">
                    {appt.status === "Scheduled" && userRole !== "doctor" && (
                      <Button
                        variant="secondary"
                        isLoading={arriveMutation.isPending}
                        onClick={() => arriveMutation.mutate(appt._id)}
                      >
                        Mark Arrived
                      </Button>
                    )}

                    {appt.status === "Arrived" && (userRole === "doctor" || userRole === "superadmin") && (
                      <Button
                        isLoading={completeMutation.isPending}
                        onClick={() => completeMutation.mutate(appt._id)}
                      >
                        Complete
                      </Button>
                    )}

                    {["Scheduled", "Arrived"].includes(appt.status) && userRole !== "doctor" && (
                      <Button variant="danger" onClick={() => setCancelTarget(appt._id)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CancelModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        isLoading={cancelMutation.isPending}
        onConfirm={(reason) => cancelMutation.mutate({ id: cancelTarget, reason })}
      />
    </>
  );
};

export default AppointmentTable;