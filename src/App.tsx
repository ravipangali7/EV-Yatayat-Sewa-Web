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
import Transactions from "./pages/app/Transactions";
import TransactionForm from "./pages/app/TransactionForm";
import Settings from "./pages/app/Settings";
import Places from "./pages/app/Places";
import PlaceForm from "./pages/app/PlaceForm";
import Routes_ from "./pages/app/Routes";
import RouteForm from "./pages/app/RouteForm";
import Vehicles from "./pages/app/Vehicles";
import VehicleForm from "./pages/app/VehicleForm";
import VehicleView from "./pages/app/VehicleView";

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

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/app" replace /> : <Login />} 
      />
      
      {/* Dashboard Routes */}
      <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      
      {/* Users */}
      <Route path="/app/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/app/users/add" element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
      <Route path="/app/users/:id" element={<ProtectedRoute><UserView /></ProtectedRoute>} />
      <Route path="/app/users/:id/edit" element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
      
      {/* Wallets */}
      <Route path="/app/wallets" element={<ProtectedRoute><Wallets /></ProtectedRoute>} />
      <Route path="/app/wallets/add" element={<ProtectedRoute><WalletForm /></ProtectedRoute>} />
      <Route path="/app/wallets/:id" element={<ProtectedRoute><WalletForm /></ProtectedRoute>} />
      <Route path="/app/wallets/:id/edit" element={<ProtectedRoute><WalletForm /></ProtectedRoute>} />
      
      {/* Transactions */}
      <Route path="/app/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      <Route path="/app/transactions/:id" element={<ProtectedRoute><TransactionForm /></ProtectedRoute>} />
      <Route path="/app/transactions/:id/edit" element={<ProtectedRoute><TransactionForm /></ProtectedRoute>} />
      
      {/* Settings */}
      <Route path="/app/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      
      {/* Places */}
      <Route path="/app/places" element={<ProtectedRoute><Places /></ProtectedRoute>} />
      <Route path="/app/places/add" element={<ProtectedRoute><PlaceForm /></ProtectedRoute>} />
      <Route path="/app/places/:id" element={<ProtectedRoute><PlaceForm /></ProtectedRoute>} />
      <Route path="/app/places/:id/edit" element={<ProtectedRoute><PlaceForm /></ProtectedRoute>} />
      
      {/* Routes */}
      <Route path="/app/routes" element={<ProtectedRoute><Routes_ /></ProtectedRoute>} />
      <Route path="/app/routes/add" element={<ProtectedRoute><RouteForm /></ProtectedRoute>} />
      <Route path="/app/routes/:id" element={<ProtectedRoute><RouteForm /></ProtectedRoute>} />
      <Route path="/app/routes/:id/edit" element={<ProtectedRoute><RouteForm /></ProtectedRoute>} />
      
      {/* Vehicles */}
      <Route path="/app/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
      <Route path="/app/vehicles/add" element={<ProtectedRoute><VehicleForm /></ProtectedRoute>} />
      <Route path="/app/vehicles/:id" element={<ProtectedRoute><VehicleView /></ProtectedRoute>} />
      <Route path="/app/vehicles/:id/edit" element={<ProtectedRoute><VehicleForm /></ProtectedRoute>} />
      
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
