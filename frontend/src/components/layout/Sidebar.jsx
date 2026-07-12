import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Modal from "../common/Modal";
import Button from "../common/Button";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", roles: ["superadmin", "receptionist", "doctor"] },
  { label: "Scheduler", to: "/scheduler", roles: ["superadmin", "receptionist"] },
  { label: "Appointments", to: "/appointments", roles: ["superadmin", "receptionist", "doctor"] },
  { label: "Doctor Schedules", to: "/doctor-schedules", roles: ["superadmin"] },
  { label: "Audit Logs", to: "/audit-logs", roles: ["superadmin"] },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  return (
    <>
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
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </aside>

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Logout"
      >
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to logout? You'll need to sign in again to continue.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setIsLogoutModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" isLoading={isLoggingOut} onClick={handleConfirmLogout}>
            Logout
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default Sidebar;