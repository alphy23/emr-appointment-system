import axiosClient from "./axiosClient";

export const getSlotsRequest = (doctorId, date) =>
  axiosClient.get("/slots", { params: { doctorId, date } }).then((res) => res.data);