import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
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
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/trading" element={<TradingPage />} />
            <Route path="/trading/:pair" element={<TradingPage />} />
            <Route path="/exchange" element={<ExchangePage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/gold-mining" element={<GoldMiningPage />} />
            <Route path="/my-assets" element={<MyAssetsPage />} />
            <Route path="/launchpad" element={<LaunchpadPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
