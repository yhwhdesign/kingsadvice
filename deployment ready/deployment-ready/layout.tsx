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
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-md dark:bg-black/50 dark:border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 font-heading font-bold text-xl tracking-tight text-primary hover:opacity-80 transition-opacity">
              <Crown className="h-6 w-6" />
              <span>Kings Advice</span>
            </a>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    location === item.href
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </a>
              </Link>
            ))}
            {!isAdmin && (
              <Button size="sm" variant="default" className="ml-4">
                Get Started
              </Button>
            )}
            {isAdmin && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="ml-4 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                Logout Admin
              </Button>
            )}
          </nav>

          {/* Mobile Nav */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <a
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
                    </a>
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
          <Link href="/admin-login">
            <a className="fixed bottom-4 right-4 p-2 rounded-full bg-muted/20 hover:bg-primary/10 transition-colors opacity-15 hover:opacity-60" data-testid="link-admin-trigger">
              <Crown className="h-4 w-4 text-muted-foreground" />
            </a>
          </Link>
        )}
      </main>

      <footer className="border-t bg-white/50 py-8 dark:bg-black/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Kings Advice. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
