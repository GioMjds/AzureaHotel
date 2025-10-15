import "./App.css";
import { Suspense, lazy, useEffect, useMemo } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { useUserContext } from "./contexts/AuthContext";
import ProtectedRoute from "./contexts/ProtectedRoutes";

// Layout component
import Footer from "./layout/Footer";
import Navbar from "./layout/Navbar";

// Loading hydrate
const LoadingHydrate = lazy(() => import("./motions/loaders/LoadingHydrate"));

// Not found component
const NotFound = lazy(() => import("./pages/_NotFound"));

// Public pages
const Homepage = lazy(() => import("./pages/Homepage"));
const AvailabilityResults = lazy(() => import("./pages/AvailabilityResults"));
const ConfirmBooking = lazy(() => import("./pages/ConfirmBooking"));
const ConfirmVenueBooking = lazy(() => import("./pages/ConfirmVenueBooking"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const RegistrationFlow = lazy(() => import("./pages/RegistrationFlow"));
const RoomDetails = lazy(() => import("./pages/RoomDetails"));
const Rooms = lazy(() => import("./pages/Rooms"));
const Venue = lazy(() => import("./pages/Venue"));
const BookingAccepted = lazy(() => import("./motions/BookingAccepted"));

const BookingCalendar = lazy(() => import("./pages/BookingCalendar"));
const VenueBookingCalendar = lazy(() => import("./pages/VenueBookingCalendar"));
const VenueDetails = lazy(() => import("./pages/VenueDetails"));

const AdminLayout = lazy(() => import("./layout/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ManageAmenities = lazy(() => import("./pages/admin/ManageAmenities"));
const ManageAreas = lazy(() => import("./pages/admin/ManageAreas"));
const ManageBookings = lazy(() => import("./pages/admin/ManageBookings"));
const ManageRooms = lazy(() => import("./pages/admin/ManageRooms"));
const ManageUsers = lazy(() => import("./pages/admin/ManageUsers"));
const ArchivedUsers = lazy(() => import("./pages/admin/ArchivedUsers"));

const GuestProfile = lazy(() => import("./pages/guests/GuestProfile"));
const GuestBookings = lazy(() => import("./pages/guests/GuestBookings"));
const GuestCancellations = lazy(() => import("./pages/guests/GuestCancellations"));
const GuestLayout = lazy(() => import("./layout/guest/GuestLayout"));
const GuestFoodOrders = lazy(() => import("./pages/guests/GuestFoodOrders"));

const App = () => {
  const { isAuthenticated, role } = useUserContext();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const redirectPath = sessionStorage.getItem('redirectAfterReload');
    if (redirectPath) {
      sessionStorage.removeItem('redirectAfterReload');
      navigate(redirectPath);
    }
  }, [navigate]);

  const isAdminRoute = useMemo(() => {
    const adminPaths = ['/admin', '/guest', '/registration', '/forgot-password', '/booking-accepted'];
    return adminPaths.some(path => location.pathname.startsWith(path));
  }, [location.pathname]);

  const homepageRoute = useMemo(() => {
    if (isAuthenticated && role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Homepage />;
  }, [isAuthenticated, role]);

  return (
    <>
      <Suspense fallback={<LoadingHydrate />}>
        {!isAdminRoute && <Navbar />}
        <ScrollToTop />
        <Routes>
          <Route path="/" element={homepageRoute} />

          <Route path="/confirm-booking" element={<ConfirmBooking />} />
          <Route path="/confirm-area-booking" element={<ConfirmVenueBooking />} />
          <Route path="/registration" element={<RegistrationFlow />} />
          <Route path="/booking-accepted" element={<BookingAccepted />} />

          <Route path="/areas" element={<Venue />} />
          <Route path="/areas/:id" element={<VenueDetails />} />
          <Route path="/area-booking/:areaId" element={<VenueBookingCalendar />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:id" element={<RoomDetails />} />
          <Route path="/booking/:roomId" element={<BookingCalendar />} />
          <Route path="/availability" element={<AvailabilityResults />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected guest routes */}
          <Route element={<ProtectedRoute requiredRole="guest" />}>
            <Route path="/guest" element={<GuestLayout />}>
              <Route path=":id" element={<GuestProfile />} />
              <Route path="bookings" element={<GuestBookings />} />
              <Route path="cancellations" element={<GuestCancellations />} />
              <Route path="food-orders" element={<GuestFoodOrders />} />
            </Route>
          </Route>

          {/* Protected admin routes */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="bookings" element={<ManageBookings />} />
              <Route path="areas" element={<ManageAreas />} />
              <Route path="rooms" element={<ManageRooms />} />
              <Route path="amenities" element={<ManageAmenities />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="archive" element={<ArchivedUsers />} /> 
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        {!isAdminRoute && <Footer />}
      </Suspense>
    </>
  );
};

export default App;