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
