import { Navigate } from "react-router-dom";
import { useUserStore } from "../zustand/userStore";

const PrivateRoute = ({ children }) => {
  // TODO: Change this later
  const { isAuthenticated } = useUserStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;
