
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { WalletProvider } from '@/hooks/useWallet';
import { MiningProvider } from '@/hooks/useMiningInvestments';
import Index from '@/pages/Index';
import AuthPage from '@/pages/AuthPage';
import DashboardPage from '@/pages/DashboardPage';
import ExchangePage from '@/pages/ExchangePage';
import TradingPage from '@/pages/TradingPage';
import MyAssetsPage from '@/pages/MyAssetsPage';
import GoldMiningPage from '@/pages/GoldMiningPage';
import ContractsPage from '@/pages/ContractsPage';
import LaunchpadPage from '@/pages/LaunchpadPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import SuperAdminPage from '@/pages/SuperAdminPage';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/components/ProtectedRoute';
import PublicRoute from '@/components/PublicRoute';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WalletProvider>
          <MiningProvider>
            <Router>
              <div className="min-h-screen bg-background">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                  <Route path="/exchange" element={<ExchangePage />} />
                  <Route path="/trading" element={<TradingPage />} />
                  <Route path="/trading/:baseAsset/:quoteAsset" element={<TradingPage />} />
                  <Route path="/my-assets" element={<ProtectedRoute><MyAssetsPage /></ProtectedRoute>} />
                  <Route path="/gold-mining" element={<ProtectedRoute><GoldMiningPage /></ProtectedRoute>} />
                  <Route path="/contracts" element={<ProtectedRoute><ContractsPage /></ProtectedRoute>} />
                  <Route path="/launchpad" element={<ProtectedRoute><LaunchpadPage /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
                  <Route path="/superadmin" element={<ProtectedRoute><SuperAdminPage /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
              </div>
            </Router>
          </MiningProvider>
        </WalletProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
