import { useQuery } from "@tanstack/react-query";
import { getDoctorsRequest } from "../../api/doctor.api";
import Select from "../common/Select";

const DoctorSelect = ({ value, onChange }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["doctors"],
    queryFn: getDoctorsRequest,
    staleTime: 5 * 60 * 1000, // doctor list rarely changes — avoid refetching every mount
  });

  if (isError) return <p className="text-red-600 text-sm">Failed to load doctors</p>;

  return (
    <Select
      label="Doctor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={isLoading}
    >
      <option value="">{isLoading ? "Loading..." : "Select a doctor"}</option>
      {data?.data?.map((doc) => (
        <option key={doc._id} value={doc._id}>
          {doc.name} — {doc.department}
        </option>
      ))}
    </Select>
  );
};

export default DoctorSelect;