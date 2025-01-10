import Login from "../pages/Login";
import { useUserStore } from "../zustand/userStore";

const PrivateRoute = ({ children }) => {
  // TODO: Change this later
  const { isAuthenticated } = useUserStore();

  if (!isAuthenticated) {
    return <Login />;
  }

  return children;
};

export default PrivateRoute;
