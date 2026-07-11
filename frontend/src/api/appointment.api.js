import axiosClient from "./axiosClient";

export const createAppointmentRequest = (payload) =>
  axiosClient.post("/appointments", payload).then((res) => res.data);