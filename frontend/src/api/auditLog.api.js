import axiosClient from "./axiosClient";

export const listAuditLogsRequest = (params) =>
  axiosClient.get("/audit-logs", { params }).then((res) => res.data);