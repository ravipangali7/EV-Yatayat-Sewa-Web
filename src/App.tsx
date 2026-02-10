import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
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

// App (driver/user) pages
import AppLogin from "./pages/app/AppLogin";
import AppRegister from "./pages/app/AppRegister";
import AppForgotPassword from "./pages/app/AppForgotPassword";
import AppResetPassword from "./pages/app/AppResetPassword";
import DriverLayout from "./pages/app/driver/DriverLayout";
import DriverHome from "./pages/app/driver/DriverHome";
import DriverVehicle from "./pages/app/driver/Vehicle";
import DriverWallet from "./pages/app/driver/DriverWallet";
import DriverProfile from "./pages/app/driver/DriverProfile";
import UserLayout from "./pages/app/user/UserLayout";
import UserHome from "./pages/app/user/UserHome";
import UserBooking from "./pages/app/user/UserBooking";
import UserProfile from "./pages/app/user/UserProfile";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

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

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/admin" replace /> : <Login />} 
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

      {/* App (driver/user) auth */}
      <Route path="/app" element={<Navigate to="/app/login" replace />} />
      <Route path="/app/login" element={<AppLogin />} />
      <Route path="/app/register" element={<AppRegister />} />
      <Route path="/app/forgot-password" element={<AppForgotPassword />} />
      <Route path="/app/reset-password" element={<AppResetPassword />} />

      {/* Driver portal */}
      <Route path="/app/driver" element={<AppProtectedRoute><DriverLayout /></AppProtectedRoute>}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<DriverHome />} />
        <Route path="vehicle" element={<DriverVehicle />} />
        <Route path="wallet" element={<DriverWallet />} />
        <Route path="profile" element={<DriverProfile />} />
      </Route>

      {/* User portal */}
      <Route path="/app/user" element={<AppProtectedRoute><UserLayout /></AppProtectedRoute>}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<UserHome />} />
        <Route path="booking" element={<UserBooking />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
