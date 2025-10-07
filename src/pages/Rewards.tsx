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
    if (index === 0) return <Badge className="bg-warning text-warning-foreground">🥇 1st</Badge>;
    if (index === 1) return <Badge className="bg-muted text-muted-foreground">🥈 2nd</Badge>;
    if (index === 2) return <Badge className="bg-accent text-accent-foreground">🥉 3rd</Badge>;
    return <Badge variant="outline">#{index + 1}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rewards & Gamification</h1>
          <p className="text-muted-foreground">
            Track employee performance and award points
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Award Points
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Award Reward Points</DialogTitle>
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
                  <SelectTrigger>
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
                />
              </div>
              <Button type="submit" className="w-full">
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
            className={`hover:shadow-lg transition-shadow ${
              index < 3 ? "border-primary" : ""
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy
                    className={`h-5 w-5 ${
                      index === 0
                        ? "text-warning"
                        : index === 1
                        ? "text-muted-foreground"
                        : index === 2
                        ? "text-accent"
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Points:</span>
                  <span className="text-xl font-bold text-primary">{emp.totalPoints}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completed Tasks:</span>
                  <Badge variant="outline">{emp.completedTasks}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {employeePoints.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No employee data available. Start awarding points to see the leaderboard!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Rewards;
