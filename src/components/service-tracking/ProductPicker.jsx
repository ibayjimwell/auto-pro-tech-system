import React, { useState, useEffect } from 'react';
// UI Components from Shadcn
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// API & Utilities
import { inventoryApi } from '@/api/inventoryApi';
import { notify } from '@/lib/notify';

// Icons
import { 
  PackagePlus, 
  Search, 
  AlertTriangle, 
  X, 
  Plus, 
  Minus, 
  Package, 
  ChevronDown, 
  ChevronUp,
  Tag,
  Loader2
} from 'lucide-react';

export default function ProductPicker({ taskId, taskTitle, appointmentId, usedProducts = [], onDeduct }) {
  // --- State Management ---
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [qty, setQty] = useState({});
  const [loading, setLoading] = useState(false);

  // --- Data Fetching ---
  useEffect(() => {
    if (open) loadItems();
  }, [open]);

  const loadItems = async () => {
    try {
      const res = await inventoryApi.list();
      setItems(res.data.data || []);
    } catch (err) {
      console.error("Inventory load failed:", err);
    }
  };

  // --- Search Logic ---
  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase()) ||
    i.category?.toLowerCase().includes(search.toLowerCase())
  );

  const getQty = (id) => qty[id] ?? 1;

  // --- Stock Deduction Handler ---
  const handleDeduct = async (item) => {
    const q = getQty(item.id);
    setLoading(true);
    try {
      const res = await inventoryApi.deductStock(item.id, q);
      onDeduct({
        inventoryItemId: item.id,
        name: item.name,
        qty: q,
        unit: item.unit,
        sellPrice: item.sellPrice,
      });
      notify.success(`${q} × ${item.name} added to finding`);
      
      if (res.data.alert) {
        const msg = res.data.alert.level === 'LOW_STOCK'
          ? `${item.name} is now low stock (${res.data.alert.stockQty} left)`
          : `${item.name} is OUT OF STOCK`;
        notify.warning(msg);
      }
      await loadItems();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to deduct stock');
    } finally {
      setLoading(false);
    }
  };

  // --- Visual Helper: Stock Indicators ---
  const getStockStatus = (item) => {
    if (item.stockQty === 0) return { 
        class: "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800", 
        label: "Out of Stock" 
    };
    if (item.stockQty <= item.minThreshold) return { 
        class: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800", 
        label: `Low Stock: ${item.stockQty} ${item.unit}s` 
    };
    return { 
        class: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800", 
        label: `${item.stockQty} ${item.unit}s available` 
    };
  };

  return (
    <div className="w-full transition-all duration-300">
      {/* Toggle Trigger: Material flat-style button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
          open ? "text-destructive hover:bg-destructive/10" : "text-primary hover:bg-primary/10"
        }`}
      >
        {open ? <X className="w-4 h-4" /> : <PackagePlus className="w-4 h-4" />}
        {open ? 'Cancel Picker' : 'Link Parts & Materials'}
        {open ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
      </Button>

      {open && (
        <div className="mt-3 border border-border rounded-2xl bg-card shadow-xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
          
          {/* Search Header */}
          <div className="p-3 bg-muted/30 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search inventory (Name, SKU, or Type)..."
                className="pl-10 h-10 rounded-xl border-border focus-visible:ring-primary/20 text-sm shadow-inner bg-background"
              />
            </div>
          </div>

          {/* Result List Area */}
          <ScrollArea className="h-72">
            <div className="divide-y divide-border/50">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                  <Package className="w-8 h-8 mb-2" />
                  <p className="text-xs font-medium">No inventory items found</p>
                </div>
              ) : (
                filtered.map(item => {
                  const status = getStockStatus(item);
                  return (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-primary/5 transition-colors group">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {item.name}
                          </p>
                          <Badge variant="outline" className={`text-[10px] px-1.5 h-4 font-bold border-none ${status.class}`}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
                          <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {item.sku}</span>
                          <span className="text-primary font-bold">₱{Number(item.sellPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Tactile Controls */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 bg-muted/20 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setQty(q => ({ ...q, [item.id]: Math.max(1, getQty(item.id) - 1) }))}
                            className="w-8 h-8 rounded-full border-border bg-background shadow-sm hover:border-primary/30"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-black w-8 text-center">{getQty(item.id)}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setQty(q => ({ ...q, [item.id]: Math.min(item.stockQty, getQty(item.id) + 1) }))}
                            className="w-8 h-8 rounded-full border-border bg-background shadow-sm hover:border-primary/30"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <Button
                          size="sm"
                          disabled={item.stockQty === 0 || loading}
                          onClick={() => handleDeduct(item)}
                          className="h-9 px-5 rounded-full font-bold uppercase text-[10px] tracking-widest shadow-md hover:shadow-primary/20 transition-all active:scale-95"
                        >
                          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Use Item"}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Active Items Footer */}
          {usedProducts.length > 0 && (
            <div className="p-3 bg-primary/5 border-t border-primary/10">
              <p className="text-[10px] font-black text-primary/70 uppercase tracking-[0.2em] mb-2 px-1">
                Linked in Current Batch
              </p>
              <div className="flex flex-wrap gap-2">
                {usedProducts.map((p, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary" 
                    className="pl-2 pr-3 py-1 text-[10px] font-bold gap-1.5 border border-primary/10 bg-background shadow-sm rounded-lg"
                  >
                    <span className="text-primary">{p.qty}×</span>
                    {p.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}