import React, { useState } from "react";
// UI Components from Shadcn/Radix
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Icons
import { 
  X, 
  ClipboardCheck, 
  PackagePlus, 
  AlertCircle, 
  Package, 
  Trash2, 
  Save 
} from "lucide-react";

// API & Utilities
import ProductPicker from "./ProductPicker";
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
  // --- State Management ---
  const [finding, setFinding] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Handlers ---
  const handleProductDeduct = (product) => {
    // Generates unique local ID for UI tracking before DB submission
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
      // Maps UI product state to API payload
      const payload = {
        description: finding,
        products: products.map(({ inventoryItemId, qty, sellPrice }) => ({
          inventoryItemId,
          quantity: qty,
          priceAtTime: sellPrice,
        })),
      };
      
      await inspectionApi.addFinding(taskId, payload);
      notify.success("Finding saved successfully");
      
      if (onSubmit) {
        await onSubmit();
      }
      
      // Reset state on success
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
      {/* Container: Responsive width with max-height to ensure internal scrollability */}
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header: Visual confirmation of the active task */}
        <DialogHeader className="p-6 bg-primary/5 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white shadow-sm">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">Record Findings</DialogTitle>
              <DialogDescription className="text-xs font-medium uppercase tracking-wider text-primary/70">
                Task: {taskTitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content Area: Prevents modal items from overflowing screen */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">

            <Separator className="opacity-50" />

            {/* Parts Integration Section */}
            <div className="space-y-4">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <PackagePlus className="w-3.5 h-3.5" />
                Linked Parts & Supplies
              </Label>
              
              <div className="bg-muted/30 border border-dashed rounded-2xl p-4 transition-colors hover:bg-muted/50">
                <ProductPicker
                  taskId={taskId}
                  taskTitle={taskTitle}
                  appointmentId={appointmentId}
                  usedProducts={products}
                  onDeduct={handleProductDeduct}
                />
              </div>

              {/* Tag Cloud of Attached Products */}
              {products.length > 0 && (
                <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Items to be billed:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {products.map((p) => (
                      <Badge 
                        key={p.id} 
                        variant="secondary" 
                        className="pl-3 pr-1.5 py-1.5 rounded-full border-primary/10 bg-background shadow-sm flex items-center gap-2 group transition-all hover:border-primary/30"
                      >
                        <Package className="w-3 h-3 text-primary" />
                        <span className="text-xs font-semibold">
                          <span className="text-primary mr-1">{p.qty}×</span> {p.name}
                        </span>
                        <button
                          onClick={() => removeProduct(p.id)}
                          className="p-1 rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Remove item"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Finding Description Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Diagnostic Observation *
                </Label>
              </div>
              <Textarea
                value={finding}
                onChange={(e) => setFinding(e.target.value)}
                placeholder="Detail the issue discovered (e.g., Brake rotor surface is heavily pitted and requires resurfacing...)"
                className="min-h-[120px] rounded-xl border-border focus-visible:ring-primary/20 resize-none shadow-sm leading-relaxed p-4"
                rows={4}
              />
            </div>

          </div>
        </ScrollArea>

        {/* Footer: Persistent action bar */}
        <DialogFooter className="p-6 border-t bg-muted/10 gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            disabled={loading}
            className="rounded-xl px-6 font-semibold"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4 animate-bounce" /> Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Findings
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}