import {
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";

interface CourseCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newCourse: any;
  setNewCourse: (course: any) => void;
  courseCategories: string[];
  setCategoryManagerOpen: (open: boolean) => void;
  handleCreateCourse: () => void;
  loading: boolean;
}

export function CourseCreationModal({
  open,
  onOpenChange,
  newCourse,
  setNewCourse,
  courseCategories,
  setCategoryManagerOpen,
  handleCreateCourse,
  loading,
}: CourseCreationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
        <DialogHeader className="p-6 pb-2 bg-slate-50/50 rounded-t-lg border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800">
            Create Course Template
          </DialogTitle>
          <DialogDescription>
            Define the master definition for a new curriculum component
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Course Code
                </label>
                <Input
                  placeholder="e.g. AZ-900"
                  value={newCourse.courseCode}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, courseCode: e.target.value })
                  }
                  className="h-10 bg-slate-50/50 border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Course Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setCategoryManagerOpen(true)}
                    className="text-[10px] text-blue-600 font-bold hover:underline"
                  >
                    Manage
                  </button>
                </div>
                <select
                  value={newCourse.category || ""}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, category: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                >
                  <option value="">Select Category</option>
                  {courseCategories.map((c, idx) => (
                    <option key={idx} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 mt-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Course Outline
                </label>
                <Input
                  placeholder="https://... (SharePoint/OneDrive/Docs)"
                  value={newCourse.outlineData || ""}
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      outlineData: e.target.value,
                      outlineName: e.target.value
                        ? "Microsoft Document Link"
                        : "",
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Full Course Title
                </label>
                <textarea
                  placeholder="Enter full descriptive title..."
                  value={newCourse.title}
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      title: e.target.value,
                      certName: e.target.value,
                    })
                  }
                  className="w-full min-h-[80px] rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Course Framework & Modules
                </label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, description: e.target.value })
                  }
                  placeholder={
                    "e.g.\nMODULE 1: Describe cloud concepts\nMODULE 2: Describe Azure architecture and services"
                  }
                  className="w-full min-h-[140px] rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all resize-none placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Certificate Display Name
                </label>
                <Input
                  placeholder="Name as seen on certificate"
                  value={newCourse.certName}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, certName: e.target.value })
                  }
                  className="h-10 bg-slate-50/50 border-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-6 border-b border-slate-100">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Level
              </label>
              <select
                value={newCourse.level}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, level: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none"
              >
                <option value="">Select Level</option>
                <option value="Fundamental">Fundamental</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Duration (Days)
              </label>
              <Input
                type="number"
                placeholder="Days"
                value={newCourse.day}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, day: e.target.value })
                }
                className="h-10 bg-slate-50/50 border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Early Bird (HK$)
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={newCourse.earlyBirdPrice || ""}
                onChange={(e) =>
                  setNewCourse({
                    ...newCourse,
                    earlyBirdPrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="h-10 bg-slate-50/50 border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Standard (HK$)
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={newCourse.standardPrice || ""}
                onChange={(e) =>
                  setNewCourse({
                    ...newCourse,
                    standardPrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="h-10 bg-slate-50/50 border-slate-200"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50/50 rounded-b-lg border-t border-slate-100 flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-500 font-bold text-xs uppercase tracking-widest"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateCourse}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-8 font-bold text-xs uppercase tracking-widest"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Create Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
