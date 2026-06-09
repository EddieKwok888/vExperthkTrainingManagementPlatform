import { doc, collection, setDoc, updateDoc } from "firebase/firestore";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
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
} from "lucide-react";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { db } from "../../../../lib/firebase";
import { toast } from "sonner";

interface CategoryManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseCategories: string[];
  setCourseCategories: (cats: string[]) => void;
  courses: any[];
  setCourses: (updater: (prev: any[]) => any[]) => void;
}

export function CategoryManagerModal({
  open,
  onOpenChange,
  courseCategories,
  setCourseCategories,
  courses,
  setCourses,
}: CategoryManagerModalProps) {
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Manage Course Categories</DialogTitle>
          <DialogDescription>
            Add, rename, or delete categories. Renaming will update all existing
            courses.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              id="newCategoryInput"
              placeholder="New category name"
              className="h-9 text-sm"
            />
            <Button
              className="h-9 px-4 bg-slate-800 text-white"
              onClick={async () => {
                const val = (
                  document.getElementById(
                    "newCategoryInput",
                  ) as HTMLInputElement
                ).value.trim();
                if (val && !courseCategories.includes(val)) {
                  const newCats = [...courseCategories, val];
                  setCourseCategories(newCats);
                  await setDoc(
                    doc(collection(db, "settings"), "course_categories"),
                    { categories: newCats },
                  );
                  (
                    document.getElementById(
                      "newCategoryInput",
                    ) as HTMLInputElement
                  ).value = "";
                }
              }}
            >
              Add
            </Button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {courseCategories.map((cat, idx) => (
              <div
                key={cat}
                className="relative flex gap-1 items-center bg-slate-50 p-1.5 rounded-lg border border-slate-100"
              >
                <div className="flex flex-col -space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    disabled={idx === 0}
                    onClick={async () => {
                      if (idx === 0) return;
                      const newCats = [...courseCategories];
                      [newCats[idx - 1], newCats[idx]] = [
                        newCats[idx],
                        newCats[idx - 1],
                      ];
                      setCourseCategories(newCats);
                      await setDoc(
                        doc(collection(db, "settings"), "course_categories"),
                        { categories: newCats },
                      );
                    }}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    disabled={idx === courseCategories.length - 1}
                    onClick={async () => {
                      if (idx === courseCategories.length - 1) return;
                      const newCats = [...courseCategories];
                      [newCats[idx + 1], newCats[idx]] = [
                        newCats[idx],
                        newCats[idx + 1],
                      ];
                      setCourseCategories(newCats);
                      await setDoc(
                        doc(collection(db, "settings"), "course_categories"),
                        { categories: newCats },
                      );
                    }}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </div>
                <Input
                  defaultValue={cat}
                  id={`cat-edit-${idx}`}
                  className="h-8 text-sm border-transparent bg-transparent outline-none focus-visible:ring-0 focus-visible:border-blue-500 flex-1 ml-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-blue-600 font-medium"
                  onClick={async () => {
                    const newVal = (
                      document.getElementById(
                        `cat-edit-${idx}`,
                      ) as HTMLInputElement
                    ).value.trim();
                    if (newVal && newVal !== cat) {
                      const newCats = [...courseCategories];
                      newCats[idx] = newVal;
                      setCourseCategories(newCats);
                      await setDoc(
                        doc(collection(db, "settings"), "course_categories"),
                        { categories: newCats },
                      );
                      const toUpdate = courses.filter(
                        (c) => c.category === cat,
                      );
                      toUpdate.forEach(async (c) => {
                        await updateDoc(doc(collection(db, "courses"), c.id), {
                          category: newVal,
                        });
                      });
                      setCourses((prev) =>
                        prev.map((c) =>
                          c.category === cat ? { ...c, category: newVal } : c,
                        ),
                      );
                      toast.success(
                        "Category updated for all affected courses.",
                      );
                    }
                  }}
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={async () => {
                    setCategoryToDelete(cat);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                {categoryToDelete === cat && (
                  <div className="absolute right-2 top-1.5 flex gap-1 bg-white p-1 shadow-lg rounded-md border border-red-100 z-10 animate-in fade-in slide-in-from-right-2">
                    <Button
                      size="sm"
                      className="h-6 text-[10px] bg-red-500 hover:bg-red-600 px-2"
                      onClick={async () => {
                        const newCats = courseCategories.filter(
                          (c) => c !== cat,
                        );
                        setCourseCategories(newCats);
                        await setDoc(
                          doc(collection(db, "settings"), "course_categories"),
                          { categories: newCats },
                        );
                        const toUpdate = courses.filter(
                          (c) => c.category === cat,
                        );
                        toUpdate.forEach(async (c) => {
                          await updateDoc(
                            doc(collection(db, "courses"), c.id),
                            { category: "" },
                          );
                        });
                        setCourses((prev) =>
                          prev.map((c) =>
                            c.category === cat ? { ...c, category: "" } : c,
                          ),
                        );
                        setCategoryToDelete(null);
                        toast.success(`Category "${cat}" removed.`);
                      }}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setCategoryToDelete(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
