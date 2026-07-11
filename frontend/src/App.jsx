import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SchedulerPage from "./pages/SchedulerPage";
import DoctorScheduleFormPage from "./pages/DoctorScheduleFormPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import AuditLogsPage from "./pages/AuditLogsPage"; // new — see below

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Any authenticated user, wrapped in the sidebar layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />

                <Route element={<ProtectedRoute allowedRoles={["superadmin", "receptionist"]} />}>
                  <Route path="/scheduler" element={<SchedulerPage />} />
                </Route>

                <Route
                  element={<ProtectedRoute allowedRoles={["superadmin", "receptionist", "doctor"]} />}
                >
                  <Route path="/appointments" element={<AppointmentsPage />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={["superadmin"]} />}>
                  <Route path="/doctor-schedules" element={<DoctorScheduleFormPage />} />
                  <Route path="/audit-logs" element={<AuditLogsPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="/unauthorized" element={<div className="p-8">Not authorized.</div>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;