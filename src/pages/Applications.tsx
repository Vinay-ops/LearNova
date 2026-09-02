import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { applicationsApi, type ApplicationData } from "@/features/applications";
import { cn } from "@/lib/utils";

type Application = ApplicationData;

const stageColors: Record<string, string> = {
  Preparing: "bg-amber-50 text-amber-700 border-amber-200",
  Applied: "bg-blue-50 text-blue-700 border-blue-200",
  OA: "bg-purple-50 text-purple-700 border-purple-200",
  Interview: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Offer: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Rejected: "bg-red-50 text-red-700 border-red-200",
};

const stages = ["Preparing", "Applied", "OA", "Interview", "Offer", "Rejected"] as const;

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface ApplicationFormData {
  company: string;
  role: string;
  deadline: string;
  stage: string;
  preparation: number;
  notes: string;
}

const emptyForm: ApplicationFormData = {
  company: "",
  role: "",
  deadline: "",
  stage: "Preparing",
  preparation: 0,
  notes: "",
};

export default function Applications() {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [form, setForm] = useState<ApplicationFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const userId = user?.id || "";

  const loadApps = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await applicationsApi.list(userId);
      setApps(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, [userId]);

  const filtered = apps.filter(
    (a) =>
      a.company.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingApp(null);
    setForm(emptyForm);
    setErrors({});
    setShowDialog(true);
  };

  const openEdit = (app: Application) => {
    setEditingApp(app);
    setForm({
      company: app.company,
      role: app.role,
      deadline: app.deadline || "",
      stage: app.stage,
      preparation: app.preparation,
      notes: app.notes || "",
    });
    setErrors({});
    setShowDialog(true);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.company.trim()) errs.company = "Company is required";
    if (!form.role.trim()) errs.role = "Role is required";
    if (!form.deadline) errs.deadline = "Deadline is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !userId) return;
    setSaving(true);
    try {
      if (editingApp) {
        await applicationsApi.update(userId, editingApp.id, {
          company: form.company.trim(),
          role: form.role.trim(),
          deadline: form.deadline,
          stage: form.stage as Application["stage"],
          preparation: form.preparation,
          notes: form.notes.trim(),
        });
      } else {
        await applicationsApi.create(userId, {
          company: form.company.trim(),
          role: form.role.trim(),
          deadline: form.deadline,
          stage: form.stage as Application["stage"],
          preparation: form.preparation,
          notes: form.notes.trim(),
        });
      }
      await loadApps();
      setShowDialog(false);
    } catch (e: any) {
      setError(e?.message || "Failed to save application");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    if (confirm("Are you sure you want to delete this application?")) {
      try {
        await applicationsApi.remove(userId, id);
        await loadApps();
      } catch (e: any) {
        setError(e?.message || "Failed to delete application");
      }
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Track your consulting applications and preparation status.
          </p>
        </div>
        <Button className="gap-1.5 rounded-xl shadow-sm" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Application
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main Card */}
      <div className="rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-border/40 bg-muted/20">
          <Input
            placeholder="Filter by company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm rounded-xl border-border/60 focus:ring-primary/30"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider h-11">Company</TableHead>
                <TableHead className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider h-11">Role</TableHead>
                <TableHead className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider h-11">Deadline</TableHead>
                <TableHead className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider h-11">Stage</TableHead>
                <TableHead className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider h-11">Preparation</TableHead>
                <TableHead className="w-12 h-11" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                    Loading applications...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                    {apps.length === 0
                      ? "No applications yet. Click 'Add Application' to get started."
                      : "No applications match your search."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((app) => (
                  <TableRow key={app.id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell className="font-semibold text-foreground">{app.company}</TableCell>
                    <TableCell className="text-muted-foreground text-sm font-medium">{app.role}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground text-sm">
                      {formatDate(app.deadline)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] font-medium px-2 py-0.5", stageColors[app.stage])}
                      >
                        {app.stage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              app.preparation >= 80
                                ? "bg-emerald-500"
                                : app.preparation >= 60
                                ? "bg-primary"
                                : app.preparation >= 40
                                ? "bg-amber-500"
                                : "bg-red-500"
                            )}
                            style={{ width: `${app.preparation}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-muted-foreground w-8">
                          {app.preparation}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(app)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10" onClick={() => handleDelete(app.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>{editingApp ? "Edit Application" : "Add Application"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Company *</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="e.g. McKinsey"
                className="rounded-xl"
              />
              {errors.company && <p className="text-xs text-red-500">{errors.company}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Role *</Label>
              <Input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. Associate"
                className="rounded-xl"
              />
              {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Deadline *</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="rounded-xl"
              />
              {errors.deadline && <p className="text-xs text-red-500">{errors.deadline}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Stage</Label>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
              >
                {stages.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Preparation ({form.preparation}%)</Label>
              <input
                type="range"
                min={0}
                max={100}
                value={form.preparation}
                onChange={(e) => setForm({ ...form, preparation: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any notes about this application..."
                className="rounded-xl min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSave} className="rounded-xl" disabled={saving}>
              {saving ? "Saving..." : editingApp ? "Save Changes" : "Add Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
