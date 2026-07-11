import axiosClient from "./axiosClient";

export const loginRequest = (credentials) =>
  axiosClient.post("/auth/login", credentials).then((res) => res.data);

export const logoutRequest = () =>
  axiosClient.post("/auth/logout").then((res) => res.data);

export const refreshRequest = () =>
  axiosClient.post("/auth/refresh").then((res) => res.data);

export const getMeRequest = () =>
  axiosClient.get("/auth/me").then((res) => res.data);