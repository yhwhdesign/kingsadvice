import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Layout from "@/components/layout";
import SubmitRequest from "@/pages/submit-request";
import CustomerDashboard from "@/pages/customer-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminLogin from "@/pages/admin-login";
import { checkAdminStatus } from "@/lib/api";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

function ProtectedAdminRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const { data: authStatus, isLoading } = useQuery({
    queryKey: ["admin-status"],
    queryFn: checkAdminStatus,
  });

  useEffect(() => {
    if (!isLoading && !authStatus?.isAdmin) {
      setLocation("/admin-login");
    }
  }, [authStatus, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authStatus?.isAdmin) return null;
  return <Component />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/submit/:tier" component={SubmitRequest} />
        <Route path="/request/:id" component={CustomerDashboard} />
        <Route path="/admin-login" component={AdminLogin} />
        <Route path="/admin">
          <ProtectedAdminRoute component={AdminDashboard} />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
