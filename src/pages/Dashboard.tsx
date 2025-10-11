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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-7xl mx-auto space-y-8 px-6 py-8">
        {/* Header */}
        <div className="text-center space-y-2 animate-slide-up">
          <h1 className="text-5xl font-bold text-primary">Welcome, Admin</h1>
          <p className="text-muted-foreground text-lg">Manage your team efficiently with EFFI-TRACK</p>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          {statCards.map((stat, index) => (
            <Card 
              key={stat.title} 
              className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-card to-card/50"
              style={{ animationDelay: `${index * 0.1 + 0.1}s` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-3 rounded-full bg-primary/10`}>
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <p className="text-sm text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Employees</CardTitle>
              <CardDescription>Manage team performance and activities</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/employees')}
                className="w-full bg-primary hover:bg-primary/90"
              >
                View Employees
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Rewards</CardTitle>
              <CardDescription>Track points and reward top performers</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/rewards')}
                className="w-full bg-primary hover:bg-primary/90"
              >
                View Rewards
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
                <FolderKanban className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Ongoing Projects</CardTitle>
              <CardDescription>Stay on top of project progress</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/projects')}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Projects
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
                <CheckSquare className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">To-Do Tasks</CardTitle>
              <CardDescription>Review today's pending deliverables</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/tasks')}
                className="w-full bg-primary hover:bg-primary/90"
              >
                To-Do List
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center border-2 hover:border-warning/50 transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-card to-warning/5">
            <CardHeader>
              <div className="mx-auto p-4 rounded-full bg-warning/10 w-fit mb-4">
                <Bell className="h-8 w-8 text-warning" />
              </div>
              <CardTitle className="text-xl">Deadline Alerts</CardTitle>
              <CardDescription>Send notifications for upcoming deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={sendDeadlineAlerts}
                disabled={isSendingAlerts}
                className="w-full bg-warning hover:bg-warning/90 text-warning-foreground"
              >
                {isSendingAlerts ? "Sending..." : "Send Alerts"}
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center border-2 hover:border-accent/50 transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-card to-accent/5">
            <CardHeader>
              <div className="mx-auto p-4 rounded-full bg-accent/10 w-fit mb-4">
                <Users className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-xl">Smart Insights</CardTitle>
              <CardDescription>Automated suggestions for better performance</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/ai-chat')}
                className="w-full bg-accent hover:bg-accent/90"
              >
                Get Insights
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
