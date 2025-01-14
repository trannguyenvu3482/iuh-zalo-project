import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import { ErrorPage, Login, Welcome } from "../pages";
import ChatsTest from "../pages/ChatsTest";
import PrivateRoute from "./PrivateRoute";
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <PrivateRoute>
        <MainLayout />
      </PrivateRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        path: "/",
        element: <Welcome />,
      },
      {
        path: "/chat/:id",
        element: <ChatsTest />,
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
