import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AssessmentProvider } from "./contexts/AssessmentContext";
import { BrandingProvider } from "./contexts/BrandingContext";
import { UserProvider } from "./contexts/UserContext";
import { useUserRole } from "./hooks/useUserRole";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import Clientes from "./pages/Clientes";
import Configuracoes from "./pages/Configuracoes";
import AlphaTrainer from "./pages/AlphaTrainer";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import BlockedScreen from "./pages/BlockedScreen";
import NotFound from "./pages/NotFound";
import { ThemeToggle } from "./components/ThemeToggle";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isBlocked, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin users go to admin panel
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // Blocked users see block screen
  if (isBlocked) {
    return <BlockedScreen />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/avaliacao" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/alpha-trainer" element={<ProtectedRoute><AlphaTrainer /></ProtectedRoute>} />
    <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
    <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <UserProvider>
          <BrandingProvider>
            <AssessmentProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
                <ThemeToggle />
              </TooltipProvider>
            </AssessmentProvider>
          </BrandingProvider>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
