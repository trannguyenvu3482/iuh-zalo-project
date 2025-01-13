import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import { ErrorPage, Login, Welcome } from "../pages";
import PrivateRoute from "./PrivateRoute";
const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        path: "/",
        element: (
          <PrivateRoute>
            <Welcome />
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
  {
    path: "/login",
    element: <Login />,
  },
]);

export default router;
