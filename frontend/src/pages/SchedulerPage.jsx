import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSlotsRequest } from "../api/slot.api";
import { getDoctorsRequest } from "../api/doctor.api";
import DoctorSelect from "../components/scheduler/DoctorSelect";
import SlotGrid from "../components/scheduler/SlotGrid";
import Spinner from "../components/common/Spinner";
import BookingModal from "../components/booking/BookingModal";
import useSocket from "../hooks/useSocket";

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const SchedulerPage = () => {
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(getTodayStr());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const slotsQueryKey = ["slots", doctorId, date];

  const { data, isLoading, isError, error } = useQuery({
    queryKey: slotsQueryKey,
    queryFn: () => getSlotsRequest(doctorId, date),
    enabled: !!doctorId && !!date,
  });

  // Need the doctor's department for the booking payload — reuse the
  // already-cached doctor list rather than fetching it again
  const { data: doctorsData } = useQuery({
    queryKey: ["doctors"],
    queryFn: getDoctorsRequest,
    staleTime: 5 * 60 * 1000,
  });
  const selectedDoctor = doctorsData?.data?.find((d) => d._id === doctorId);

  useSocket({
    doctorId,
    date,
    onCreated: () => queryClient.invalidateQueries({ queryKey: slotsQueryKey }),
    onUpdated: () => queryClient.invalidateQueries({ queryKey: slotsQueryKey }),
    onCancelled: () => queryClient.invalidateQueries({ queryKey: slotsQueryKey }),
  });

  const handleDoctorChange = (id) => {
    setDoctorId(id);
    setSelectedSlot(null);
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
    setSelectedSlot(null);
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Appointment Scheduler</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <DoctorSelect value={doctorId} onChange={handleDoctorChange} />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            min={getTodayStr()}
            onChange={handleDateChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {!doctorId && <p className="text-gray-500 text-sm">Select a doctor and date to view slots.</p>}

      {doctorId && isLoading && <Spinner />}

      {doctorId && isError && (
        <p className="text-red-600 text-sm">
          {error?.response?.data?.message || "Failed to load slots."}
        </p>
      )}

      {doctorId && data && (
        <SlotGrid
          slots={data.data.slots}
          selectedSlot={selectedSlot}
          onSelectSlot={handleSelectSlot}
        />
      )}

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSlot(null);
        }}
        doctorId={doctorId}
        department={selectedDoctor?.department}
        date={date}
        slot={selectedSlot}
        slotsQueryKey={slotsQueryKey}
      />
    </div>
  );
};

export default SchedulerPage;