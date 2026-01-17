import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Crown, LayoutDashboard, Home, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { checkAdminStatus, adminLogout } from "@/lib/api";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: authStatus } = useQuery({
    queryKey: ["admin-status"],
    queryFn: checkAdminStatus,
  });
  
  const isAdmin = authStatus?.isAdmin || false;

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    ...(isAdmin ? [{ href: "/admin", label: "Admin Portal", icon: LayoutDashboard }] : []),
  ];

  const handleLogout = async () => {
    await adminLogout();
    queryClient.setQueryData(["admin-status"], { isAdmin: false });
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-heading font-bold text-xl tracking-tight text-white hover:text-white/80 transition-colors">
            <Crown className="h-6 w-6 text-white" />
            <span>Kings Advice</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-white",
                  location === item.href
                    ? "text-white"
                    : "text-white/70"
                )}
              >
                {item.label}
              </Link>
            ))}
            {!isAdmin && (
              <Button size="sm" className="ml-4 bg-white text-slate-950 hover:bg-slate-200 font-semibold shadow-sm">
                Get Started
              </Button>
            )}
            {isAdmin && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="ml-4 text-red-400 hover:text-red-300 hover:bg-slate-800"
                onClick={handleLogout}
              >
                Logout Admin
              </Button>
            )}
          </nav>

          {/* Mobile Nav */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-white hover:text-white/80 hover:bg-slate-800">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-2 text-lg font-medium transition-colors hover:text-primary",
                      location === item.href
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    className="justify-start text-red-500"
                    onClick={handleLogout}
                  >
                    Logout Admin
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 relative">
        {children}
        
        {/* Admin Login Trigger */}
        {!isAdmin && (
          <Link 
            href="/admin-login"
            className="fixed bottom-4 right-4 p-2 rounded-full bg-muted/20 hover:bg-primary/10 transition-colors opacity-15 hover:opacity-60"
            data-testid="link-admin-trigger"
          >
            <Crown className="h-4 w-4 text-muted-foreground" />
          </Link>
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-white/80">
          <p>&copy; 2026 Kings Advice. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
