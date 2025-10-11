import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trophy } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface EmployeePoints {
  id: string;
  name: string;
  totalPoints: number;
  completedTasks: number;
}

interface Employee {
  id: string;
  name: string;
}

const Rewards = () => {
  const { toast } = useToast();
  const [employeePoints, setEmployeePoints] = useState<EmployeePoints[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    points: "",
    reason: "",
  });

  useEffect(() => {
    fetchEmployeePoints();
    fetchEmployees();
  }, []);

  const fetchEmployeePoints = async () => {
    try {
      // Fetch all employees with their points and completed tasks
      const { data: employees } = await supabase
        .from("employees")
        .select("id, name");

      if (!employees) return;

      const employeeData = await Promise.all(
        employees.map(async (emp) => {
          // Get total points
          const { data: points } = await supabase
            .from("reward_points")
            .select("points")
            .eq("employee_id", emp.id);

          const totalPoints = points?.reduce((sum, p) => sum + p.points, 0) || 0;

          // Get completed tasks count
          const { data: tasks } = await supabase
            .from("tasks")
            .select("id")
            .eq("assigned_to", emp.id)
            .eq("status", "completed");

          return {
            id: emp.id,
            name: emp.name,
            totalPoints,
            completedTasks: tasks?.length || 0,
          };
        })
      );

      // Sort by total points descending
      employeeData.sort((a, b) => b.totalPoints - a.totalPoints);
      setEmployeePoints(employeeData);
    } catch (error) {
      console.error("Error fetching employee points:", error);
    }
  };

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, name")
      .eq("status", "active");
    setEmployees(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from("reward_points").insert([
        {
          employee_id: formData.employee_id,
          points: parseInt(formData.points),
          reason: formData.reason,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Points awarded successfully",
      });

      setIsDialogOpen(false);
      setFormData({
        employee_id: "",
        points: "",
        reason: "",
      });
      fetchEmployeePoints();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <Badge className="bg-primary text-primary-foreground">🥇 1st</Badge>;
    if (index === 1) return <Badge className="bg-secondary text-secondary-foreground">🥈 2nd</Badge>;
    if (index === 2) return <Badge className="bg-info text-info-foreground">🥉 3rd</Badge>;
    return <Badge variant="outline">#{index + 1}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Rewards & Gamification
          </h1>
          <p className="text-muted-foreground mt-2">
            Track employee performance and award points
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Award Points
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-2xl text-primary">
                Award Reward Points
              </DialogTitle>
              <DialogDescription>
                Award points to employees for their achievements
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee</Label>
                <Select
                  value={formData.employee_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, employee_id: value })
                  }
                  required
                >
                  <SelectTrigger className="border-primary/30">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  required
                  className="border-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  required
                  className="border-primary/30"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
              >
                Award Points
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employeePoints.map((emp, index) => (
          <Card
            key={emp.id}
            className={`hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-slide-up ${
              index === 0
                ? "border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10"
                : index === 1
                ? "border-2 border-secondary"
                : index === 2
                ? "border-2 border-info bg-gradient-to-br from-info/5 to-info/10"
                : "border-border"
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy
                    className={`h-6 w-6 ${
                      index === 0
                        ? "text-primary"
                        : index === 1
                        ? "text-secondary-foreground"
                        : index === 2
                        ? "text-info"
                        : "text-muted-foreground"
                    }`}
                  />
                  {emp.name}
                </CardTitle>
                {getRankBadge(index)}
              </div>
              <CardDescription>Performance Overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                  <span className="text-sm font-medium">Total Points:</span>
                  <span className="text-2xl font-bold text-primary">
                    {emp.totalPoints}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                  <span className="text-sm font-medium">Completed Tasks:</span>
                  <Badge className="bg-success">{emp.completedTasks}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {employeePoints.length === 0 && (
        <Card className="border-2 border-dashed border-primary/30">
          <CardContent className="py-12 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-primary opacity-50" />
            <p className="text-lg text-muted-foreground">
              No employee data available. Start awarding points to see the leaderboard!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Rewards;
