import React, { useState, useEffect, useCallback } from 'react';
import PageContainer from '@/components/shared/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { inventoryStore } from '@/services/inventoryStore';
import { notify } from '@/lib/notify';
import {
  Package, Plus, Search, AlertTriangle, RefreshCw,
  Pencil, Trash2, RotateCcw, X, Check
} from 'lucide-react';

const CATEGORIES = ['All', 'Fluids', 'Filters', 'Brakes', 'Ignition', 'Electrical', 'Accessories'];

function StockBadge({ item }) {
  if (item.stockQty === 0) return <Badge className="bg-red-100 text-red-700 border border-red-200 text-[10px]">Out of Stock</Badge>;
  if (item.stockQty <= item.minThreshold) return <Badge className="bg-orange-100 text-orange-700 border border-orange-200 text-[10px]"><AlertTriangle className="w-2.5 h-2.5 mr-0.5" />Low Stock</Badge>;
  return <Badge className="bg-green-100 text-green-700 border border-green-200 text-[10px]">In Stock</Badge>;
}

function ItemForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(item || {
    name: '', sku: '', category: 'Fluids', unit: 'piece',
    stockQty: 0, minThreshold: 5, costPrice: 0, sellPrice: 0
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="p-4 bg-card border border-border rounded-xl space-y-3">
      <p className="font-semibold text-sm font-heading">{item ? 'Edit Item' : 'New Inventory Item'}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
          <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Engine Oil 1L" className="h-8 text-xs" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">SKU</label>
          <Input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="e.g. OIL-1L" className="h-8 text-xs" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full h-8 text-xs rounded-md border border-input bg-transparent px-3 py-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            {['Fluids', 'Filters', 'Brakes', 'Ignition', 'Electrical', 'Accessories', 'Other'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Unit</label>
          <select value={form.unit} onChange={e => set('unit', e.target.value)} className="w-full h-8 text-xs rounded-md border border-input bg-transparent px-3 py-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            {['piece', 'set', 'bottle', 'liter', 'box', 'pair'].map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Stock Qty</label>
          <Input type="number" value={form.stockQty} onChange={e => set('stockQty', +e.target.value)} min={0} className="h-8 text-xs" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Min Threshold (alert below)</label>
          <Input type="number" value={form.minThreshold} onChange={e => set('minThreshold', +e.target.value)} min={0} className="h-8 text-xs" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Cost Price (₱)</label>
          <Input type="number" value={form.costPrice} onChange={e => set('costPrice', +e.target.value)} min={0} className="h-8 text-xs" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Sell Price (₱)</label>
          <Input type="number" value={form.sellPrice} onChange={e => set('sellPrice', +e.target.value)} min={0} className="h-8 text-xs" />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel}><X className="w-3.5 h-3.5 mr-1" />Cancel</Button>
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.name.trim()} className="bg-primary hover:bg-primary/90">
          <Check className="w-3.5 h-3.5 mr-1" /> Save
        </Button>
      </div>
    </div>
  );
}

