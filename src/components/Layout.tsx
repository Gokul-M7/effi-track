import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  CheckSquare, 
  Trophy, 
  Bot,
  LogOut
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Employees", url: "/employees", icon: Users },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Rewards", url: "/rewards", icon: Trophy },
  { title: "AI Assistant", url: "/ai-chat", icon: Bot },
];

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully",
    });
    navigate("/auth");
  };

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent py-4">
                EFFI-TRACK
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "hover:bg-sidebar-accent/50"
                          }
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <div className="mt-auto p-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <div className="border-b bg-card">
            <div className="flex h-14 items-center px-4">
              <SidebarTrigger />
            </div>
          </div>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
