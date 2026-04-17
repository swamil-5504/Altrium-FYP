import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import StudentDashboard from "./pages/StudentDashboard.tsx";
import UniversityAdmin from "./pages/UniversityAdmin.tsx";
import EmployerVerify from "./pages/EmployerVerify.tsx";
import SuperadminDashboard from "./pages/SuperadminDashboard.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Web3Guide from "./pages/Web3Guide.tsx";
import PendingVerification from "./pages/PendingVerification.tsx";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";

import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { sepolia } from '@reown/appkit/networks';

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694';

// Initialize Reown AppKit
createAppKit({
  adapters: [new EthersAdapter()],
  networks: [sepolia],
  metadata: {
    name: 'Altrium Admin',
    description: 'Altrium Institutional Degree Minting',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://altrium.example.com',
    icons: [`${typeof window !== 'undefined' ? window.location.origin : 'https://altrium.example.com'}/favicon.ico`]
  },
  projectId,
  features: {
    email: false,
    socials: false,
  },
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96' // MetaMask
  ],
  allWallets: 'HIDE'
});

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="altrium-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/student"
              element={
                <ProtectedRoute requiredRole="STUDENT">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/university"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <UniversityAdmin />
                </ProtectedRoute>
              }
            />
            <Route path="/guide" element={<Web3Guide />} />
            <Route path="/pending-verification" element={<PendingVerification />} />
            <Route path="/verify" element={<EmployerVerify />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