function RestockModal({ item, onRestock, onCancel }) {
  const [qty, setQty] = useState(1);
  return (
    <div className="p-4 bg-card border border-border rounded-xl space-y-3 max-w-xs">
      <p className="font-semibold text-sm font-heading flex items-center gap-2">
        <RotateCcw className="w-4 h-4 text-primary" /> Restock: {item.name}
      </p>
      <p className="text-xs text-muted-foreground">Current stock: {item.stockQty} {item.unit}(s)</p>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Qty to add</label>
        <Input type="number" value={qty} onChange={e => setQty(+e.target.value)} min={1} className="h-8 text-xs" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={() => onRestock(item.id, qty)} className="bg-primary hover:bg-primary/90">
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restock
        </Button>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [restockItem, setRestockItem] = useState(null);

  const load = useCallback(async () => {
    const data = await inventoryStore.list();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || item.category === category;
    return matchSearch && matchCat;
  });

  const lowStockCount = items.filter(i => i.stockQty <= i.minThreshold).length;

  const handleSave = async (data) => {
    if (editItem) {
      await inventoryStore.update(editItem.id, data);
      notify.success('Item updated');
    } else {
      await inventoryStore.create(data);
      notify.success('Item created');
    }
    setShowForm(false);
    setEditItem(null);
    load();
  };

  const handleDelete = async (id) => {
    await inventoryStore.delete(id);
    notify.success('Item deleted');
    load();
  };

  const handleRestock = async (id, qty) => {
    await inventoryStore.restock(id, qty);
    notify.success(`Restocked successfully`);
    setRestockItem(null);
    load();
  };

  const openEdit = (item) => { setEditItem(item); setShowForm(true); };

  return (
    <PageContainer
      title="Inventory"
      subtitle="Parts & supplies stock management"
      actions={
        <Button size="sm" onClick={() => { setEditItem(null); setShowForm(true); }} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> Add Item
        </Button>
      }
    >
      {/* Low stock alert banner */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-5">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <p className="text-sm font-medium text-orange-700">
            {lowStockCount} item{lowStockCount > 1 ? 's are' : ' is'} at or below minimum stock threshold.
            <span className="font-normal ml-1 text-orange-600">Restock soon to avoid service disruptions.</span>
          </p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="mb-5">
          <ItemForm
            item={editItem}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditItem(null); }}
          />
        </div>
      )}

      {/* Restock modal */}
      {restockItem && (
        <div className="mb-5">
          <RestockModal item={restockItem} onRestock={handleRestock} onCancel={() => setRestockItem(null)} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or SKU..." className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <Button key={c} size="sm" variant={category === c ? 'default' : 'outline'} onClick={() => setCategory(c)}
              className={category === c ? 'bg-primary' : ''}>
              {c}
            </Button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={Package} title="No items found" description="Add parts and supplies to the inventory" />
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold font-heading text-primary">{items.length}</p>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold font-heading text-orange-600">{lowStockCount}</p>
                <p className="text-xs text-muted-foreground">Low / Out of Stock</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold font-heading text-green-700">{items.filter(i => i.stockQty > i.minThreshold).length}</p>
                <p className="text-xs text-muted-foreground">Well Stocked</p>
              </CardContent>
            </Card>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground">ITEM</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground">SKU</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground">CATEGORY</th>
                  <th className="text-center px-4 py-3 font-semibold text-xs text-muted-foreground">STOCK</th>
                  <th className="text-center px-4 py-3 font-semibold text-xs text-muted-foreground">MIN</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs text-muted-foreground">COST</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs text-muted-foreground">SELL</th>
                  <th className="text-center px-4 py-3 font-semibold text-xs text-muted-foreground">STATUS</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${item.stockQty <= item.minThreshold ? 'bg-orange-50/30' : ''}`}>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{item.sku}</td>
                    <td className="px-4 py-3 text-xs">{item.category}</td>
                    <td className="px-4 py-3 text-center font-bold">{item.stockQty} <span className="text-xs font-normal text-muted-foreground">{item.unit}s</span></td>
                    <td className="px-4 py-3 text-center text-xs text-muted-foreground">{item.minThreshold}</td>
                    <td className="px-4 py-3 text-right text-xs">₱{item.costPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-xs font-semibold">₱{item.sellPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center"><StockBadge item={item} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setRestockItem(item)} className="h-7 px-2 text-xs">
                          <RotateCcw className="w-3 h-3 mr-1" />Restock
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(item)} className="h-7 w-7 p-0">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(item => (
              <Card key={item.id} className={item.stockQty <= item.minThreshold ? 'border-orange-200 bg-orange-50/30' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku} · {item.category}</p>
                    </div>
                    <StockBadge item={item} />
                  </div>
                  <div className="flex items-center gap-4 text-xs mb-3">
                    <span>Stock: <strong>{item.stockQty} {item.unit}s</strong></span>
                    <span>Min: <strong>{item.minThreshold}</strong></span>
                    <span>Sell: <strong>₱{item.sellPrice}</strong></span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setRestockItem(item)} className="h-7 text-xs flex-1">
                      <RotateCcw className="w-3 h-3 mr-1" />Restock
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(item)} className="h-7 w-8 p-0">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} className="h-7 w-8 p-0 text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}