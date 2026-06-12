import {
  KeyRound,
  Loader2,
  CheckCircle,
  Award,
  Users,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Clock,
  Search,
  AlertTriangle,
  ChevronLeft,
  Mail,
  CalendarIcon,
  Download,
  FileText,
  ExternalLink as Link,
} from "lucide-react";
import React, { Key, useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
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
export interface UserFormModalProps {
  activeTab: any;
  courses: any;
  customRolePermissions: any;
  getPermission: any;
  handleCreateUser: any;
  handleEditUser: any;
  handlePasswordReset: any;
  isUserModalOpen: any;
  loading: any;
  name: any;
  role: any;
  selectedUser: any;
  setIsUserModalOpen: any;
  setUserForm: any;
  user: any;
  userForm: any;
}

export function UserFormModal({
  activeTab,
  courses,
  customRolePermissions,
  getPermission,
  handleCreateUser,
  handleEditUser,
  handlePasswordReset,
  isUserModalOpen,
  loading,
  name,
  role,
  selectedUser,
  setIsUserModalOpen,
  setUserForm,
  user,
  userForm,
}: UserFormModalProps) {
  const [systemCategories, setSystemCategories] = useState<string[]>([]);

  useEffect(() => {
    if (isUserModalOpen && (userForm.role === "tutor" || userForm.role === "tutor_pt")) {
      const fetchCategories = async () => {
        try {
          const docRef = doc(db, 'settings', 'course_categories');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().categories) {
            setSystemCategories(docSnap.data().categories);
          }
        } catch (error) {
          console.error("Failed to fetch course categories", error);
        }
      };
      fetchCategories();
    }
  }, [isUserModalOpen, userForm.role]);

  return (
    <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
      <DialogContent className="sm:max-w-md">
        {(() => {
          const isTabReadOnly =
            (activeTab === "staff" || activeTab === "students") &&
            getPermission(activeTab) === "view";
          return (
            <>
              <DialogHeader>
                <DialogTitle>
                  {isTabReadOnly
                    ? "User Details"
                    : selectedUser
                      ? "Edit User"
                      : "Create New User"}
                </DialogTitle>
                <DialogDescription>
                  {isTabReadOnly
                    ? `Viewing profile indicators for ${userForm.name || "user"}`
                    : selectedUser
                      ? `Updating profile for ${selectedUser.name}`
                      : "Add a new user to the system. They will need to set their password via email."}
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isTabReadOnly) return;
                  if (selectedUser) {
                    handleEditUser(e);
                  } else {
                    handleCreateUser(e);
                  }
                }}
                className="space-y-4 py-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-bold uppercase text-slate-500">
                      Full Name
                    </label>
                    <Input
                      required
                      disabled={isTabReadOnly}
                      placeholder="John Doe"
                      value={userForm.name || ""}
                      onChange={(e) =>
                        setUserForm({ ...userForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-bold uppercase text-slate-500">
                      Email Address
                    </label>
                    <Input
                      required
                      type="email"
                      disabled={!!selectedUser || isTabReadOnly}
                      placeholder="john@example.com"
                      value={userForm.email || ""}
                      onChange={(e) =>
                        setUserForm({ ...userForm, email: e.target.value })
                      }
                    />
                  </div>
                  {!selectedUser && (
                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-bold uppercase text-slate-500">
                        Custom Password (Optional)
                      </label>
                      <Input
                        type="password"
                        disabled={isTabReadOnly}
                        placeholder="Leave blank to let user set via password reset"
                        value={userForm.password || ""}
                        onChange={(e) =>
                          setUserForm({ ...userForm, password: e.target.value })
                        }
                      />
                      <p className="text-[10px] text-slate-400">
                        If provided, the user account will be created
                        immediately with this password (min 6 chars).
                      </p>
                    </div>
                  )}
                  {selectedUser && !isTabReadOnly && (
                    <div className="space-y-2 col-span-2 mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handlePasswordReset(selectedUser.email)}
                        className="w-full gap-2 text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                      >
                        <KeyRound className="w-4 h-4" /> Send Password Reset
                        Email
                      </Button>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">
                      Role
                    </label>
                    <select
                      className={`w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm ${role !== "admin" || selectedUser?.role === "admin" || selectedUser?.email === "system.admin@vexperthk.com" || isTabReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
                      value={
                        selectedUser?.role === "admin" ||
                        selectedUser?.email === "system.admin@vexperthk.com"
                          ? "admin"
                          : userForm.role || "student"
                      }
                      onChange={(e) =>
                        setUserForm({
                          ...userForm,
                          role: e.target.value as any,
                        })
                      }
                      disabled={
                        role !== "admin" ||
                        selectedUser?.role === "admin" ||
                        selectedUser?.email === "system.admin@vexperthk.com" ||
                        isTabReadOnly
                      }
                    >
                      <option value="student">Student</option>
                      <option value="tutor">Instructor (Full-Time)</option>
                      <option value="tutor_pt">Instructor (Part-Time)</option>
                      <option value="coordinator">Course Coordinator</option>
                      <option value="finance">Finance</option>
                      <option value="staff">Staff (Other)</option>
                      <option value="admin">Admin</option>
                      {customRolePermissions
                        .filter(
                          (r) =>
                            ![
                              "admin",
                              "coordinator",
                              "finance",
                              "staff",
                            ].includes(r.roleId),
                        )
                        .map((r) => (
                          <option key={r.roleId} value={r.roleId}>
                            {r.name} (Custom)
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">
                      Status
                    </label>
                    <select
                      className={`w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm ${selectedUser?.role === "admin" || selectedUser?.email === "system.admin@vexperthk.com" || isTabReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
                      value={
                        selectedUser?.role === "admin" ||
                        selectedUser?.email === "system.admin@vexperthk.com"
                          ? "active"
                          : userForm.status || "active"
                      }
                      onChange={(e) =>
                        setUserForm({
                          ...userForm,
                          status: e.target.value as any,
                        })
                      }
                      disabled={
                        selectedUser?.role === "admin" ||
                        selectedUser?.email === "system.admin@vexperthk.com" ||
                        isTabReadOnly
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-bold uppercase text-slate-500">
                      Phone Number
                    </label>
                    <Input
                      disabled={isTabReadOnly}
                      placeholder="+852 XXXX XXXX"
                      value={userForm.phone || ""}
                      onChange={(e) =>
                        setUserForm({ ...userForm, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-bold uppercase text-slate-500">
                      Company Name
                    </label>
                    <Input
                      disabled={isTabReadOnly}
                      placeholder="e.g. Vantix Limited"
                      value={userForm.company || ""}
                      onChange={(e) =>
                        setUserForm({ ...userForm, company: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-bold uppercase text-slate-500">
                      Admin Remarks
                    </label>
                    <Textarea
                      disabled={isTabReadOnly}
                      placeholder="Internal notes about this user..."
                      className="min-h-[100px]"
                      value={userForm.remarks || ""}
                      onChange={(e) =>
                        setUserForm({ ...userForm, remarks: e.target.value })
                      }
                    />
                  </div>

                  {(userForm.role === "tutor" ||
                    userForm.role === "tutor_pt") && (
                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-bold uppercase text-slate-500">
                        Qualified Categories (Can Teach)
                      </label>
                      <p className="text-xs text-slate-400 pb-1">
                        Select the course categories this instructor is
                        qualified to teach.
                      </p>
                      <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-md p-3 bg-white flex flex-wrap gap-2">
                        {systemCategories.length > 0 ? (
                          systemCategories.map((category) => {
                            const isSelected =
                              userForm.qualifiedCategories?.includes(
                                category,
                              ) || false;
                            return (
                              <label
                                key={String(category)}
                                className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-full border text-sm transition-colors ${isSelected ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"} ${isTabReadOnly ? "pointer-events-none opacity-80" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  disabled={isTabReadOnly}
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (isTabReadOnly) return;
                                    const currentCats =
                                      userForm.qualifiedCategories || [];
                                    if (e.target.checked) {
                                      setUserForm({
                                        ...userForm,
                                        qualifiedCategories: [
                                          ...currentCats,
                                          category,
                                        ],
                                      });
                                    } else {
                                      setUserForm({
                                        ...userForm,
                                        qualifiedCategories: currentCats.filter(
                                          (c) => c !== category,
                                        ),
                                      });
                                    }
                                  }}
                                />
                                {String(category)}
                              </label>
                            );
                          })
                        ) : (
                          <span className="text-xs text-slate-500 italic">
                            Loading categories...
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUserModalOpen(false)}
                  >
                    {isTabReadOnly ? "Close" : "Cancel"}
                  </Button>
                  {!isTabReadOnly && (
                    <Button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : selectedUser ? (
                        "Save Changes"
                      ) : (
                        "Create User"
                      )}
                    </Button>
                  )}
                </DialogFooter>
              </form>
            </>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
