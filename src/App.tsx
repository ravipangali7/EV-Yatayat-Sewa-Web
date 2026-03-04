import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, createRoutesFromElements, Navigate, Route, RouterProvider, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useWalkieTalkie } from "@/contexts/WalkieTalkieContext";
import { GoogleMapsProvider } from "@/contexts/GoogleMapsContext";
import { WalkieTalkieProvider } from "@/contexts/WalkieTalkieContext";
import { WalkieTalkieFab } from "@/components/walkietalkie/WalkieTalkieFab";
import { WalkieTalkieDrawer } from "@/components/walkietalkie/WalkieTalkieDrawer";
import { useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import PageBySlug from "./pages/PageBySlug";
import BlogList from "./pages/BlogList";
import BlogPost from "./pages/BlogPost";
import Dashboard from "./pages/app/Dashboard";
import Users from "./pages/app/Users";
import UserForm from "./pages/app/UserForm";
import UserView from "./pages/app/UserView";
import Wallets from "./pages/app/Wallets";
import WalletForm from "./pages/app/WalletForm";
import WalletView from "./pages/app/WalletView";
import Transactions from "./pages/app/Transactions";
import TransactionForm from "./pages/app/TransactionForm";
import TransactionView from "./pages/app/TransactionView";
import Settings from "./pages/app/Settings";
import Places from "./pages/app/Places";
import PlaceForm from "./pages/app/PlaceForm";
import PlaceView from "./pages/app/PlaceView";
import Routes_ from "./pages/app/Routes";
import RouteForm from "./pages/app/RouteForm";
import RouteView from "./pages/app/RouteView";
import Vehicles from "./pages/app/Vehicles";
import VehicleForm from "./pages/app/VehicleForm";
import VehicleView from "./pages/app/VehicleView";
import SeatBookings from "./pages/app/SeatBookings";
import SeatBookingForm from "./pages/app/SeatBookingForm";
import SeatBookingView from "./pages/app/SeatBookingView";
import Trips from "./pages/app/Trips";
import TripView from "./pages/app/TripView";
import Locations from "./pages/app/Locations";
import VehicleSchedules from "./pages/app/VehicleSchedules";
import VehicleScheduleForm from "./pages/app/VehicleScheduleForm";
import VehicleScheduleView from "./pages/app/VehicleScheduleView";
import VehicleTicketBookings from "./pages/app/VehicleTicketBookings";
import VehicleTicketBookingForm from "./pages/app/VehicleTicketBookingForm";
import VehicleTicketBookingView from "./pages/app/VehicleTicketBookingView";
import Cards from "./pages/app/Cards";
import CardForm from "./pages/app/CardForm";
import CardView from "./pages/app/CardView";
// Website (admin)
import Sliders from "./pages/app/website/Sliders";
import SliderForm from "./pages/app/website/SliderForm";
import CmsPages from "./pages/app/website/CmsPages";
import CmsPageForm from "./pages/app/website/CmsPageForm";
import TeamList from "./pages/app/website/TeamList";
import TeamForm from "./pages/app/website/TeamForm";
import Testimonials from "./pages/app/website/Testimonials";
import TestimonialForm from "./pages/app/website/TestimonialForm";
import Services from "./pages/app/website/Services";
import ServiceForm from "./pages/app/website/ServiceForm";
import Faqs from "./pages/app/website/Faqs";
import FaqForm from "./pages/app/website/FaqForm";
import ContactMessages from "./pages/app/website/ContactMessages";
import ContactMessageView from "./pages/app/website/ContactMessageView";
import ContactMessageEdit from "./pages/app/website/ContactMessageEdit";
import Blogs from "./pages/app/website/Blogs";
import BlogForm from "./pages/app/website/BlogForm";
import SiteSettingForm from "./pages/app/website/SiteSettingForm";

// App (driver/user) pages
import AppLogin from "./pages/app/AppLogin";
import AppRegister from "./pages/app/AppRegister";
import AppForgotPassword from "./pages/app/AppForgotPassword";
import AppResetPassword from "./pages/app/AppResetPassword";
import AppRoleLayout from "./pages/app/AppRoleLayout";
import PaymentCallbackPage from "./pages/app/PaymentCallbackPage";
import { getAppRoles, getAppRoleConfig, getHomePathForUser } from "@/config/appRoles";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.is_superuser) {
    return <Navigate to={getHomePathForUser(user)} replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function AppProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/app/login" replace />;
  }

  return <>{children}</>;
}

