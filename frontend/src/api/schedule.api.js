import axiosClient from "./axiosClient";

export const getScheduleRequest = (doctorId) =>
  axiosClient.get(`/doctors/${doctorId}/schedule`).then((res) => res.data);

export const upsertScheduleRequest = (doctorId, payload) =>
  axiosClient.put(`/doctors/${doctorId}/schedule`, payload).then((res) => res.data);