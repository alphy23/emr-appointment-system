import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAuditLogsRequest } from "../api/auditLog.api";
import Pagination from "../components/common/Pagination";
import Spinner from "../components/common/Spinner";
import Select from "../components/common/Select";

const ACTIONS = [
  "LOGIN",
  "APPOINTMENT_CREATED",
  "APPOINTMENT_UPDATED",
  "APPOINTMENT_ARRIVED",
  "APPOINTMENT_COMPLETED",
  "APPOINTMENT_CANCELLED",
];

const AuditLogsPage = () => {
  const [filters, setFilters] = useState({ action: "", role: "", page: 1, limit: 20 });

  const queryParams = {
    ...(filters.action && { action: filters.action }),
    ...(filters.role && { role: filters.role }),
    page: filters.page,
    limit: filters.limit,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["auditLogs", queryParams],
    queryFn: () => listAuditLogsRequest(queryParams),
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Audit Trail</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 max-w-xl">
        <Select
          label="Action"
          value={filters.action}
          onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value, page: 1 }))}
        >
          <option value="">All actions</option>
          {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </Select>

        <Select
          label="Role"
          value={filters.role}
          onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value, page: 1 }))}
        >
          <option value="">All roles</option>
          <option value="superadmin">Super Admin</option>
          <option value="receptionist">Receptionist</option>
          <option value="doctor">Doctor</option>
        </Select>
      </div>

      {isLoading && <Spinner />}
      {isError && <p className="text-red-600 text-sm">Failed to load audit logs.</p>}

      {data && (
        <>
          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">Entity</th>
                  <th className="px-4 py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((log) => (
                  <tr key={log._id}>
                    <td className="px-4 py-2">{log.user?.name || "—"}</td>
                    <td className="px-4 py-2 capitalize">{log.role}</td>
                    <td className="px-4 py-2">{log.action}</td>
                    <td className="px-4 py-2">{log.entity}</td>
                    <td className="px-4 py-2">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

export default AuditLogsPage;