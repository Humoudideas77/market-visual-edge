
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import Index from "./pages/Index";
import TradingPage from "./pages/TradingPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ExchangePage from "./pages/ExchangePage";
import ContractsPage from "./pages/ContractsPage";
import GoldMiningPage from "./pages/GoldMiningPage";
import MyAssetsPage from "./pages/MyAssetsPage";
import LaunchpadPage from "./pages/LaunchpadPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes - Always accessible */}
            <Route 
              path="/" 
              element={
                <PublicRoute>
                  <Index />
                </PublicRoute>
              } 
            />
            <Route 
              path="/auth" 
              element={
                <PublicRoute redirectIfAuthenticated={true}>
                  <AuthPage />
                </PublicRoute>
              } 
            />
            
            {/* Semi-public routes - Viewable but limited functionality */}
            <Route 
              path="/exchange" 
              element={
                <PublicRoute>
                  <ExchangePage />
                </PublicRoute>
              } 
            />
            
            {/* Protected Routes - Require authentication */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/trading" 
              element={
                <ProtectedRoute>
                  <TradingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/trading/:pair" 
              element={
                <ProtectedRoute>
                  <TradingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contracts" 
              element={
                <ProtectedRoute>
                  <ContractsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/gold-mining" 
              element={
                <ProtectedRoute>
                  <GoldMiningPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-assets" 
              element={
                <ProtectedRoute>
                  <MyAssetsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/launchpad" 
              element={
                <ProtectedRoute>
                  <LaunchpadPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
