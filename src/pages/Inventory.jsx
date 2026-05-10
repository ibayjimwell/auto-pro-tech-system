import React, { useState, useEffect, useCallback } from 'react';
import PageContainer from '@/components/shared/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { inventoryStore } from '@/services/inventoryStore';
import { notify } from '@/lib/notify';
import { cn } from '@/lib/utils';
import {
  Package, Plus, Search, AlertTriangle, RefreshCw,
  Pencil, Trash2, RotateCcw, X, Check, Filter, Layers, Info
} from 'lucide-react';

const CATEGORIES = ['All', 'Fluids', 'Filters', 'Brakes', 'Ignition', 'Electrical', 'Accessories'];

/**
 * StockBadge Component
 * Displays status with color-coded alerts for inventory levels.
 */
function StockBadge({ item }) {
  if (item.stockQty === 0) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase font-black tracking-wider">
        Out of Stock
      </Badge>
    );
  }
  if (item.stockQty <= item.minThreshold) {
    return (
      <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase font-black tracking-wider">
        <AlertTriangle className="w-3 h-3" /> Low Stock
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none px-2 py-0.5 text-[10px] uppercase font-black tracking-wider">
      Well Stocked
    </Badge>
  );
}

/**
 * ItemForm Component
 * Redesigned for better scannability and touch-friendly inputs.
 */
function ItemForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(item || {
    name: '', sku: '', category: 'Fluids', unit: 'piece',
    stockQty: 0, minThreshold: 5, costPrice: 0, sellPrice: 0
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Card className="border-2 border-primary/10 shadow-xl animate-in fade-in zoom-in duration-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-black flex items-center gap-2">
          {item ? <Pencil className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
          {item ? 'Update Inventory Item' : 'Add New Part/Supply'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* General Info */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Item Name *</label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Brake Pads Front" className="h-10 text-sm font-medium focus-visible:ring-primary" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">SKU / Part Number</label>
            <Input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="BP-F-001" className="h-10 text-sm font-medium uppercase" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full h-10 text-sm rounded-lg border border-input bg-background px-3 py-1 font-medium focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer">
              {['Fluids', 'Filters', 'Brakes', 'Ignition', 'Electrical', 'Accessories', 'Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Unit Type</label>
            <select value={form.unit} onChange={e => set('unit', e.target.value)} className="w-full h-10 text-sm rounded-lg border border-input bg-background px-3 py-1 font-medium focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer">
              {['piece', 'set', 'bottle', 'liter', 'box', 'pair'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>

          {/* Inventory Levels */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 text-emerald-600">Current Stock</label>
            <Input type="number" value={form.stockQty} onChange={e => set('stockQty', +e.target.value)} min={0} className="h-10 font-bold border-emerald-100 bg-emerald-50/30" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 text-amber-600">Low Stock Alert</label>
            <Input type="number" value={form.minThreshold} onChange={e => set('minThreshold', +e.target.value)} min={0} className="h-10 font-bold border-amber-100 bg-amber-50/30" />
          </div>

          {/* Pricing */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Cost Price (₱)</label>
            <Input type="number" value={form.costPrice} onChange={e => set('costPrice', +e.target.value)} min={0} className="h-10 font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 text-primary">Sell Price (₱)</label>
            <Input type="number" value={form.sellPrice} onChange={e => set('sellPrice', +e.target.value)} min={0} className="h-10 font-bold border-primary/20 bg-primary/5" />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" size="lg" onClick={onCancel} className="rounded-xl h-11 px-6 font-bold uppercase tracking-wider text-xs">
            Discard
          </Button>
          <Button size="lg" onClick={() => onSave(form)} disabled={!form.name.trim()} className="bg-primary hover:bg-primary/90 rounded-xl h-11 px-8 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
            <Check className="w-4 h-4 mr-2" /> {item ? 'Apply Changes' : 'Confirm Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * RestockModal Component
 * Compact, scrollable modal for quick inventory adjustments.
 */
function RestockModal({ item, onRestock, onCancel }) {
  const [qty, setQty] = useState(1);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <Card className="w-full max-w-sm border-none shadow-2xl rounded-[2rem] overflow-hidden my-auto">
        <div className="bg-primary p-6 text-white text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto">
            <RotateCcw className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight">Restock Item</h3>
          <p className="text-white/80 text-sm font-medium">{item.name}</p>
        </div>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
            <div className="text-center flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase">Current</p>
              <p className="text-lg font-black text-slate-700">{item.stockQty}</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase">New Total</p>
              <p className="text-lg font-black text-primary">{item.stockQty + qty}</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Quantity to add</label>
            <Input type="number" value={qty} onChange={e => setQty(+e.target.value)} min={1} className="h-12 text-center text-xl font-black rounded-2xl border-2 focus-visible:ring-primary" />
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => onRestock(item.id, qty)} className="bg-primary hover:bg-primary/90 h-12 rounded-2xl font-black uppercase tracking-widest text-xs">
              Apply Restock
            </Button>
            <Button variant="ghost" onClick={onCancel} className="h-12 font-bold text-slate-500 uppercase tracking-widest text-xs">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Main Inventory Component
 * Full-scale inventory dashboard with responsive layouts.
 */
export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [restockItem, setRestockItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
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
      notify.success('Item added to inventory');
    }
    setShowForm(false);
    setEditItem(null);
    load();
  };

  const handleDelete = async (id) => {
    if(window.confirm('Delete this item permanently?')) {
        await inventoryStore.delete(id);
        notify.success('Item removed');
        load();
    }
  };

  const handleRestock = async (id, qty) => {
    await inventoryStore.restock(id, qty);
    notify.success(`Successfully restocked`);
    setRestockItem(null);
    load();
  };

  const openEdit = (item) => { setEditItem(item); setShowForm(true); };

  return (
    <PageContainer
      title="Parts Inventory"
      subtitle="Manage and monitor workshop stock levels"
      actions={
        <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 rounded-2xl px-6 h-11 font-black uppercase tracking-widest text-xs">
          <Plus className="w-5 h-5 mr-2" /> Add Part
        </Button>
      }
    >
      {/* Low stock alert banner */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-4 bg-amber-50 border-2 border-amber-100 rounded-3xl px-6 py-4 mb-8 animate-pulse shadow-sm">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Stock Warning</p>
            <p className="text-xs font-medium text-amber-700/80">
              {lowStockCount} items require immediate attention. Replenish stock to maintain service speed.
            </p>
          </div>
        </div>
      )}

      {/* --- Overlay Components --- */}
      {showForm && (
        <div className="mb-8">
          <ItemForm
            item={editItem}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditItem(null); }}
          />
        </div>
      )}

      {restockItem && (
        <RestockModal item={restockItem} onRestock={handleRestock} onCancel={() => setRestockItem(null)} />
      )}

      {/* --- Filter & Search Section --- */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search parts by name, SKU, or keyword..." 
            className="pl-12 h-14 rounded-3xl border-slate-200 bg-white text-base font-medium shadow-sm focus-visible:ring-2" 
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
          <div className="p-1 bg-slate-100/80 rounded-2xl flex gap-1 border border-slate-200/50">
            {CATEGORIES.map(c => (
              <button 
                key={c} 
                onClick={() => setCategory(c)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  category === c 
                    ? "bg-white text-primary shadow-sm ring-1 ring-black/5" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={Package} title="No Inventory Matches" description="We couldn't find any items matching your criteria." />
      ) : (
        <div className="space-y-8">
          {/* --- Summary Dashboard Stats --- */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="rounded-[2rem] border-none bg-primary/5 shadow-none overflow-hidden group">
              <CardContent className="p-6 relative">
                <Layers className="absolute -right-4 -bottom-4 w-24 h-24 text-primary/10 group-hover:scale-110 transition-transform" />
                <p className="text-3xl font-black text-primary">{items.length}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mt-1">Total SKUs</p>
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-none bg-amber-50 shadow-none overflow-hidden group">
              <CardContent className="p-6 relative">
                <AlertTriangle className="absolute -right-4 -bottom-4 w-24 h-24 text-amber-500/10 group-hover:scale-110 transition-transform" />
                <p className="text-3xl font-black text-amber-600">{lowStockCount}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600/60 mt-1">Critical Stock</p>
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-none bg-emerald-50 shadow-none overflow-hidden group">
              <CardContent className="p-6 relative">
                <Check className="absolute -right-4 -bottom-4 w-24 h-24 text-emerald-500/10 group-hover:scale-110 transition-transform" />
                <p className="text-3xl font-black text-emerald-700">{items.filter(i => i.stockQty > i.minThreshold).length}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/60 mt-1">Healthy Units</p>
              </CardContent>
            </Card>
          </div>

          {/* --- Desktop Information Table --- */}
          <div className="hidden md:block rounded-[2.5rem] bg-white border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Part Information</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Level</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Pricing</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(item => (
                  <tr key={item.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">{item.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.sku} • {item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                            <span className={cn("text-lg font-black", item.stockQty <= item.minThreshold ? "text-amber-600" : "text-slate-800")}>
                                {item.stockQty}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unit}s</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Alert at: {item.minThreshold}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                        <p className="text-sm font-bold text-slate-800">₱{item.sellPrice.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 font-medium tracking-tight">Cost: ₱{item.costPrice.toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-5 text-center">
                        <StockBadge item={item} />
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="outline" onClick={() => setRestockItem(item)} className="h-9 rounded-xl font-bold uppercase tracking-widest text-[10px] gap-2 border-slate-200">
                          <RotateCcw className="w-3 h-3" /> Restock
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(item)} className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm">
                          <Pencil className="w-4 h-4 text-slate-600" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/5">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- Mobile Card List --- */}
          <div className="md:hidden space-y-4">
            {filtered.map(item => (
              <Card key={item.id} className="rounded-[2.5rem] border-slate-200 overflow-hidden shadow-sm">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-black text-slate-800 uppercase text-sm leading-tight">{item.name}</p>
                            <p className="text-[10px] font-black text-slate-400 tracking-wider uppercase">{item.category}</p>
                        </div>
                    </div>
                    <StockBadge item={item} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 mb-6">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Stock</p>
                        <p className="text-xl font-black text-slate-800">{item.stockQty} <span className="text-[10px] text-slate-400 font-bold">{item.unit}s</span></p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing</p>
                        <p className="text-xl font-black text-primary">₱{item.sellPrice}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => setRestockItem(item)} className="h-12 bg-slate-900 flex-1 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-2">
                      <RotateCcw className="w-4 h-4" /> Quick Restock
                    </Button>
                    <Button variant="outline" onClick={() => openEdit(item)} className="h-12 w-12 p-0 rounded-2xl border-slate-200 shadow-sm">
                      <Pencil className="w-4 h-4 text-slate-600" />
                    </Button>
                    <Button variant="outline" onClick={() => handleDelete(item.id)} className="h-12 w-12 p-0 rounded-2xl border-slate-200 text-destructive hover:bg-destructive/5">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}