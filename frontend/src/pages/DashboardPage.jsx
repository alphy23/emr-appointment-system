import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";

const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Welcome, {user?.name} ({user?.role})</h1>
      <Button variant="secondary" onClick={logout} className="mt-4">
        Logout
      </Button>
    </div>
  );
};

export default DashboardPage;