import axiosClient from "./axiosClient";

export const searchPatientsRequest = (query) =>
  axiosClient.get("/patients/search", { params: { query } }).then((res) => res.data);

export const createPatientRequest = (payload) =>
  axiosClient.post("/patients", payload).then((res) => res.data);