import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SchedulerPage from "./pages/SchedulerPage";
import DoctorScheduleFormPage from "./pages/DoctorScheduleFormPage";
import AppointmentsPage from "./pages/AppointmentsPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>

            <Route
              path="/unauthorized"
              element={<div className="p-8">Not authorized.</div>}
            />
            <Route path="*" element={<Navigate to="/login" replace />} />

            <Route
              element={
                <ProtectedRoute allowedRoles={["superadmin", "receptionist"]} />
              }
            >
              <Route path="/scheduler" element={<SchedulerPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["superadmin"]} />}>
              <Route
                path="/doctor-schedules"
                element={<DoctorScheduleFormPage />}
              />
            </Route>
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["superadmin", "receptionist", "doctor"]}
                />
              }
            >
              <Route path="/appointments" element={<AppointmentsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
