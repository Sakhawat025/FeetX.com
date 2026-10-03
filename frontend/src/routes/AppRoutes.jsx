import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import RiderDashboard from "../pages/dashboard/RiderDashboard";
import CustomerDashboard from "../features/customer/CustomerDashboard";
import CustomerLayout from "../features/customer/CustomerLayout";
import Parcels from "../features/customer/Parcels";
import Notifications from "../features/customer/Notifications";
import History from "../features/customer/History";
import Profile from "../features/customer/Profile";
import Settings from "../features/customer/Settings";
import Tracking from "../features/customer/Tracking";
import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Admin Route */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Rider Route */}
        <Route
          path="/rider/dashboard"
          element={
            <ProtectedRoute allowedRoles={["RIDER"]}>
              <RiderDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Customer Route */}
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <CustomerLayout>
                <CustomerDashboard />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/parcels"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <CustomerLayout>
                <Parcels />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/notifications"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <CustomerLayout>
                <Notifications />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/history"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <CustomerLayout>
                <History />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/tracking"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <CustomerLayout>
                <Tracking />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/profile"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <CustomerLayout>
                <Profile />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/settings"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <CustomerLayout>
                <Settings />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
