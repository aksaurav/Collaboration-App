import { createContext, useEffect, useState, useContext } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Only connect if the user is logged in
    if (user) {
      // Use your RENDER URL here (no /api suffix for sockets)
      const newSocket = io("https://collaboration-app-y7d5.onrender.com", {
        withCredentials: true,
        query: { userId: user._id },
        transports: ["websocket", "polling"], // Add this line
      });

      setSocket(newSocket);

      return () => newSocket.close();
    } else {
      // If user logs out, disconnect the socket
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
