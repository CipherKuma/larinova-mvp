"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CheckSquare,
  Plus,
  Calendar,
  MoreVertical,
  Check,
  Clock,
  Play,
  X,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Patient {
  id: string;
  full_name: string;
  patient_code: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  due_date: string | null;
  patient_id?: string | null;
  patient: {
    full_name: string;
    patient_code: string;
  } | null;
}

interface InlineFormData {
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  due_date: Date | null;
  patient_id: string;
}

const TASK_TYPES = [
  "follow_up",
  "prescription_review",
  "record_completion",
  "general",
];
const PRIORITIES = ["urgent", "high", "medium", "low"];
const STATUSES = ["pending", "in_progress", "completed"];

const emptyForm: InlineFormData = {
  title: "",
  description: "",
  type: "general",
  priority: "medium",
  status: "pending",
  due_date: null,
  patient_id: "",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "in_progress" | "completed"
  >("all");
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();
  const { toast } = useToast();

  // Inline editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState<InlineFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: doctor } = await supabase
        .from("larinova_doctors")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!doctor) return;

      const { data, error } = await supabase
        .from("larinova_tasks")
        .select(
          `
          *,
          patient:larinova_patients!larinova_tasks_patient_id_fkey(
            full_name,
            patient_code
          )
        `,
        )
        .eq("assigned_to", doctor.id)
        .order("priority", { ascending: false })
        .order("due_date", { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: t("tasks.error"),
        description: t("tasks.failedToLoadTasks"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  const fetchPatients = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("larinova_patients")
        .select("id, full_name, patient_code")
        .order("full_name");
      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchPatients();
  }, [fetchTasks, fetchPatients]);

  // Focus title input when entering edit/add mode
  useEffect(() => {
    if ((isAddingNew || editingTaskId) && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isAddingNew, editingTaskId]);

  const startAddingNew = () => {
    setEditingTaskId(null);
    setFormData(emptyForm);
    setIsAddingNew(true);
  };

  const startEditing = (task: Task) => {
    setIsAddingNew(false);
    setEditingTaskId(task.id);
    setFormData({
      title: task.title || "",
      description: task.description || "",
      type: task.type || "general",
      priority: task.priority || "medium",
      status: task.status || "pending",
      due_date: task.due_date ? new Date(task.due_date) : null,
      patient_id: task.patient_id || "",
    });
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setIsAddingNew(false);
    setFormData(emptyForm);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        type: formData.type,
        priority: formData.priority,
        status: formData.status,
        due_date: formData.due_date?.toISOString() || null,
        patient_id: formData.patient_id || null,
      };

      if (editingTaskId) {
        payload.id = editingTaskId;
      }

      const response = await fetch("/api/tasks", {
        method: editingTaskId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save task");

      toast({
        title: editingTaskId ? t("tasks.taskUpdated") : t("tasks.taskCreated"),
        description: editingTaskId
          ? t("tasks.taskUpdatedSuccess")
          : t("tasks.taskCreatedSuccess"),
      });

      cancelEditing();
      fetchTasks();
    } catch (error) {
      console.error("Error saving task:", error);
      toast({
        title: t("tasks.error"),
        description: t("tasks.failedToSaveTask"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!taskToDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/tasks?id=${taskToDelete.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");

      toast({
        title: t("tasks.taskDeleted"),
        description: t("tasks.taskDeletedSuccess"),
      });

      if (editingTaskId === taskToDelete.id) cancelEditing();
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: t("tasks.error"),
        description: t("tasks.failedToDeleteTask"),
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update task status");

      toast({
        title: t("tasks.statusUpdated"),
        description: t("tasks.statusUpdatedSuccess"),
      });
      fetchTasks();
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: t("tasks.error"),
        description: t("tasks.failedToUpdateStatus"),
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === "id" ? "id-ID" : "en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = (dateString: string | null, status: string) => {
    if (!dateString || status === "completed") return false;
    return new Date(dateString) < new Date();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusVariant = (
    status: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "completed":
        return "secondary";
      case "in_progress":
        return "default";
      default:
        return "outline";
    }
  };

  const renderEditableRow = (taskId: string | null) => (
    <tr
      className="border-b border-border bg-muted transition-colors"
      onKeyDown={handleKeyDown}
    >
      {/* Title */}
      <td className="p-2">
        <Input
          ref={titleInputRef}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder={t("tasks.enterTaskTitle")}
          className="h-8 text-sm bg-secondary border-border"
        />
      </td>
      {/* Type */}
      <td className="p-2">
        <Select
          value={formData.type}
          onValueChange={(v) => setFormData({ ...formData, type: v })}
        >
          <SelectTrigger className="h-8 text-sm bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASK_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`tasks.${type}` as any)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      {/* Priority */}
      <td className="p-2">
        <Select
          value={formData.priority}
          onValueChange={(v) => setFormData({ ...formData, priority: v })}
        >
          <SelectTrigger className="h-8 text-sm bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {t(`tasks.${p}` as any)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      {/* Patient */}
      <td className="p-2">
        <Select
          value={formData.patient_id || "none"}
          onValueChange={(v) =>
            setFormData({ ...formData, patient_id: v === "none" ? "" : v })
          }
        >
          <SelectTrigger className="h-8 text-sm bg-secondary border-border">
            <SelectValue placeholder={t("tasks.selectPatient")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">-</SelectItem>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      {/* Due Date */}
      <td className="p-2">
        <DatePicker
          date={formData.due_date || undefined}
          onDateChange={(date) =>
            setFormData({ ...formData, due_date: date || null })
          }
          placeholder={t("tasks.selectDueDate")}
          className="h-8 text-sm bg-secondary border-border"
        />
      </td>
      {/* Status */}
      <td className="p-2">
        <Select
          value={formData.status}
          onValueChange={(v) => setFormData({ ...formData, status: v })}
        >
          <SelectTrigger className="h-8 text-sm bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`tasks.${s}` as any)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      {/* Actions */}
      <td className="p-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={saving || !formData.title.trim()}
            className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelEditing}
            disabled={saving}
            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 glass-card animate-pulse" />
        <div className="h-96 glass-card animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <div className="glass-card">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t("tasks.title")}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t("tasks.description")}
              </p>
            </div>
            <Button
              onClick={startAddingNew}
              disabled={isAddingNew || !!editingTaskId}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("tasks.addTask")}
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-4">
            {(["all", "pending", "in_progress", "completed"] as const).map(
              (status) => (
                <Button
                  key={status}
                  onClick={() => setFilter(status)}
                  variant={filter === status ? "default" : "outline"}
                  size="sm"
                >
                  {status === "all" ? t("tasks.all") : t(`tasks.${status}`)}
                  {status !== "all" && (
                    <span className="ml-2 text-xs opacity-70">
                      ({tasks.filter((t) => t.status === status).length})
                    </span>
                  )}
                </Button>
              ),
            )}
          </div>
        </div>

        {/* Table — always show even if empty */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr className="border-b border-border">
                <th className="text-left text-sm font-medium text-muted-foreground p-4">
                  {t("tasks.title")}
                </th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">
                  {t("tasks.taskType")}
                </th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">
                  {t("tasks.priority")}
                </th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">
                  {t("tasks.patient")}
                </th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">
                  {t("tasks.dueDate")}
                </th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">
                  {t("tasks.status")}
                </th>
                <th className="text-right text-sm font-medium text-muted-foreground p-4">
                  {t("tasks.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 && !isAddingNew && (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-12">
                      <CheckSquare className="w-16 h-16 text-muted-foreground/30 mb-4" />
                      <p className="text-lg text-muted-foreground mb-2">
                        {filter === "all"
                          ? t("dashboard.noPendingTasks")
                          : t("tasks.noTasksFilter", {
                              filter: t(`tasks.${filter}`),
                            })}
                      </p>
                      {filter === "all" && (
                        <p className="text-sm text-muted-foreground">
                          {t("dashboard.allCaughtUp")}
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {filteredTasks.map((task) => {
                const isEditing = editingTaskId === task.id;

                if (isEditing) {
                  return (
                    <React.Fragment key={task.id}>
                      {renderEditableRow(task.id)}
                    </React.Fragment>
                  );
                }

                return (
                  <tr
                    key={task.id}
                    className="border-b border-border hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => startEditing(task)}
                  >
                    <td className="p-4">
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-foreground capitalize">
                        {t(`tasks.${task.type}` as any)}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge className={getPriorityColor(task.priority)}>
                        {t(`tasks.${task.priority}` as any)}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-foreground">
                        {task.patient?.full_name || "-"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div
                        className={`flex items-center gap-2 text-sm ${isOverdue(task.due_date, task.status) ? "text-red-600" : "text-foreground"}`}
                      >
                        <Calendar className="w-4 h-4" />
                        {formatDate(task.due_date)}
                        {isOverdue(task.due_date, task.status) && (
                          <span className="text-xs text-red-600">
                            ({t("tasks.overdue")})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={getStatusVariant(task.status)}>
                        {t(`tasks.${task.status}` as any)}
                      </Badge>
                    </td>
                    <td
                      className="p-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEditing(task)}>
                            {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {task.status !== "pending" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(task.id, "pending")
                              }
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              {t("tasks.markAsPending")}
                            </DropdownMenuItem>
                          )}
                          {task.status !== "in_progress" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(task.id, "in_progress")
                              }
                            >
                              <Play className="w-4 h-4 mr-2" />
                              {t("tasks.markAsInProgress")}
                            </DropdownMenuItem>
                          )}
                          {task.status !== "completed" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(task.id, "completed")
                              }
                            >
                              <Check className="w-4 h-4 mr-2" />
                              {t("tasks.markAsCompleted")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => confirmDelete(task)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}

              {/* New row being added */}
              {isAddingNew && renderEditableRow(null)}
            </tbody>
          </table>
        </div>

        {/* Add task row button at bottom */}
        {!isAddingNew && !editingTaskId && (
          <div
            className="flex items-center gap-2 px-4 py-3 border-t border-border text-muted-foreground hover:bg-muted cursor-pointer transition-colors"
            onClick={startAddingNew}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">{t("tasks.addTask")}</span>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false);
            setTaskToDelete(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("common.delete")}</DialogTitle>
            <DialogDescription>
              {t("tasks.confirmDeleteTask", {
                title: taskToDelete?.title || "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setTaskToDelete(null);
              }}
              disabled={deleting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirmed}
              disabled={deleting}
            >
              {deleting ? "..." : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
