import {
  KeyRound,
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
export interface PromoModalProps {
  PROMO_CATEGORIES: any;
  courses: any;
  handleSavePromo: any;
  isPromoModalOpen: any;
  name: any;
  promoForm: any;
  selectedPromo: any;
  setIsPromoModalOpen: any;
  setPromoForm: any;
}

export function PromoModal({
  PROMO_CATEGORIES,
  courses,
  handleSavePromo,
  isPromoModalOpen,
  name,
  promoForm,
  selectedPromo,
  setIsPromoModalOpen,
  setPromoForm,
}: PromoModalProps) {
  return (
    <Dialog open={isPromoModalOpen} onOpenChange={setIsPromoModalOpen}>
      <DialogContent className="max-w-xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {selectedPromo ? "Edit Promotion" : "Add Promotion"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Promotion Name</label>
            <Input
              value={promoForm.name || ""}
              onChange={(e) =>
                setPromoForm({ ...promoForm, name: e.target.value })
              }
              placeholder="e.g. Early Bird 2026"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Marketing Channel Category
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={promoForm.category || "seminar"}
              onChange={(e) =>
                setPromoForm({ ...promoForm, category: e.target.value })
              }
            >
              {PROMO_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">
              Categorize this promo code to track which marketing channels
              perform best.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                value={promoForm.type}
                onChange={(e) =>
                  setPromoForm({ ...promoForm, type: e.target.value })
                }
              >
                <option value="code">Promo Code</option>
                <option value="bundle">
                  Course Bundle Automatic (Require 2 Courses)
                </option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                value={promoForm.status}
                onChange={(e) =>
                  setPromoForm({ ...promoForm, status: e.target.value })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Start Date (Optional)
              </label>
              <Input
                type="date"
                value={promoForm.startDate || ""}
                onChange={(e) =>
                  setPromoForm({ ...promoForm, startDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date (Optional)</label>
              <Input
                type="date"
                value={promoForm.endDate || ""}
                onChange={(e) =>
                  setPromoForm({ ...promoForm, endDate: e.target.value })
                }
              />
            </div>
          </div>

          {promoForm.type === "code" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Promo Code</label>
              <div className="flex gap-2">
                <Input
                  value={promoForm.code || ""}
                  onChange={(e) =>
                    setPromoForm({
                      ...promoForm,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g. EARLY26"
                  className="uppercase font-mono flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                    let result = "";
                    for (let i = 0; i < 6; i++) {
                      result += chars.charAt(
                        Math.floor(Math.random() * chars.length),
                      );
                    }
                    setPromoForm({ ...promoForm, code: result });
                  }}
                >
                  Generate
                </Button>
              </div>
            </div>
          )}
          {promoForm.type === "bundle" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Bundle Course 1</label>
                <select
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                  value={promoForm.bundleCourse1}
                  onChange={(e) =>
                    setPromoForm({
                      ...promoForm,
                      bundleCourse1: e.target.value,
                    })
                  }
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} - {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bundle Course 2</label>
                <select
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                  value={promoForm.bundleCourse2}
                  onChange={(e) =>
                    setPromoForm({
                      ...promoForm,
                      bundleCourse2: e.target.value,
                    })
                  }
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} - {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-500 col-span-2">
                System will check if the registering student is taking one
                course and has the other in their registration history, or both
                together if cart allows.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Discount Type</label>
              <Input
                value="Fixed Amount (HKD)"
                disabled
                className="bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Discount Amount (HKD)
              </label>
              <Input
                type="number"
                min="0"
                value={promoForm.discountValue}
                onChange={(e) =>
                  setPromoForm({
                    ...promoForm,
                    discountValue: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2 border-t pt-4 border-slate-100 mt-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-slate-400" /> Admin Password
              Confirm <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              placeholder="Enter your password to save changes"
              value={promoForm.adminPassword || ""}
              onChange={(e) =>
                setPromoForm({ ...promoForm, adminPassword: e.target.value })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsPromoModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSavePromo}>Save Promotion</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
