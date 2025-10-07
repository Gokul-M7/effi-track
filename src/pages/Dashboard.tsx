import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderKanban, CheckSquare, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalProjects: 0,
    ongoingProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalRewardPoints: 0,
  });

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to EFFI-TRACK admin dashboard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started by managing your employees, projects, and tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
            Add Employee
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors">
            Create Project
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-success hover:text-success-foreground transition-colors">
            Assign Task
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-warning hover:text-warning-foreground transition-colors">
            Award Points
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
