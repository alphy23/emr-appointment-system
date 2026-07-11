import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DoctorSelect from "../components/scheduler/DoctorSelect";
import { getScheduleRequest, upsertScheduleRequest } from "../api/schedule.api";
import Button from "../components/common/Button";
import Spinner from "../components/common/Spinner";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const emptySession = { name: "", startTime: "", endTime: "" };
const emptyBreak = { startTime: "", endTime: "" };

const DoctorScheduleFormPage = () => {
  const [doctorId, setDoctorId] = useState("");
  const [workingDays, setWorkingDays] = useState([]);
  const [sessions, setSessions] = useState([{ ...emptySession }]);
  const [breaks, setBreaks] = useState([]);
  const [slotDuration, setSlotDuration] = useState(15);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const queryClient = useQueryClient();

  // Load existing schedule when a doctor is picked, so Super Admin edits
  // rather than accidentally overwriting with a blank form
  useQuery({
    queryKey: ["schedule", doctorId],
    queryFn: () => getScheduleRequest(doctorId),
    enabled: !!doctorId,
    retry: false,
    onSuccess: (res) => {
      const s = res.data;
      setWorkingDays(s.workingDays);
      setSessions(s.sessions);
      setBreaks(s.breaks);
      setSlotDuration(s.slotDuration);
    },
    onError: () => {
      // No schedule yet for this doctor — reset to a blank form
      setWorkingDays([]);
      setSessions([{ ...emptySession }]);
      setBreaks([]);
      setSlotDuration(15);
    },
  });

  const mutation = useMutation({
    mutationFn: (payload) => upsertScheduleRequest(doctorId, payload),
    onSuccess: () => {
      setSuccessMsg("Schedule saved successfully.");
      setFormError("");
      queryClient.invalidateQueries({ queryKey: ["schedule", doctorId] });
      queryClient.invalidateQueries({ queryKey: ["slots"] }); // affected slots may have changed
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || "Failed to save schedule.");
      setSuccessMsg("");
    },
  });

  const toggleDay = (day) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const updateSession = (index, field, value) => {
    setSessions((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const updateBreak = (index, field, value) => {
    setBreaks((prev) => prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");

    if (!doctorId) return setFormError("Select a doctor first.");
    if (workingDays.length === 0) return setFormError("Select at least one working day.");

    mutation.mutate({
      workingDays,
      sessions,
      breaks,
      slotDuration: Number(slotDuration),
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Doctor Schedule Management</h1>

      <DoctorSelect value={doctorId} onChange={setDoctorId} />

      {doctorId && (
        <form onSubmit={handleSubmit}>
          {formError && <p className="text-red-600 text-sm mb-4">{formError}</p>}
          {successMsg && <p className="text-green-600 text-sm mb-4">{successMsg}</p>}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Working Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  type="button"
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-md text-sm border ${
                    workingDays.includes(day)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Sessions</label>
              <button
                type="button"
                className="text-sm text-blue-600"
                onClick={() => setSessions((prev) => [...prev, { ...emptySession }])}
              >
                + Add Session
              </button>
            </div>
            {sessions.map((session, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <input
                  placeholder="Name (e.g. Morning)"
                  value={session.name}
                  onChange={(e) => updateSession(i, "name", e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                />
                <input
                  type="time"
                  value={session.startTime}
                  onChange={(e) => updateSession(i, "startTime", e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                />
                <input
                  type="time"
                  value={session.endTime}
                  onChange={(e) => updateSession(i, "endTime", e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                />
              </div>
            ))}
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Breaks</label>
              <button
                type="button"
                className="text-sm text-blue-600"
                onClick={() => setBreaks((prev) => [...prev, { ...emptyBreak }])}
              >
                + Add Break
              </button>
            </div>
            {breaks.map((brk, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="time"
                  value={brk.startTime}
                  onChange={(e) => updateBreak(i, "startTime", e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                />
                <input
                  type="time"
                  value={brk.endTime}
                  onChange={(e) => updateBreak(i, "endTime", e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                />
              </div>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Slot Duration (minutes)</label>
            <input
              type="number"
              min={5}
              max={120}
              value={slotDuration}
              onChange={(e) => setSlotDuration(e.target.value)}
              className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <Button type="submit" isLoading={mutation.isPending}>
            Save Schedule
          </Button>
        </form>
      )}
    </div>
  );
};

export default DoctorScheduleFormPage;