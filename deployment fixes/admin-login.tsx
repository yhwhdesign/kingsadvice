import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { adminLogin } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await adminLogin(password);
      await queryClient.invalidateQueries({ queryKey: ["admin-status"] });
      toast({
        title: "Welcome back, Admin",
        description: "You have successfully logged in.",
      });
      setLocation("/admin");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: error instanceof Error ? error.message : "Invalid credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] container mx-auto px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-white/10 p-4 rounded-full w-fit mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Admin Access</CardTitle>
          <CardDescription>Please enter your credentials to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  data-testid="input-admin-password"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-admin-login">
              {isLoading ? "Logging in..." : "Login to Dashboard"}
            </Button>
            <div className="text-xs text-center text-muted-foreground mt-4">
              Hint: use 'admin123' for demo
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
