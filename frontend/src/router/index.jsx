import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Chats from "../pages/Chats";
import PrivateRoute from "./PrivateRoute";
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <h1>Error</h1>,
    children: [
      {
        index: true,
        path: "/",
        element: (
          <PrivateRoute>
            <Chats />
          </PrivateRoute>
        ),
      },
      //   {
      //     path: "/register",
      //     element: <Register />,
      //   },
      //   {
      //     path: "/dashboard",
      //     element: <Dashboard />,
      //   },
    ],
  },
]);

export default router;
