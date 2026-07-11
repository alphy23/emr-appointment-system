import axiosClient from "./axiosClient";

export const getDoctorsRequest = (department) =>
  axiosClient
    .get("/doctors", { params: department ? { department } : {} })
    .then((res) => res.data);