function AppLoginRoute() {
  const { user, isAuthenticated } = useAuth();
  if (isAuthenticated && user) {
    return <Navigate to={getHomePathForUser(user)} replace />;
  }
  return <AppLogin />;
}

function AppRoutesWithWalkieTalkie() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { groups } = useWalkieTalkie();
  const pathOk =
    (location.pathname.startsWith("/admin") || location.pathname.startsWith("/app")) &&
    !location.pathname.includes("/app/login");
  const canUseWalkieTalkie = !!user?.is_driver || groups.length > 0;
  const showFab = isAuthenticated && pathOk && canUseWalkieTalkie;

  return (
    <>
      <AppRoutes />
      {showFab && (
        <>
          <WalkieTalkieFab />
          <WalkieTalkieDrawer />
        </>
      )}
    </>
  );
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/page/:slug" element={<PageBySlug />} />
      <Route path="/blog" element={<BlogList />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route 
        path="/login" 
        element={isAuthenticated && user ? <Navigate to={getHomePathForUser(user)} replace /> : <Login />} 
      />
      
      {/* Admin Dashboard Routes */}
      <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      
      {/* Users */}
      <Route path="/admin/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/admin/users/add" element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
      <Route path="/admin/users/:id" element={<ProtectedRoute><UserView /></ProtectedRoute>} />
      <Route path="/admin/users/:id/edit" element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
      
      {/* Wallets */}
      <Route path="/admin/wallets" element={<ProtectedRoute><Wallets /></ProtectedRoute>} />
      <Route path="/admin/wallets/add" element={<ProtectedRoute><WalletForm /></ProtectedRoute>} />
      <Route path="/admin/wallets/:id" element={<ProtectedRoute><WalletView /></ProtectedRoute>} />
      <Route path="/admin/wallets/:id/edit" element={<ProtectedRoute><WalletForm /></ProtectedRoute>} />

      {/* Cards */}
      <Route path="/admin/cards" element={<ProtectedRoute><Cards /></ProtectedRoute>} />
      <Route path="/admin/cards/add" element={<ProtectedRoute><CardForm /></ProtectedRoute>} />
      <Route path="/admin/cards/:id" element={<ProtectedRoute><CardView /></ProtectedRoute>} />
      <Route path="/admin/cards/:id/edit" element={<ProtectedRoute><CardForm /></ProtectedRoute>} />
      
      {/* Transactions */}
      <Route path="/admin/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      <Route path="/admin/transactions/:id" element={<ProtectedRoute><TransactionView /></ProtectedRoute>} />
      <Route path="/admin/transactions/:id/edit" element={<ProtectedRoute><TransactionForm /></ProtectedRoute>} />
      
      {/* Settings */}
      <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      
      {/* Places */}
      <Route path="/admin/places" element={<ProtectedRoute><Places /></ProtectedRoute>} />
      <Route path="/admin/places/add" element={<ProtectedRoute><PlaceForm /></ProtectedRoute>} />
      <Route path="/admin/places/:id" element={<ProtectedRoute><PlaceView /></ProtectedRoute>} />
      <Route path="/admin/places/:id/edit" element={<ProtectedRoute><PlaceForm /></ProtectedRoute>} />
      
      {/* Routes */}
      <Route path="/admin/routes" element={<ProtectedRoute><Routes_ /></ProtectedRoute>} />
      <Route path="/admin/routes/add" element={<ProtectedRoute><RouteForm /></ProtectedRoute>} />
      <Route path="/admin/routes/:id" element={<ProtectedRoute><RouteView /></ProtectedRoute>} />
      <Route path="/admin/routes/:id/edit" element={<ProtectedRoute><RouteForm /></ProtectedRoute>} />
      
      {/* Vehicles */}
      <Route path="/admin/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
      <Route path="/admin/vehicles/add" element={<ProtectedRoute><VehicleForm /></ProtectedRoute>} />
      <Route path="/admin/vehicles/:id" element={<ProtectedRoute><VehicleView /></ProtectedRoute>} />
      <Route path="/admin/vehicles/:id/edit" element={<ProtectedRoute><VehicleForm /></ProtectedRoute>} />
      
      {/* Seat Bookings */}
      <Route path="/admin/seat-bookings" element={<ProtectedRoute><SeatBookings /></ProtectedRoute>} />
      <Route path="/admin/seat-bookings/add" element={<ProtectedRoute><SeatBookingForm /></ProtectedRoute>} />
      <Route path="/admin/seat-bookings/:id" element={<ProtectedRoute><SeatBookingView /></ProtectedRoute>} />
      <Route path="/admin/seat-bookings/:id/edit" element={<ProtectedRoute><SeatBookingForm /></ProtectedRoute>} />

      {/* Trips */}
      <Route path="/admin/trips" element={<ProtectedRoute><Trips /></ProtectedRoute>} />
      <Route path="/admin/trips/:id" element={<ProtectedRoute><TripView /></ProtectedRoute>} />

      {/* Locations */}
      <Route path="/admin/locations" element={<ProtectedRoute><Locations /></ProtectedRoute>} />

      {/* Vehicle Schedules */}
      <Route path="/admin/vehicle-schedules" element={<ProtectedRoute><VehicleSchedules /></ProtectedRoute>} />
      <Route path="/admin/vehicle-schedules/add" element={<ProtectedRoute><VehicleScheduleForm /></ProtectedRoute>} />
      <Route path="/admin/vehicle-schedules/:id" element={<ProtectedRoute><VehicleScheduleView /></ProtectedRoute>} />
      <Route path="/admin/vehicle-schedules/:id/edit" element={<ProtectedRoute><VehicleScheduleForm /></ProtectedRoute>} />

      {/* Vehicle Ticket Bookings */}
      <Route path="/admin/vehicle-ticket-bookings" element={<ProtectedRoute><VehicleTicketBookings /></ProtectedRoute>} />
      <Route path="/admin/vehicle-ticket-bookings/add" element={<ProtectedRoute><VehicleTicketBookingForm /></ProtectedRoute>} />
      <Route path="/admin/vehicle-ticket-bookings/:id" element={<ProtectedRoute><VehicleTicketBookingView /></ProtectedRoute>} />
      <Route path="/admin/vehicle-ticket-bookings/:id/edit" element={<ProtectedRoute><VehicleTicketBookingForm /></ProtectedRoute>} />

      {/* Website */}
      <Route path="/admin/website/sliders" element={<ProtectedRoute><Sliders /></ProtectedRoute>} />
      <Route path="/admin/website/sliders/add" element={<ProtectedRoute><SliderForm /></ProtectedRoute>} />
      <Route path="/admin/website/sliders/:id" element={<ProtectedRoute><SliderForm /></ProtectedRoute>} />
      <Route path="/admin/website/sliders/:id/edit" element={<ProtectedRoute><SliderForm /></ProtectedRoute>} />
      <Route path="/admin/website/cms-pages" element={<ProtectedRoute><CmsPages /></ProtectedRoute>} />
      <Route path="/admin/website/cms-pages/add" element={<ProtectedRoute><CmsPageForm /></ProtectedRoute>} />
      <Route path="/admin/website/cms-pages/:id" element={<ProtectedRoute><CmsPageForm /></ProtectedRoute>} />
      <Route path="/admin/website/cms-pages/:id/edit" element={<ProtectedRoute><CmsPageForm /></ProtectedRoute>} />
      <Route path="/admin/website/team" element={<ProtectedRoute><TeamList /></ProtectedRoute>} />
      <Route path="/admin/website/team/add" element={<ProtectedRoute><TeamForm /></ProtectedRoute>} />
      <Route path="/admin/website/team/:id" element={<ProtectedRoute><TeamForm /></ProtectedRoute>} />
      <Route path="/admin/website/team/:id/edit" element={<ProtectedRoute><TeamForm /></ProtectedRoute>} />
      <Route path="/admin/website/testimonials" element={<ProtectedRoute><Testimonials /></ProtectedRoute>} />
      <Route path="/admin/website/testimonials/add" element={<ProtectedRoute><TestimonialForm /></ProtectedRoute>} />
      <Route path="/admin/website/testimonials/:id" element={<ProtectedRoute><TestimonialForm /></ProtectedRoute>} />
      <Route path="/admin/website/testimonials/:id/edit" element={<ProtectedRoute><TestimonialForm /></ProtectedRoute>} />
      <Route path="/admin/website/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
      <Route path="/admin/website/services/add" element={<ProtectedRoute><ServiceForm /></ProtectedRoute>} />
      <Route path="/admin/website/services/:id" element={<ProtectedRoute><ServiceForm /></ProtectedRoute>} />
      <Route path="/admin/website/services/:id/edit" element={<ProtectedRoute><ServiceForm /></ProtectedRoute>} />
      <Route path="/admin/website/faqs" element={<ProtectedRoute><Faqs /></ProtectedRoute>} />
      <Route path="/admin/website/faqs/add" element={<ProtectedRoute><FaqForm /></ProtectedRoute>} />
      <Route path="/admin/website/faqs/:id" element={<ProtectedRoute><FaqForm /></ProtectedRoute>} />
      <Route path="/admin/website/faqs/:id/edit" element={<ProtectedRoute><FaqForm /></ProtectedRoute>} />
      <Route path="/admin/website/contact-messages" element={<ProtectedRoute><ContactMessages /></ProtectedRoute>} />
      <Route path="/admin/website/contact-messages/:id" element={<ProtectedRoute><ContactMessageView /></ProtectedRoute>} />
      <Route path="/admin/website/contact-messages/:id/edit" element={<ProtectedRoute><ContactMessageEdit /></ProtectedRoute>} />
      <Route path="/admin/website/blogs" element={<ProtectedRoute><Blogs /></ProtectedRoute>} />
      <Route path="/admin/website/blogs/add" element={<ProtectedRoute><BlogForm /></ProtectedRoute>} />
      <Route path="/admin/website/blogs/:id" element={<ProtectedRoute><BlogForm /></ProtectedRoute>} />
      <Route path="/admin/website/blogs/:id/edit" element={<ProtectedRoute><BlogForm /></ProtectedRoute>} />
      <Route path="/admin/website/site-setting" element={<ProtectedRoute><SiteSettingForm /></ProtectedRoute>} />

      {/* App (driver/user) auth */}
      <Route path="/app" element={<Navigate to="/app/login" replace />} />
      <Route path="/app/login" element={<AppLoginRoute />} />
      <Route path="/app/register" element={<AppRegister />} />
      <Route path="/app/forgot-password" element={<AppForgotPassword />} />
      <Route path="/app/reset-password" element={<AppResetPassword />} />
      <Route path="/payment/callback/success" element={<AppProtectedRoute><PaymentCallbackPage /></AppProtectedRoute>} />
      <Route path="/payment/callback/failure" element={<AppProtectedRoute><PaymentCallbackPage /></AppProtectedRoute>} />

      {/* App (driver/user) portals - generated from config */}
      {getAppRoles().map((role) => {
        const config = getAppRoleConfig(role);
        return (
          <Route
            key={role}
            path={config.basePath}
            element={
              <AppProtectedRoute>
                <AppRoleLayout role={role} />
              </AppProtectedRoute>
            }
          >
            <Route index element={<Navigate to={config.defaultPath} replace />} />
            {Object.entries(config.routes).map(([path, Component]) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
          </Route>
        );
      })}
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="*" element={
      <AuthProvider>
        <GoogleMapsProvider>
          <WalkieTalkieProvider>
            <AppRoutesWithWalkieTalkie />
          </WalkieTalkieProvider>
        </GoogleMapsProvider>
      </AuthProvider>
    } />
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RouterProvider router={router} />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
