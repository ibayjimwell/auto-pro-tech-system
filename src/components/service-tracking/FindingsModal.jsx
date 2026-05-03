import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ProductPicker from "./ProductPicker";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { inspectionApi } from "@/api/inspectionApi";
import { notify } from "@/lib/notify";

export default function FindingsModal({
  open,
  onClose,
  onSubmit,
  taskTitle,
  taskId,
  appointmentId,
}) {
  const [finding, setFinding] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleProductDeduct = (product) => {
    setProducts((prev) => [...prev, { ...product, id: Date.now() }]);
  };

  const removeProduct = (id) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const handleSubmit = async () => {
    if (!finding.trim()) {
      notify.error("Please enter a finding description.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        description: finding,
        products: products.map(({ inventoryItemId, qty, sellPrice }) => ({
          inventoryItemId,
          quantity: qty,
          priceAtTime: sellPrice,
        })),
      };
      await inspectionApi.addFinding(taskId, payload);
      notify.success("Finding saved");
      // Call the parent callback (TaskCard) to mark the task as DONE
      if (onSubmit) {
        await onSubmit();
      }
      setFinding("");
      setProducts([]);
      onClose();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to save finding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Findings for: {taskTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">Finding Description *</label>
            <Textarea
              value={finding}
              onChange={(e) => setFinding(e.target.value)}
              placeholder="e.g., Front brake pads worn below 3mm"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Add parts / supplies</label>
            <ProductPicker
              taskId={taskId}
              taskTitle={taskTitle}
              appointmentId={appointmentId}
              usedProducts={products}
              onDeduct={handleProductDeduct}
            />
          </div>

          {products.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold mb-1">Products attached:</p>
              <div className="flex flex-wrap gap-2">
                {products.map((p) => (
                  <Badge key={p.id} variant="secondary" className="gap-1 pr-1">
                    {p.qty}× {p.name}
                    <button
                      onClick={() => removeProduct(p.id)}
                      className="ml-1 text-muted-foreground hover:text-red-500"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-primary" disabled={loading}>
            {loading ? "Saving..." : "Save Findings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}