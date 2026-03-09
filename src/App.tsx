import { Suspense } from "react";
import { lazyWithChunkErrorReload } from "@/lib/lazyWithChunkErrorReload";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, createRoutesFromElements, Navigate, Route, RouterProvider, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useWalkieTalkie } from "@/contexts/WalkieTalkieContext";
import { useDriverActiveTrip } from "@/hooks/useDriverActiveTrip";
import { GoogleMapsProvider } from "@/contexts/GoogleMapsContext";
import { WalkieTalkieProvider } from "@/contexts/WalkieTalkieContext";
import { WalkieTalkieFab } from "@/components/walkietalkie/WalkieTalkieFab";
import { WalkieTalkieDrawer } from "@/components/walkietalkie/WalkieTalkieDrawer";
import { useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

// Public pages (eager so public site bundle has no TipTap/DOMPurify)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import PageBySlug from "./pages/PageBySlug";
import BlogList from "./pages/BlogList";
import BlogPost from "./pages/BlogPost";
import About from "./pages/About";
import WebsiteServices from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import Contact from "./pages/Contact";
import WebsiteLayout from "./components/website/Layout";

// Admin & app pages (lazy to avoid "Class constructor cannot be invoked without 'new'" on public site)
const Dashboard = lazyWithChunkErrorReload(() => import("./pages/app/Dashboard"));
const Users = lazyWithChunkErrorReload(() => import("./pages/app/Users"));
const UserForm = lazyWithChunkErrorReload(() => import("./pages/app/UserForm"));
const UserView = lazyWithChunkErrorReload(() => import("./pages/app/UserView"));
const Wallets = lazyWithChunkErrorReload(() => import("./pages/app/Wallets"));
const WalletForm = lazyWithChunkErrorReload(() => import("./pages/app/WalletForm"));
const WalletView = lazyWithChunkErrorReload(() => import("./pages/app/WalletView"));
const Transactions = lazyWithChunkErrorReload(() => import("./pages/app/Transactions"));
const TransactionForm = lazyWithChunkErrorReload(() => import("./pages/app/TransactionForm"));
const TransactionView = lazyWithChunkErrorReload(() => import("./pages/app/TransactionView"));
const Settings = lazyWithChunkErrorReload(() => import("./pages/app/Settings"));
const Places = lazyWithChunkErrorReload(() => import("./pages/app/Places"));
const PlaceForm = lazyWithChunkErrorReload(() => import("./pages/app/PlaceForm"));
const PlaceView = lazyWithChunkErrorReload(() => import("./pages/app/PlaceView"));
const Routes_ = lazyWithChunkErrorReload(() => import("./pages/app/Routes"));
const RouteForm = lazyWithChunkErrorReload(() => import("./pages/app/RouteForm"));
const RouteView = lazyWithChunkErrorReload(() => import("./pages/app/RouteView"));
const Vehicles = lazyWithChunkErrorReload(() => import("./pages/app/Vehicles"));
const VehicleForm = lazyWithChunkErrorReload(() => import("./pages/app/VehicleForm"));
const VehicleView = lazyWithChunkErrorReload(() => import("./pages/app/VehicleView"));
const SeatBookings = lazyWithChunkErrorReload(() => import("./pages/app/SeatBookings"));
const SeatBookingForm = lazyWithChunkErrorReload(() => import("./pages/app/SeatBookingForm"));
const SeatBookingView = lazyWithChunkErrorReload(() => import("./pages/app/SeatBookingView"));
const Trips = lazyWithChunkErrorReload(() => import("./pages/app/Trips"));
const TripView = lazyWithChunkErrorReload(() => import("./pages/app/TripView"));
const Locations = lazyWithChunkErrorReload(() => import("./pages/app/Locations"));
const VehicleSchedules = lazyWithChunkErrorReload(() => import("./pages/app/VehicleSchedules"));
const VehicleScheduleForm = lazyWithChunkErrorReload(() => import("./pages/app/VehicleScheduleForm"));
const VehicleScheduleView = lazyWithChunkErrorReload(() => import("./pages/app/VehicleScheduleView"));
const VehicleTicketBookings = lazyWithChunkErrorReload(() => import("./pages/app/VehicleTicketBookings"));
const VehicleTicketBookingForm = lazyWithChunkErrorReload(() => import("./pages/app/VehicleTicketBookingForm"));
const VehicleTicketBookingView = lazyWithChunkErrorReload(() => import("./pages/app/VehicleTicketBookingView"));
const Cards = lazyWithChunkErrorReload(() => import("./pages/app/Cards"));
const CardForm = lazyWithChunkErrorReload(() => import("./pages/app/CardForm"));
const CardView = lazyWithChunkErrorReload(() => import("./pages/app/CardView"));
const Sliders = lazyWithChunkErrorReload(() => import("./pages/app/website/Sliders"));
const SliderForm = lazyWithChunkErrorReload(() => import("./pages/app/website/SliderForm"));
const CmsPages = lazyWithChunkErrorReload(() => import("./pages/app/website/CmsPages"));
const CmsPageForm = lazyWithChunkErrorReload(() => import("./pages/app/website/CmsPageForm"));
const TeamList = lazyWithChunkErrorReload(() => import("./pages/app/website/TeamList"));
const TeamForm = lazyWithChunkErrorReload(() => import("./pages/app/website/TeamForm"));
const Testimonials = lazyWithChunkErrorReload(() => import("./pages/app/website/Testimonials"));
const TestimonialForm = lazyWithChunkErrorReload(() => import("./pages/app/website/TestimonialForm"));
const Services = lazyWithChunkErrorReload(() => import("./pages/app/website/Services"));
const ServiceForm = lazyWithChunkErrorReload(() => import("./pages/app/website/ServiceForm"));
const Faqs = lazyWithChunkErrorReload(() => import("./pages/app/website/Faqs"));
const FaqForm = lazyWithChunkErrorReload(() => import("./pages/app/website/FaqForm"));
const ContactMessages = lazyWithChunkErrorReload(() => import("./pages/app/website/ContactMessages"));
const ContactMessageView = lazyWithChunkErrorReload(() => import("./pages/app/website/ContactMessageView"));
const ContactMessageEdit = lazyWithChunkErrorReload(() => import("./pages/app/website/ContactMessageEdit"));
const Blogs = lazyWithChunkErrorReload(() => import("./pages/app/website/Blogs"));
const BlogForm = lazyWithChunkErrorReload(() => import("./pages/app/website/BlogForm"));
const SiteSettingForm = lazyWithChunkErrorReload(() => import("./pages/app/website/SiteSettingForm"));
const AppLogin = lazyWithChunkErrorReload(() => import("./pages/app/AppLogin"));
const AppRegister = lazyWithChunkErrorReload(() => import("./pages/app/AppRegister"));
const AppForgotPassword = lazyWithChunkErrorReload(() => import("./pages/app/AppForgotPassword"));
const AppResetPassword = lazyWithChunkErrorReload(() => import("./pages/app/AppResetPassword"));
const AppRoleLayout = lazyWithChunkErrorReload(() => import("./pages/app/AppRoleLayout"));
const PaymentCallbackPage = lazyWithChunkErrorReload(() => import("./pages/app/PaymentCallbackPage"));
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
  const { hasActiveTrip } = useDriverActiveTrip();
  const pathOk =
    (location.pathname.startsWith("/admin") || location.pathname.startsWith("/app")) &&
    !location.pathname.includes("/app/login");
  const canUseWalkieTalkie = (user?.is_driver && hasActiveTrip) || groups.length > 0;
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
    <Routes>
      {/* Website routes — wrapped by new hub design Layout (Header + Footer) */}
      <Route element={<WebsiteLayout />}>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<WebsiteServices />} />
        <Route path="/service/:slug" element={<ServiceDetail />} />
        <Route path="/blogs" element={<BlogList />} />
        <Route path="/blog" element={<Navigate to="/blogs" replace />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/page/:slug" element={<PageBySlug />} />
      </Route>
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
    </Suspense>
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
