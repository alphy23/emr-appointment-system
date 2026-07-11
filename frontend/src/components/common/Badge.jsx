const statusColors = {
  Scheduled: "bg-blue-100 text-blue-800",
  Arrived: "bg-yellow-100 text-yellow-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-gray-100 text-gray-600",
};

const Badge = ({ status }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || "bg-gray-100 text-gray-600"}`}>
    {status}
  </span>
);

export default Badge;