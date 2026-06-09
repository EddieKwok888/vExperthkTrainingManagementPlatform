import { deleteDoc, doc } from "firebase/firestore";
import { toast } from "sonner";
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
export interface DeletePromoModalProps {
  PROMO_CATEGORIES: any;
  db: any;
  doc: any;
  fetchData: any;
  isDeletePromoModalOpen: any;
  name: any;
  promoToDelete: any;
  promotions: any;
  setIsDeletePromoModalOpen: any;
}

export function DeletePromoModal({
  PROMO_CATEGORIES,
  db,
  doc,
  fetchData,
  isDeletePromoModalOpen,
  name,
  promoToDelete,
  promotions,
  setIsDeletePromoModalOpen,
}: DeletePromoModalProps) {
  return (
    <Dialog
      open={isDeletePromoModalOpen}
      onOpenChange={setIsDeletePromoModalOpen}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Promotion</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete the promotion "{promoToDelete?.name}
            "? This action cannot be undone.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsDeletePromoModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={async () => {
              if (!promoToDelete) return;
              try {
                await deleteDoc(doc(db, "promotions", promoToDelete.id));
                toast.success("Promotion deleted successfully");
                setIsDeletePromoModalOpen(false);
                fetchData();
              } catch (e) {
                toast.error("Failed to delete promotion");
              }
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
