import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import CreatePoll from "./pages/CreatePoll";
import PollLanding from "./pages/PollLanding";
import PollQuestion from "./pages/PollQuestion";
import PollResults from "./pages/PollResults";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPolls from "./pages/admin/AdminPolls";
import AdminComments from "./pages/admin/AdminComments";
import AdminTickets from "./pages/admin/AdminTickets";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/create" element={<CreatePoll />} />
            <Route path="/p/:slug" element={<PollLanding />} />
            <Route path="/p/:slug/q/:questionNum" element={<PollQuestion />} />
            <Route path="/p/:slug/results" element={<PollResults />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/polls" element={<AdminPolls />} />
            <Route path="/admin/comments" element={<AdminComments />} />
            <Route path="/admin/tickets" element={<AdminTickets />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
