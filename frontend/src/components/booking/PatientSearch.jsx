import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchPatientsRequest } from "../../api/patient.api";
import Input from "../common/Input";

const useDebouncedValue = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

const PatientSearch = ({ onSelectPatient, selectedPatient }) => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);

  const { data, isFetching } = useQuery({
    queryKey: ["patientSearch", debouncedQuery],
    queryFn: () => searchPatientsRequest(debouncedQuery),
    enabled: debouncedQuery.trim().length > 1, // avoid firing on 0-1 char queries
  });

  if (selectedPatient) {
    return (
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex justify-between items-center">
        <div>
          <p className="font-medium text-gray-800">{selectedPatient.name}</p>
          <p className="text-sm text-gray-500">{selectedPatient.mobile}</p>
        </div>
        <button
          type="button"
          className="text-sm text-blue-600"
          onClick={() => onSelectPatient(null)}
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <Input
        label="Search existing patient (name, mobile, or ID)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. Ravi or 9876543210"
      />

      {isFetching && <p className="text-sm text-gray-400">Searching...</p>}

      {!isFetching && data?.data?.length > 0 && (
        <ul className="border border-gray-200 rounded-md divide-y divide-gray-100 max-h-48 overflow-y-auto">
          {data.data.map((patient) => (
            <li
              key={patient._id}
              onClick={() => onSelectPatient(patient)}
              className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex justify-between"
            >
              <span>{patient.name}</span>
              <span className="text-gray-500 text-sm">{patient.mobile}</span>
            </li>
          ))}
        </ul>
      )}

      {!isFetching && debouncedQuery.trim().length > 1 && data?.data?.length === 0 && (
        <p className="text-sm text-gray-500">No matches — you can register a new patient below.</p>
      )}
    </div>
  );
};

export default PatientSearch;