
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { WalletProvider } from "@/hooks/useWallet";
import { MiningProvider } from "@/hooks/useMiningInvestments";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import SuperAdminPage from "./pages/SuperAdminPage";
import ExchangePage from "./pages/ExchangePage";
import TradingPage from "./pages/TradingPage";
import MyAssetsPage from "./pages/MyAssetsPage";
import LaunchpadPage from "./pages/LaunchpadPage";
import ContractsPage from "./pages/ContractsPage";
import GoldMiningPage from "./pages/GoldMiningPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <WalletProvider>
          <MiningProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={
                  <PublicRoute>
                    <AuthPage />
                  </PublicRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/superadmin-dashboard" element={
                  <ProtectedRoute>
                    <SuperAdminPage />
                  </ProtectedRoute>
                } />
                <Route path="/exchange" element={<ExchangePage />} />
                <Route path="/trading/:pair?" element={
                  <ProtectedRoute>
                    <TradingPage />
                  </ProtectedRoute>
                } />
                <Route path="/my-assets" element={
                  <ProtectedRoute>
                    <MyAssetsPage />
                  </ProtectedRoute>
                } />
                <Route path="/launchpad" element={
                  <ProtectedRoute>
                    <LaunchpadPage />
                  </ProtectedRoute>
                } />
                <Route path="/contracts" element={<ContractsPage />} />
                <Route path="/gold-mining" element={
                  <ProtectedRoute>
                    <GoldMiningPage />
                  </ProtectedRoute>
                } />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </BrowserRouter>
          </MiningProvider>
        </WalletProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
