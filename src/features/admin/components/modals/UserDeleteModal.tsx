import {
  ShieldAlert,
  Trash2,
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
export interface UserDeleteModalProps {
  adminPasswordForDelete: any;
  handleDeleteUser: any;
  isDeleteUserModalOpen: any;
  loading: any;
  name: any;
  role: any;
  setAdminPasswordForDelete: any;
  setIsDeleteUserModalOpen: any;
  user: any;
  userToDelete: any;
}

export function UserDeleteModal({
  adminPasswordForDelete,
  handleDeleteUser,
  isDeleteUserModalOpen,
  loading,
  name,
  role,
  setAdminPasswordForDelete,
  setIsDeleteUserModalOpen,
  user,
  userToDelete,
}: UserDeleteModalProps) {
  return (
    <Dialog
      open={isDeleteUserModalOpen}
      onOpenChange={setIsDeleteUserModalOpen}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            Delete User
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this user? This action cannot be
            undone. Please enter your admin password to confirm.
          </DialogDescription>
          {userToDelete && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
              <div className="font-bold text-red-900">
                {userToDelete.name || userToDelete.email}
              </div>
              <div className="text-xs text-red-700">{userToDelete.role}</div>
            </div>
          )}
          <div className="mt-4">
            <Label className="text-xs font-bold text-slate-700 mb-1 block">
              Admin Password
            </Label>
            <Input
              type="password"
              placeholder="Enter your password"
              value={adminPasswordForDelete}
              onChange={(e) => setAdminPasswordForDelete(e.target.value)}
              className="w-full"
            />
          </div>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              setIsDeleteUserModalOpen(false);
              setAdminPasswordForDelete("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteUser}
            disabled={loading || !adminPasswordForDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Deleting..." : "Delete User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
