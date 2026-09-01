import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  ExternalLink,
} from "lucide-react";
import { applications } from "@/data/mock-data";
import { cn } from "@/lib/utils";

const stageColors: Record<string, string> = {
  Preparing: "bg-amber-50 text-amber-700 border-amber-200",
  Applied: "bg-blue-50 text-blue-700 border-blue-200",
  OA: "bg-purple-50 text-purple-700 border-purple-200",
  Interview: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Offer: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Rejected: "bg-red-50 text-red-700 border-red-200",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function Applications() {
  const [search, setSearch] = useState("");

  const filtered = applications.filter(
    (a) =>
      a.company.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground mt-1">
            Track your consulting applications and preparation status.
          </p>
        </div>
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Application
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Filter by company or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Preparation</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.company}</TableCell>
                  <TableCell className="text-muted-foreground">{app.role}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatDate(app.deadline)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-medium", stageColors[app.stage])}
                    >
                      {app.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            app.preparation >= 80
                              ? "bg-emerald-600"
                              : app.preparation >= 60
                              ? "bg-primary"
                              : app.preparation >= 40
                              ? "bg-amber-500"
                              : "bg-red-500"
                          )}
                          style={{ width: `${app.preparation}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {app.preparation}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
