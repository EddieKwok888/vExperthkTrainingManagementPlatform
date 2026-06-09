import {
  Loader2,
  CheckCircle,
  Award,
  Users,
  ShieldCheck,
  Clock,
  Search,
  AlertTriangle,
  ChevronLeft,
  Mail,
  Phone,
  CalendarIcon,
  Download,
  FileText,
  ExternalLink as Link,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Textarea } from "../../../../components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../../components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../../../../components/ui/card";

// Note: Using 'any' for speed and to avoid TS errors.
export interface DeleteConfirmModalProps {
  deleteConfirmOpen: any;
  handleDelete: any;
  itemToDelete: any;
  lessons: any;
  loading: any;
  name: any;
  sessions: any;
  setDeleteConfirmOpen: any;
}

export function DeleteConfirmModal({
  deleteConfirmOpen,
  handleDelete,
  itemToDelete,
  lessons,
  loading,
  name,
  sessions,
  setDeleteConfirmOpen,
}: DeleteConfirmModalProps) {
  return (
    <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 font-bold">
            <ShieldAlert className="w-5 h-5" />
            {itemToDelete?.type === "course"
              ? "Delete Course Template"
              : itemToDelete?.type === "session"
                ? "Delete Course Room"
                : itemToDelete?.type === "lesson"
                  ? "Delete Lesson"
                  : "Delete Registration"}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            <span className="block mb-2 font-semibold text-slate-800 break-words">
              Deleting: {itemToDelete?.name}
            </span>
            {itemToDelete?.type === "course"
              ? "Are you sure you want to delete this course template? This will not affect existing sessions but the template will be permanently removed."
              : itemToDelete?.type === "session"
                ? "Are you sure you want to delete this session? All scheduled lessons and data for this run will be permanently removed."
                : itemToDelete?.type === "lesson"
                  ? "Are you sure you want to delete this lesson? This action cannot be undone."
                  : "Are you sure you want to delete this payment record? This action cannot be undone."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() => setDeleteConfirmOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1 sm:flex-none shadow-sm"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Confirm Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
