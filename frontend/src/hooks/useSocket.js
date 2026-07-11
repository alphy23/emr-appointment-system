import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { getAccessToken } from "../api/axiosClient";

/**
 * Joins a doctor+date room on the scheduler and invokes callbacks when
 * appointment events arrive. Automatically leaves the room and disconnects
 * on unmount or when doctorId/date changes — prevents stale room membership
 * and duplicate listeners.
 */
const useSocket = ({ doctorId, date, onCreated, onUpdated, onCancelled }) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!doctorId || !date) return;

    const token = getAccessToken();
    if (!token) return; // not authenticated yet — don't attempt connection

    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("scheduler:join", { doctorId, date });
    });

    if (onCreated) socket.on("appointment:created", onCreated);
    if (onUpdated) socket.on("appointment:updated", onUpdated);
    if (onCancelled) socket.on("appointment:cancelled", onCancelled);

    return () => {
      socket.emit("scheduler:leave", { doctorId, date });
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, date]);
};

export default useSocket;