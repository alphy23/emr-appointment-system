import Input from "../common/Input";
import Select from "../common/Select";
import DoctorSelect from "../scheduler/DoctorSelect";

const STATUS_OPTIONS = ["Scheduled", "Arrived", "Completed", "Cancelled"];

/**
 * doctorId filter is hidden for the "doctor" role — the backend already
 * forcibly scopes their results to their own appointments regardless of
 * what's sent, so showing the filter would be misleading (implying they
 * could see other doctors', which they can't).
 */
const AppointmentFilters = ({ filters, onChange, userRole }) => {
  const update = (field, value) => onChange({ ...filters, [field]: value, page: 1 });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Input
        label="Search (patient name / mobile)"
        value={filters.search}
        onChange={(e) => update("search", e.target.value)}
        placeholder="e.g. Ravi or 9876543210"
      />

      {userRole !== "doctor" && (
        <DoctorSelect value={filters.doctorId} onChange={(val) => update("doctorId", val)} />
      )}

      <Select
        label="Status"
        value={filters.status}
        onChange={(e) => update("status", e.target.value)}
      >
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </Select>

      <Input
        label="Department"
        value={filters.department}
        onChange={(e) => update("department", e.target.value)}
        placeholder="e.g. Cardiology"
      />

      <Input
        label="Date From"
        type="date"
        value={filters.dateFrom}
        onChange={(e) => update("dateFrom", e.target.value)}
      />

      <Input
        label="Date To"
        type="date"
        value={filters.dateTo}
        onChange={(e) => update("dateTo", e.target.value)}
      />
    </div>
  );
};

export default AppointmentFilters;