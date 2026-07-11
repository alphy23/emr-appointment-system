import { useState, useEffect  } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { listAppointmentsRequest } from "../api/appointment.api";
import AppointmentFilters from "../components/appointments/AppointmentFilters";
import AppointmentTable from "../components/appointments/AppointmentTable";
import Pagination from "../components/common/Pagination";
import Spinner from "../components/common/Spinner";
import useDebouncedValue from "../hooks/useDebouncedValue";

const DEFAULT_FILTERS = {
  search: "",
  doctorId: "",
  status: "",
  department: "",
  dateFrom: "",
  dateTo: "",
  page: 1,
  limit: 10,
};

const AppointmentsPage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.search, 400);

  // Only send params that are actually set — avoids sending empty strings
  // that could otherwise unintentionally match "everything with empty field"
  // depending on backend query building (ours ignores empties, but this is
  // good hygiene regardless, and keeps the query key clean for caching).
  const queryParams = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(filters.doctorId && { doctorId: filters.doctorId }),
    ...(filters.status && { status: filters.status }),
    ...(filters.department && { department: filters.department }),
    ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
    ...(filters.dateTo && { dateTo: filters.dateTo }),
    page: filters.page,
    limit: filters.limit,
  };

  const listQueryKey = ["appointments", queryParams];

  const { data, isLoading, isError, error } = useQuery({
    queryKey: listQueryKey,
    queryFn: () => listAppointmentsRequest(queryParams),
    keepPreviousData: true, // avoids a flash of "no results" while changing pages/filters
  });

  useEffect(() => {
  if (data?.meta && filters.page > data.meta.totalPages && data.meta.totalPages > 0) {
    setFilters((prev) => ({ ...prev, page: data.meta.totalPages }));
  }
}, [data, filters.page]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Appointments</h1>

      <AppointmentFilters filters={filters} onChange={setFilters} userRole={user?.role} />

      {isLoading && <Spinner />}

      {isError && (
        <p className="text-red-600 text-sm">
          {error?.response?.data?.message || "Failed to load appointments."}
        </p>
      )}

      {data && (
        <>
          <AppointmentTable
            appointments={data.data}
            userRole={user?.role}
            listQueryKey={listQueryKey}
          />
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          />
        </>
      )}
    </div>
  );
};

export default AppointmentsPage;