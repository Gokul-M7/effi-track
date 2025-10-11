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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, Users as UsersIcon, UserPlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string | null;
  assignedEmployees?: Employee[];
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

const Projects = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "ongoing",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, []);

  const fetchProjects = async () => {
    const { data: projectsData, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching projects",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Fetch assigned employees for each project
    const projectsWithEmployees = await Promise.all(
      (projectsData || []).map(async (project) => {
        const { data: assignments } = await supabase
          .from("project_assignments")
          .select("employee_id")
          .eq("project_id", project.id);

        if (assignments && assignments.length > 0) {
          const employeeIds = assignments.map((a) => a.employee_id);
          const { data: employeesData } = await supabase
            .from("employees")
            .select("id, name, email")
            .in("id", employeeIds);
          
          return { ...project, assignedEmployees: employeesData || [] };
        }
        
        return { ...project, assignedEmployees: [] };
      })
    );

    setProjects(projectsWithEmployees);
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, name, email")
      .eq("status", "active")
      .order("name");

    if (error) {
      toast({
        title: "Error fetching employees",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setEmployees(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: newProject, error } = await supabase
        .from("projects")
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      // Assign selected employees to the project
      if (selectedEmployees.length > 0) {
        const assignments = selectedEmployees.map((employeeId) => ({
          project_id: newProject.id,
          employee_id: employeeId,
        }));

        const { error: assignError } = await supabase
          .from("project_assignments")
          .insert(assignments);

        if (assignError) throw assignError;
      }

      toast({
        title: "Project created successfully",
        description: selectedEmployees.length > 0 
          ? `Assigned to ${selectedEmployees.length} employee(s)` 
          : undefined,
      });

      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        status: "ongoing",
        start_date: "",
        end_date: "",
      });
      setSelectedEmployees([]);
      fetchProjects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openAssignDialog = (project: Project) => {
    setSelectedProject(project);
    setSelectedEmployees(project.assignedEmployees?.map((e) => e.id) || []);
    setAssignDialogOpen(true);
  };

  const handleAssignEmployees = async () => {
    if (!selectedProject) return;

    try {
      // Remove existing assignments
      await supabase
        .from("project_assignments")
        .delete()
        .eq("project_id", selectedProject.id);

      // Add new assignments
      if (selectedEmployees.length > 0) {
        const assignments = selectedEmployees.map((employeeId) => ({
          project_id: selectedProject.id,
          employee_id: employeeId,
        }));

        const { error } = await supabase
          .from("project_assignments")
          .insert(assignments);

        if (error) throw error;
      }

      toast({
        title: "Employees assigned successfully",
        description: `${selectedEmployees.length} employee(s) assigned to project`,
      });

      setAssignDialogOpen(false);
      setSelectedProject(null);
      setSelectedEmployees([]);
      fetchProjects();
    } catch (error: any) {
      toast({
        title: "Error assigning employees",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects and track progress
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
              <DialogDescription>
                Create a new project and assign team members
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label>Assign Employees (Optional)</Label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                  {employees.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No active employees found
                    </p>
                  ) : (
                    employees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`employee-${employee.id}`}
                          checked={selectedEmployees.includes(employee.id)}
                          onCheckedChange={() => toggleEmployee(employee.id)}
                        />
                        <label
                          htmlFor={`employee-${employee.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {employee.name} ({employee.email})
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {selectedEmployees.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployees.length} employee(s) selected
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full">
                Create Project
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-slide-up border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="line-clamp-1 text-lg">{project.title}</CardTitle>
                <Badge
                  variant={project.status === "ongoing" ? "default" : "secondary"}
                  className={
                    project.status === "ongoing"
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-sm"
                      : "bg-gradient-to-r from-success to-success/80 text-success-foreground shadow-sm"
                  }
                >
                  {project.status}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2 mt-2">
                {project.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{new Date(project.start_date).toLocaleDateString()}</span>
                </div>
                {project.end_date && (
                  <>
                    <span className="text-muted-foreground/50">→</span>
                    <span>{new Date(project.end_date).toLocaleDateString()}</span>
                  </>
                )}
              </div>

              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <UsersIcon className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {project.assignedEmployees?.length || 0} Assigned
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAssignDialog(project)}
                    className="h-8"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    Manage
                  </Button>
                </div>
                {project.assignedEmployees && project.assignedEmployees.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.assignedEmployees.slice(0, 3).map((emp) => (
                      <Badge key={emp.id} variant="secondary" className="text-xs">
                        {emp.name}
                      </Badge>
                    ))}
                    {project.assignedEmployees.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.assignedEmployees.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assign Employees Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Employees to Project</DialogTitle>
            <DialogDescription>
              Select employees who will receive deadline alerts for {selectedProject?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
              {employees.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No active employees found
                </p>
              ) : (
                employees.map((employee) => (
                  <div key={employee.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                    <Checkbox
                      id={`assign-${employee.id}`}
                      checked={selectedEmployees.includes(employee.id)}
                      onCheckedChange={() => toggleEmployee(employee.id)}
                    />
                    <label
                      htmlFor={`assign-${employee.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-xs text-muted-foreground">{employee.email}</div>
                      </div>
                    </label>
                  </div>
                ))
              )}
            </div>
            {selectedEmployees.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedEmployees.length} employee(s) selected - they will receive deadline alerts
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setAssignDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAssignEmployees}>
                Save Assignments
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;
