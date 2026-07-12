import { useAuth } from "../context/AuthContext";

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-gray-800">
        Welcome, {user?.name} <span className="text-gray-500 font-normal">({user?.role})</span>
      </h1>
    </div>
  );
};

export default DashboardPage;