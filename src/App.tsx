
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/useAuth';
import { WalletProvider } from '@/hooks/useWallet';
import { PeerTransferProvider } from '@/hooks/usePeerTransfers';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import PublicRoute from '@/components/PublicRoute';

// Pages
import Index from '@/pages/Index';
import AuthPage from '@/pages/AuthPage';
import DashboardPage from '@/pages/DashboardPage';
import TradingPage from '@/pages/TradingPage';
import ExchangePage from '@/pages/ExchangePage';
import MyAssetsPage from '@/pages/MyAssetsPage';
import GoldMiningPage from '@/pages/GoldMiningPage';
import LaunchpadPage from '@/pages/LaunchpadPage';
import ContractsPage from '@/pages/ContractsPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import SuperAdminPage from '@/pages/SuperAdminPage';
import NotFound from '@/pages/NotFound';

import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WalletProvider>
          <PeerTransferProvider>
            <Router>
              <div className="min-h-screen bg-exchange-primary text-exchange-text-primary">
                <Header />
                <main className="pt-16">
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
                    <Route path="/trading" element={
                      <ProtectedRoute>
                        <TradingPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/exchange" element={
                      <ProtectedRoute>
                        <ExchangePage />
                      </ProtectedRoute>
                    } />
                    <Route path="/assets" element={
                      <ProtectedRoute>
                        <MyAssetsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/gold-mining" element={
                      <ProtectedRoute>
                        <GoldMiningPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/launchpad" element={
                      <ProtectedRoute>
                        <LaunchpadPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/contracts" element={
                      <ProtectedRoute>
                        <ContractsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                      <ProtectedRoute>
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/superadmin" element={
                      <ProtectedRoute>
                        <SuperAdminPage />
                      </ProtectedRoute>
                    } />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Toaster />
              </div>
            </Router>
          </PeerTransferProvider>
        </WalletProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
