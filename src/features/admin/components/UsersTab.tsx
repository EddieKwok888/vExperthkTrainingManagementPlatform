import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  ArrowLeftRight,
  Download,
  Edit2,
  ExternalLink,
  FileText,
  KeyRound,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Eye,
} from "lucide-react";
import { ReadOnlyAlert } from "./ReadOnlyAlert";

export interface UsersTabProps {
  activeTab: string;
  getPermission: (module: string) => string;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  filteredUsers: any[];
  setUserForm: (val: any) => void;
  setIsUserModalOpen: (val: boolean) => void;
  setIsUserViewModalOpen: (val: boolean) => void;
  handleExportCSV: (data: any[], type: string) => void;
  handleSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  setSelectedUser: (user: any) => void;
  handlePasswordReset: (email: string) => void;
  setUserToDelete: (user: any) => void;
  setIsDeleteUserModalOpen: (val: boolean) => void;
  schoolInfo: any;
  formatHkDate: (dateStr: string) => string;
  navigate: (path: string) => void;
  role: string;
}

export function UsersTab({
  activeTab,
  getPermission,
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  filteredUsers,
  setUserForm,
  setIsUserModalOpen,
  setIsUserViewModalOpen,
  handleExportCSV,
  handleSort,
  sortConfig,
  setSelectedUser,
  handlePasswordReset,
  setUserToDelete,
  setIsDeleteUserModalOpen,
  schoolInfo,
  formatHkDate,
  navigate,
  role,
}: UsersTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, activeTab]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <ReadOnlyAlert moduleKey={activeTab} getPermission={getPermission} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder={
                activeTab === "staff" ? "Search staff..." : "Search students..."
              }
              className="pl-9 w-64 h-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {activeTab === "staff" && (
            <select
              className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="tutor">Instructors (Full-Time)</option>
              <option value="tutor_pt">Instructors (Part-Time)</option>
              <option value="staff">Staff</option>
            </select>
          )}
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        {getPermission(activeTab) !== "view" && (
          <Button
            onClick={() => {
              setSelectedUser(null);
              setUserForm({
                role: activeTab === "staff" ? "tutor" : "student",
                status: "active",
                qualifiedCategories: [],
              });
              setIsUserModalOpen(true);
            }}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />{" "}
            {activeTab === "staff" ? "Add Staff" : "Add Student"}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>
              {activeTab === "staff" ? "Staff Directory" : "Student Directory"}
            </CardTitle>
            <CardDescription>
              {activeTab === "staff"
                ? "Directory of system admins, instructors and staff"
                : "Directory of all students"}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleExportCSV(
                filteredUsers,
                activeTab === "staff" ? "staff" : "students",
              )
            }
            className="gap-2 h-8"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort("name")}
                >
                  User
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort("role")}
                >
                  Role
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort("status")}
                >
                  Status
                </TableHead>
                {activeTab === "staff" && <TableHead>Admin Remarks</TableHead>}
                <TableHead
                  className="cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort("createdAt")}
                >
                  Joined At
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-slate-500"
                  >
                    No users found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                          {u.name
                            ? u.name[0]
                            : u.email
                              ? u.email[0].toUpperCase()
                              : "?"}
                        </div>
                        <div className="flex flex-col">
                          <p className="font-medium text-slate-800 leading-tight">
                            {u.name || "No Name"}
                          </p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : u.role === "coordinator"
                              ? "bg-indigo-100 text-indigo-700"
                              : u.role === "finance"
                                ? "bg-emerald-100 text-emerald-700"
                                : u.role === "tutor" || u.role === "tutor_pt"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {u.role === "tutor_pt"
                          ? "Instructor (Part-Time)"
                          : u.role === "tutor"
                            ? "Instructor (Full-Time)"
                            : u.role === "coordinator"
                              ? "Course Coordinator"
                              : u.role === "finance"
                                ? "Finance"
                                : u.role === "staff"
                                  ? "Staff (Other)"
                                  : u.role === "admin"
                                    ? "Admin"
                                    : u.role === "student"
                                      ? "Student"
                                      : u.role
                                        ? String(u.role).toUpperCase()
                                        : "STUDENT"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`flex items-center gap-1 text-[10px] font-bold uppercase ${
                          u.status === "active"
                            ? "text-green-600"
                            : u.status === "suspended"
                              ? "text-red-600"
                              : "text-slate-400"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === "active"
                              ? "bg-green-600"
                              : u.status === "suspended"
                                ? "bg-red-600"
                                : "bg-slate-400"
                          }`}
                        />
                        {u.status || "inactive"}
                      </span>
                    </TableCell>
                    {activeTab === "staff" && (
                      <TableCell
                        className="text-[10px] text-slate-600 max-w-[200px] whitespace-pre-wrap break-words"
                        title={u.remarks || ""}
                      >
                        {u.remarks || "-"}
                      </TableCell>
                    )}
                    <TableCell className="text-xs text-slate-500">
                      {formatHkDate(u.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {u.role === "student" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-indigo-600 cursor-pointer"
                            onClick={() => navigate(`/admin/student/${u.id}`)}
                            title="Student 360 View"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {getPermission(activeTab) !== "view" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-amber-600"
                            onClick={() => handlePasswordReset(u.email)}
                            title="Reset Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {(u.role === "tutor" || u.role === "tutor_pt") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            title="View Profile & Export CV"
                            onClick={() => {
                              setSelectedUser(u);
                              setIsUserViewModalOpen(true);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-slate-605"
                          title={
                            getPermission(activeTab) === "view"
                              ? "View Details"
                              : "Edit User"
                          }
                          onClick={() => {
                            setSelectedUser(u);
                            setUserForm({
                              name: u.name,
                              email: u.email,
                              role: u.role,
                              status: u.status,
                              phone: u.phone,
                              company: u.company,
                              qualifiedCategories: u.qualifiedCategories || [],
                              remarks: u.remarks,
                            });
                            setIsUserModalOpen(true);
                          }}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                        {role === "admin" &&
                          getPermission(activeTab) !== "view" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 px-2 ${u.email === "system.admin@vexperthk.com" || u.role === "admin" ? "opacity-50 cursor-not-allowed" : "text-red-600 hover:text-red-700 hover:bg-red-50"}`}
                              disabled={
                                u.email === "system.admin@vexperthk.com" ||
                                u.role === "admin"
                              }
                              onClick={() => {
                                if (
                                  u.email === "system.admin@vexperthk.com" ||
                                  u.role === "admin"
                                )
                                  return;
                                setUserToDelete(u);
                                setIsDeleteUserModalOpen(true);
                              }}
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {filteredUsers.length > 10 && (
          <div className="flex justify-end p-4 border-t border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Page</span>
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="bg-white border border-slate-300 text-slate-700 text-xs rounded focus:ring-blue-500 focus:border-blue-500 block px-2 py-1 outline-none font-medium cursor-pointer"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <option key={page} value={page}>{page}</option>
                ))}
              </select>
              <span className="text-xs text-slate-500 font-medium">of {totalPages}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
