import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderKanban, CheckSquare, Trophy, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalProjects: 0,
    ongoingProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalRewardPoints: 0,
  });
  const [isSendingAlerts, setIsSendingAlerts] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch employee stats
      const { data: employees } = await supabase
        .from("employees")
        .select("status");

      // Fetch project stats
      const { data: projects } = await supabase
        .from("projects")
        .select("status");

      // Fetch task stats
      const { data: tasks } = await supabase
        .from("tasks")
        .select("status");

      // Fetch reward points
      const { data: rewards } = await supabase
        .from("reward_points")
        .select("points");

      setStats({
        totalEmployees: employees?.length || 0,
        activeEmployees: employees?.filter((e) => e.status === "active").length || 0,
        totalProjects: projects?.length || 0,
        ongoingProjects: projects?.filter((p) => p.status === "ongoing").length || 0,
        totalTasks: tasks?.length || 0,
        completedTasks: tasks?.filter((t) => t.status === "completed").length || 0,
        totalRewardPoints: rewards?.reduce((sum, r) => sum + r.points, 0) || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const sendDeadlineAlerts = async () => {
    setIsSendingAlerts(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-deadline-alerts');
      
      if (error) throw error;
      
      toast({
        title: "Deadline alerts sent!",
        description: data.message || "Email notifications sent successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error sending alerts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSendingAlerts(false);
    }
  };

  const statCards = [
    {
      title: "Employees",
      icon: Users,
      value: stats.totalEmployees,
      description: `${stats.activeEmployees} active`,
      color: "text-primary",
    },
    {
      title: "Projects",
      icon: FolderKanban,
      value: stats.totalProjects,
      description: `${stats.ongoingProjects} ongoing`,
      color: "text-accent",
    },
    {
      title: "Tasks",
      icon: CheckSquare,
      value: stats.totalTasks,
      description: `${stats.completedTasks} completed`,
      color: "text-success",
    },
    {
      title: "Total Points",
      icon: Trophy,
      value: stats.totalRewardPoints,
      description: "Reward points distributed",
      color: "text-warning",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to EFFI-TRACK admin dashboard
          </p>
        </div>
        <Button 
          onClick={sendDeadlineAlerts}
          disabled={isSendingAlerts}
          className="bg-gradient-to-r from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70"
        >
          <Bell className="mr-2 h-4 w-4" />
          {isSendingAlerts ? "Sending..." : "Send Deadline Alerts"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-slide-up border-border/50"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-br from-${stat.color}/10 to-${stat.color}/5`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="animate-slide-up border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started by managing your employees, projects, and tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:scale-105 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 px-4 py-2"
            onClick={() => navigate('/employees')}
          >
            Add Employee
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:scale-105 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-200 px-4 py-2"
            onClick={() => navigate('/projects')}
          >
            Create Project
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:scale-105 hover:bg-success hover:text-success-foreground hover:border-success transition-all duration-200 px-4 py-2"
            onClick={() => navigate('/tasks')}
          >
            Assign Task
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:scale-105 hover:bg-warning hover:text-warning-foreground hover:border-warning transition-all duration-200 px-4 py-2"
            onClick={() => navigate('/rewards')}
          >
            Award Points
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
