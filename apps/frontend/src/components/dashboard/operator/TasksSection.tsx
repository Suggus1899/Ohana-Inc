import { useState, useEffect, useCallback, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Clock, CheckCircle, AlertCircle, User, Loader2 } from "lucide-react";
import { api, Task } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { exportToPDF } from "@/lib/pdf-export";

// Helper for priority badges
const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "urgent":
    case "high":
      return <Badge variant="destructive" className="animate-pulse">Alta</Badge>;
    case "medium":
      return <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>;
    default:
      return <Badge variant="secondary">Baja</Badge>;
  }
};

// Memoized TaskCard defined outside parent to avoid unmounting on every render
interface TaskCardProps {
  task: Task;
  showActions?: boolean;
  onUpdateStatus: (id: number, newStatus: string) => void;
  onViewDetails: (task: Task) => void;
}

const TaskCard = memo(({ task, showActions = true, onUpdateStatus, onViewDetails }: TaskCardProps) => (
  <div className="p-4 rounded-lg border hover:shadow-sm transition-all group bg-white">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold">{task.title}</h4>
          {getPriorityBadge(task.priority)}
        </div>
        <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 bg-zinc-100 px-2 py-0.5 rounded">
            <User className="h-3 w-3" />
            Asignado por: {task.assignedBy?.name || "Admin"}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Límite: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "S/F"}
          </span>
        </div>
      </div>
      {showActions && (
        <div className="flex gap-2">
          {task.status === "pending" && (
             <Button size="sm" onClick={() => onUpdateStatus(task.id, "in_progress")}>
               Trabajar
             </Button>
          )}
          {task.status === "in_progress" && (
               <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onUpdateStatus(task.id, "completed")}>
                  Completar
               </Button>
          )}
           <Button size="sm" variant="ghost" onClick={() => onViewDetails(task)}>Ver</Button>
        </div>
      )}
    </div>
  </div>
));

TaskCard.displayName = "TaskCard";

const TasksSection = () => {
  const [tasks, setTasks] = useState<{ pending: Task[]; inProgress: Task[]; completed: Task[] }>({
    pending: [],
    inProgress: [],
    completed: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    const response = await api.getTasks();
    if (response.success && response.data) {
      const allTasks = response.data.tasks;
      setTasks({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pending: allTasks.filter((t: any) => t.status === "pending"),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        inProgress: allTasks.filter((t: any) => t.status === "in_progress"),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        completed: allTasks.filter((t: any) => t.status === "completed"),
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudieron cargar tus tareas",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Caching the callback passed to the memoized TaskCard
  const handleUpdateStatus = useCallback(async (id: number, newStatus: string) => {
    const response = await api.updateTaskStatus(id, newStatus);
    if (response.success) {
      toast({ title: "Tarea actualizada" });
      fetchTasks();
    }
  }, [toast, fetchTasks]);

  const handleViewDetails = useCallback((task: Task) => {
    toast({ title: task.title, description: task.description || 'Sin descripción' });
  }, [toast]);

  const handleExport = useCallback(() => {
    const dataToExport = [...tasks.pending, ...tasks.inProgress, ...tasks.completed];
    
    exportToPDF({
      title: 'Reporte de Tareas Asignadas',
      subtitle: 'Listado global del flujo de trabajo actual',
      operatorName: "Operador Habitas",
      stats: {
        total: dataToExport.length,
        approved: tasks.completed.length,
        rejected: 0
      },
      headers: ["ID", "Título", "Prioridad", "Estado"],
      rows: dataToExport.map(item => [
        item.id,
        item.title,
        item.priority === 'urgent' ? 'Urgente' : item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Media' : 'Baja',
        item.status === 'pending' ? 'Pendiente' : item.status === 'in_progress' ? 'En Progreso' : 'Completada'
      ]),
      fileName: `mis_tareas_reporte`
    });
  }, [tasks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Mis Tareas</h1>
          <p className="text-muted-foreground mt-1">
            Flujo de trabajo asignado para la moderación del sistema
          </p>
        </div>
        <Button 
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white border-none shadow-sm"
          onClick={handleExport}
          disabled={isLoading || (tasks.pending.length + tasks.inProgress.length + tasks.completed.length === 0)}
        >
          <div className="bg-white/20 p-1 rounded text-white mr-1">
            <span className="text-[10px] font-bold leading-none">PDF</span>
          </div>
          <span className="hidden sm:inline font-semibold">Exportar Reporte</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-md bg-yellow-50/30">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-100/50">
              <ClipboardList className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tasks.pending.length}</p>
              <p className="text-sm text-muted-foreground">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-blue-50/30">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100/50">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tasks.inProgress.length}</p>
              <p className="text-sm text-muted-foreground">En Progreso</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-green-50/30">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100/50">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tasks.completed.length}</p>
              <p className="text-sm text-muted-foreground">Completadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Tabs */}
      <Card className="border-none shadow-lg">
        <CardHeader className="border-b">
          <CardTitle>Cola de Trabajo</CardTitle>
          <CardDescription>Tareas organizadas por prioridad y estado de ejecución</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
              <p className="text-sm text-muted-foreground mt-4">Sincronizando tareas...</p>
            </div>
          ) : (
            <Tabs defaultValue="pending">
              <TabsList className="mb-6 h-11 bg-zinc-100 p-1">
                <TabsTrigger value="pending" className="flex items-center gap-2 px-6">
                  <AlertCircle className="h-4 w-4" />
                  Pendientes ({tasks.pending.length})
                </TabsTrigger>
                <TabsTrigger value="inProgress" className="flex items-center gap-2 px-6">
                  <Clock className="h-4 w-4" />
                  En Progreso ({tasks.inProgress.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2 px-6">
                  <CheckCircle className="h-4 w-4" />
                  Completadas ({tasks.completed.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {tasks.pending.length === 0 ? (
                  <div className="text-center py-10 bg-zinc-50 rounded-lg border-2 border-dashed">
                     <p className="text-muted-foreground">¡Sin tareas pendientes!</p>
                  </div>
                ) : tasks.pending.map((task) => (
                  <TaskCard key={task.id} task={task} onUpdateStatus={handleUpdateStatus} onViewDetails={handleViewDetails} />
                ))}
              </TabsContent>

              <TabsContent value="inProgress" className="space-y-4">
                {tasks.inProgress.length === 0 ? (
                  <div className="text-center py-10 bg-zinc-50 rounded-lg border-2 border-dashed">
                     <p className="text-muted-foreground">No tienes tareas en curso</p>
                  </div>
                ) : tasks.inProgress.map((task) => (
                  <TaskCard key={task.id} task={task} onUpdateStatus={handleUpdateStatus} onViewDetails={handleViewDetails} />
                ))}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {tasks.completed.length === 0 ? (
                    <div className="text-center py-10 bg-zinc-50 rounded-lg border-2 border-dashed">
                       <p className="text-muted-foreground">Aún no has completado tareas hoy</p>
                    </div>
                ) : tasks.completed.map((task) => (
                  <TaskCard key={task.id} task={task} showActions={false} onUpdateStatus={handleUpdateStatus} onViewDetails={handleViewDetails} />
                ))}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TasksSection;
