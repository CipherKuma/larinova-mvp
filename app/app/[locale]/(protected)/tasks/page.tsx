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
import { toast } from "sonner";

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

  // Inline editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState<InlineFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const saveInFlightRef = useRef(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch("/api/tasks?limit=100");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error(t("tasks.error"), {
        description: t("tasks.failedToLoadTasks"),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchPatients = useCallback(async () => {
    if (patients.length > 0) return;
    try {
      const response = await fetch("/api/patients?limit=500");
      if (!response.ok) throw new Error("Failed to fetch patients");
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  }, [patients.length]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Focus title input when entering edit/add mode
  useEffect(() => {
    if ((isAddingNew || editingTaskId) && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isAddingNew, editingTaskId]);

  const ensurePatientsLoaded = () => {
    fetchPatients();
  };

  const startAddingNew = () => {
    ensurePatientsLoaded();
    setEditingTaskId(null);
    setFormData(emptyForm);
    setIsAddingNew(true);
  };

  const startEditing = (task: Task) => {
    ensurePatientsLoaded();
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
    if (saveInFlightRef.current) return;
    if (!formData.title.trim()) return;
    saveInFlightRef.current = true;
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

      toast.success(
        editingTaskId ? t("tasks.taskUpdated") : t("tasks.taskCreated"),
        {
          description: editingTaskId
            ? t("tasks.taskUpdatedSuccess")
            : t("tasks.taskCreatedSuccess"),
        },
      );

      cancelEditing();
      fetchTasks();
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error(t("tasks.error"), {
        description: t("tasks.failedToSaveTask"),
      });
    } finally {
      saveInFlightRef.current = false;
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

      toast.success(t("tasks.taskDeleted"), {
        description: t("tasks.taskDeletedSuccess"),
      });

      if (editingTaskId === taskToDelete.id) cancelEditing();
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error(t("tasks.error"), {
        description: t("tasks.failedToDeleteTask"),
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

      toast.success(t("tasks.statusUpdated"), {
        description: t("tasks.statusUpdatedSuccess"),
      });
      fetchTasks();
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error(t("tasks.error"), {
        description: t("tasks.failedToUpdateStatus"),
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
      <div className="md:glass-card">
        {/* Header */}
        <div className="px-1 md:px-6 pt-1 md:pt-6 pb-3 md:pb-4 md:border-b md:border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
                {t("tasks.title")}
              </h1>
              <p className="hidden md:block text-sm text-muted-foreground mt-1">
                {t("tasks.description")}
              </p>
            </div>
            {/* Desktop add button — mobile uses FAB */}
            <Button
              onClick={startAddingNew}
              disabled={isAddingNew || !!editingTaskId}
              size="sm"
              className="hidden md:inline-flex"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("tasks.addTask")}
            </Button>
          </div>

          {/* Filters — horizontal scroll on mobile */}
          <div className="-mx-1 md:mx-0 mt-3 md:mt-4 overflow-x-auto">
            <div className="flex gap-2 px-1 md:px-0 min-w-max">
              {(["all", "pending", "in_progress", "completed"] as const).map(
                (status) => (
                  <Button
                    key={status}
                    onClick={() => setFilter(status)}
                    variant={filter === status ? "default" : "outline"}
                    size="sm"
                    className="shrink-0 min-h-[40px]"
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
        </div>

        {/* Mobile card list (read-only) */}
        <div className="md:hidden">
          {filteredTasks.length === 0 && !isAddingNew ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <CheckSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-base text-foreground mb-1 text-center">
                {filter === "all"
                  ? t("dashboard.noPendingTasks")
                  : t("tasks.noTasksFilter", {
                      filter: t(`tasks.${filter}`),
                    })}
              </p>
              {filter === "all" && (
                <p className="text-xs text-muted-foreground text-center">
                  {t("dashboard.allCaughtUp")}
                </p>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-border border-y border-border bg-card">
              {filteredTasks.map((task) => (
                <li key={task.id}>
                  <div className="px-4 py-3.5 min-h-[68px] flex items-start gap-3 active:bg-muted/40">
                    <button
                      type="button"
                      onClick={() => startEditing(task)}
                      className="flex-1 min-w-0 text-left"
                      aria-label={`Edit ${task.title}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-foreground truncate">
                          {task.title}
                        </span>
                        <Badge
                          className={
                            getPriorityColor(task.priority) +
                            " text-[10px] shrink-0"
                          }
                        >
                          {t(`tasks.${task.priority}` as any)}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                        <Badge
                          variant={getStatusVariant(task.status)}
                          className="text-[10px]"
                        >
                          {t(`tasks.${task.status}` as any)}
                        </Badge>
                        {task.patient?.full_name && (
                          <span className="truncate">
                            {task.patient.full_name}
                          </span>
                        )}
                        {task.due_date && (
                          <span
                            className={
                              isOverdue(task.due_date, task.status)
                                ? "text-red-600"
                                : ""
                            }
                          >
                            {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 -mr-2 shrink-0"
                          aria-label={t("tasks.actions")}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto min-h-[300px]">
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

        {/* Add task row button at bottom — desktop only */}
        {!isAddingNew && !editingTaskId && (
          <div
            className="hidden md:flex items-center gap-2 px-4 py-3 border-t border-border text-muted-foreground hover:bg-muted cursor-pointer transition-colors"
            onClick={startAddingNew}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">{t("tasks.addTask")}</span>
          </div>
        )}
      </div>

      {/* Mobile FAB — opens the mobile editor dialog */}
      {!isAddingNew && !editingTaskId && (
        <button
          type="button"
          onClick={startAddingNew}
          aria-label={t("tasks.addTask")}
          className="md:hidden fixed z-40 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          style={{ bottom: "calc(72px + env(safe-area-inset-bottom))" }}
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Mobile add/edit dialog (md and below) */}
      <Dialog
        open={isAddingNew || !!editingTaskId}
        onOpenChange={(open) => {
          if (!open) cancelEditing();
        }}
      >
        <DialogContent className="md:hidden max-w-[calc(100vw-1rem)] sm:max-w-md p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
            <DialogTitle className="text-base">
              {editingTaskId ? t("common.edit") : t("tasks.addTask")}
            </DialogTitle>
          </DialogHeader>
          <div
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
            onKeyDown={handleKeyDown}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("tasks.title")}
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder={t("tasks.enterTaskTitle")}
                className="min-h-[44px]"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  {t("tasks.priority")}
                </label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) =>
                    setFormData({ ...formData, priority: v })
                  }
                >
                  <SelectTrigger className="min-h-[44px]">
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
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  {t("tasks.status")}
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger className="min-h-[44px]">
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
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("tasks.taskType")}
              </label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger className="min-h-[44px]">
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
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("tasks.patient")}
              </label>
              <Select
                value={formData.patient_id || "none"}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    patient_id: v === "none" ? "" : v,
                  })
                }
              >
                <SelectTrigger className="min-h-[44px]">
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
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("tasks.dueDate")}
              </label>
              <DatePicker
                date={formData.due_date || undefined}
                onDateChange={(date) =>
                  setFormData({ ...formData, due_date: date || null })
                }
                placeholder={t("tasks.selectDueDate")}
                className="min-h-[44px]"
              />
            </div>
          </div>
          <DialogFooter
            className="flex flex-row gap-2 px-4 py-3 border-t border-border bg-card"
            style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
          >
            {editingTaskId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const task = tasks.find((t) => t.id === editingTaskId);
                  if (task) {
                    cancelEditing();
                    confirmDelete(task);
                  }
                }}
                disabled={saving}
                className="text-red-600 hover:text-red-700 hover:bg-red-500/10 mr-auto min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={cancelEditing}
              disabled={saving}
              className="min-h-[44px]"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || !formData.title.trim()}
              className="min-h-[44px]"
            >
              {saving ? "..." : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
