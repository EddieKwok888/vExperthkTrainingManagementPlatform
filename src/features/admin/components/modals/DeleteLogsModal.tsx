import {
  Loader2,
  CheckCircle,
  Award,
  Users,
  ShieldCheck,
  ShieldAlert,
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
export interface DeleteLogsModalProps {
  adminPasswordForLogDelete: any;
  handleDeleteLogsByDate: any;
  isDeleteLogsModalOpen: any;
  loading: any;
  logDeleteDate: any;
  setAdminPasswordForLogDelete: any;
  setIsDeleteLogsModalOpen: any;
  setLogDeleteDate: any;
}

export function DeleteLogsModal({
  adminPasswordForLogDelete,
  handleDeleteLogsByDate,
  isDeleteLogsModalOpen,
  loading,
  logDeleteDate,
  setAdminPasswordForLogDelete,
  setIsDeleteLogsModalOpen,
  setLogDeleteDate,
}: DeleteLogsModalProps) {
  return (
    <Dialog
      open={isDeleteLogsModalOpen}
      onOpenChange={setIsDeleteLogsModalOpen}
    >
      <DialogContent className="max-w-md bg-white border-none shadow-2xl p-0 overflow-hidden rounded-2xl">
        <div className="bg-red-600 px-6 py-5">
          <DialogTitle className="text-xl font-bold text-white mb-1">
            Delete System Logs
          </DialogTitle>
          <DialogDescription className="text-red-100 text-xs">
            Permanently delete logs for a specific month or date.
          </DialogDescription>
        </div>
        <form onSubmit={handleDeleteLogsByDate} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Select Date to Delete
            </label>
            <Input
              type="date"
              value={logDeleteDate}
              onChange={(e) => setLogDeleteDate(e.target.value)}
              required
            />
            <p className="text-xs text-slate-500">
              All logs matching this exact date (in your local timezone) will be
              deleted.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Admin Password
            </label>
            <Input
              type="password"
              placeholder="Enter admin password to confirm"
              value={adminPasswordForLogDelete}
              onChange={(e) => setAdminPasswordForLogDelete(e.target.value)}
              required
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteLogsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 font-bold"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Confirm Delete
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
