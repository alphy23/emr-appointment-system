import axiosClient from "./axiosClient";

export const createAppointmentRequest = (payload) =>
  axiosClient.post("/appointments", payload).then((res) => res.data);

export const listAppointmentsRequest = (params) =>
  axiosClient.get("/appointments", { params }).then((res) => res.data);

export const updateAppointmentRequest = (id, payload) =>
  axiosClient.put(`/appointments/${id}`, payload).then((res) => res.data);

export const markArrivedRequest = (id) =>
  axiosClient.post(`/appointments/${id}/arrive`).then((res) => res.data);

export const completeAppointmentRequest = (id) =>
  axiosClient.post(`/appointments/${id}/complete`).then((res) => res.data);

export const cancelAppointmentRequest = (id, reason) =>
  axiosClient.delete(`/appointments/${id}`, { data: { reason } }).then((res) => res.data);