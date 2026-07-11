import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Each item declares which roles can see it — single source of truth for
// both what's rendered here AND matches the ProtectedRoute roles already
// enforced on each actual route, so there's no mismatch between what's
// shown and what's actually accessible.
const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", roles: ["superadmin", "receptionist", "doctor"] },
  { label: "Scheduler", to: "/scheduler", roles: ["superadmin", "receptionist"] },
  { label: "Appointments", to: "/appointments", roles: ["superadmin", "receptionist", "doctor"] },
  { label: "Doctor Schedules", to: "/doctor-schedules", roles: ["superadmin"] },
  { label: "Audit Logs", to: "/audit-logs", roles: ["superadmin"] },
];

const Sidebar = () => {
  const { user, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-800">EMR System</h1>
        <p className="text-xs text-gray-500 mt-1">
          {user?.name} · <span className="capitalize">{user?.role}</span>
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;