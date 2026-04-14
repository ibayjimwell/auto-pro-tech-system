import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { inventoryStore } from '@/services/inventoryStore';
import { notify } from '@/lib/notify';
import { PackagePlus, Search, AlertTriangle, X, Plus, Minus } from 'lucide-react';

export default function ProductPicker({ taskId, taskTitle, appointmentId, usedProducts = [], onDeduct }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [qty, setQty] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) inventoryStore.list().then(setItems);
  }, [open]);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const getQty = (id) => qty[id] ?? 1;

  const handleDeduct = async (item) => {
    const q = getQty(item.id);
    setLoading(true);
    try {
      const { alert } = await inventoryStore.deductStock(item.id, q, { appointmentId, taskTitle });
      onDeduct({ inventoryItemId: item.id, name: item.name, qty: q, unit: item.unit, sellPrice: item.sellPrice });
      notify.success(`${q} × ${item.name} added to task`);
      if (alert) {
        const msg = alert.level === 'OUT_OF_STOCK'
          ? `⚠️ ${item.name} is now OUT OF STOCK`
          : `⚠️ Low stock: ${item.name} — only ${alert.stockQty} left`;
        notify.warning(msg);
      }
      // Refresh list
      inventoryStore.list().then(setItems);
    } catch (err) {
      notify.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stockColor = (item) => {
    if (item.stockQty === 0) return 'text-red-600 bg-red-50 border-red-200';
    if (item.stockQty <= item.minThreshold) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-700 bg-green-50 border-green-200';
  };

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mt-2"
      >
        <PackagePlus className="w-3.5 h-3.5" />
        {open ? 'Close parts picker' : 'Add parts / supplies'}
      </button>

      {open && (
        <div className="mt-2 border border-border rounded-lg bg-card shadow-sm overflow-hidden">
          <div className="p-2 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search parts by name, SKU, or category..."
                className="pl-7 h-8 text-xs"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No items found</p>
            )}
            {filtered.map(item => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/20 border-b border-border/40 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{item.sku}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0 rounded border ${stockColor(item)}`}>
                      {item.stockQty === 0 ? 'OUT OF STOCK' : `${item.stockQty} ${item.unit}s`}
                      {item.stockQty > 0 && item.stockQty <= item.minThreshold && (
                        <AlertTriangle className="w-2.5 h-2.5 inline ml-0.5" />
                      )}
                    </span>
                    <span className="text-[10px] text-muted-foreground">₱{item.sellPrice}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setQty(q => ({ ...q, [item.id]: Math.max(1, getQty(item.id) - 1) }))}
                    className="w-5 h-5 rounded border border-border flex items-center justify-center text-muted-foreground hover:bg-muted"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-xs font-semibold w-5 text-center">{getQty(item.id)}</span>
                  <button
                    onClick={() => setQty(q => ({ ...q, [item.id]: Math.min(item.stockQty, getQty(item.id) + 1) }))}
                    className="w-5 h-5 rounded border border-border flex items-center justify-center text-muted-foreground hover:bg-muted"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                  <Button
                    size="sm"
                    disabled={item.stockQty === 0 || loading}
                    onClick={() => handleDeduct(item)}
                    className="h-6 px-2 text-[10px] bg-primary hover:bg-primary/90 ml-1"
                  >
                    Use
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Used products list */}
          {usedProducts.length > 0 && (
            <div className="p-2 bg-muted/20 border-t border-border">
              <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Used in this task:</p>
              <div className="flex flex-wrap gap-1.5">
                {usedProducts.map((p, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] gap-1">
                    {p.qty}× {p.name}
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