import React, { useState, useEffect, useCallback } from 'react';
import PageContainer from '@/components/shared/PageContainer';
import DataModal from '@/components/shared/DataModal';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Package, 
  Pencil, 
  Trash2, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  MinusCircle
} from 'lucide-react';
import { inventoryApi } from '@/api/inventoryApi';
import { notify } from '@/lib/notify';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const CATEGORIES = ['Engine', 'Brakes', 'Suspension', 'Electrical', 'Body', 'Interior', 'Fluids', 'Tools', 'Other'];
const UNITS = ['pc', 'set', 'kg', 'liter', 'meter'];

export default function InventoryManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    stockQty: 0,
    minThreshold: 5,
    unit: 'pc',
    costPrice: '',
    sellPrice: '',
  });

  // Deduction dialog
  const [deductDialog, setDeductDialog] = useState({ open: false, item: null, quantity: '' });
  const [deducting, setDeducting] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const res = await inventoryApi.list(search);
      setItems(res.data?.data || []);
    } catch (error) {
      console.error(error);
      setItems([]);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    loadItems();
    setCurrentPage(1);
  }, [loadItems, search]);

  // Pagination
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Form handlers
  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      sku: '',
      category: '',
      stockQty: 0,
      minThreshold: 5,
      unit: 'pc',
      costPrice: '',
      sellPrice: '',
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || '',
      sku: item.sku || '',
      category: item.category || '',
      stockQty: item.stockQty ?? 0,
      minThreshold: item.minThreshold ?? 5,
      unit: item.unit || 'pc',
      costPrice: item.costPrice?.toString() || '',
      sellPrice: item.sellPrice?.toString() || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.sku || !form.sellPrice) {
      notify.error('Name, SKU, and Sell Price are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        stockQty: Number(form.stockQty),
        minThreshold: Number(form.minThreshold),
        costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
        sellPrice: parseFloat(form.sellPrice),
      };
      if (editing) {
        await inventoryApi.update(editing.id, payload);
        notify.success('Item updated');
      } else {
        await inventoryApi.create(payload);
        notify.success('Item created');
      }
      setModalOpen(false);
      loadItems();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to save item');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this item permanently?')) {
      try {
        await inventoryApi.delete(id);
        notify.success('Item deleted');
        loadItems();
      } catch (err) {
        notify.error('Delete failed');
      }
    }
  };

  const openDeduct = (item) => {
    setDeductDialog({ open: true, item, quantity: '' });
  };

  const handleDeduct = async () => {
    const qty = parseInt(deductDialog.quantity);
    if (isNaN(qty) || qty <= 0) {
      notify.error('Enter a valid positive quantity');
      return;
    }
    if (qty > deductDialog.item.stockQty) {
      notify.error(`Only ${deductDialog.item.stockQty} units available`);
      return;
    }
    setDeducting(true);
    try {
      const res = await inventoryApi.deductStock(deductDialog.item.id, qty);
      notify.success(`Stock deducted: ${qty} used`);
      if (res.data?.alert?.level === 'LOW_STOCK') {
        notify.warning(`Low stock alert! Only ${res.data.alert.stockQty} left.`);
      }
      loadItems();
      setDeductDialog({ open: false, item: null, quantity: '' });
    } catch (err) {
      notify.error(err.response?.data?.message || 'Stock deduction failed');
    }
    setDeducting(false);
  };

  if (loading && items.length === 0) return <LoadingSpinner />;

  return (
    <PageContainer
      title="Inventory Management"
      subtitle="Track parts, supplies, and stock levels"
      actions={
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl px-6">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      }
    >
      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, SKU, or category..."
            className="pl-10 rounded-2xl border-slate-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-4 py-2 rounded-full">
          <Package className="w-3 h-3" />
          {items.length} total items
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Package} title="No inventory items" description={search ? "Try a different search" : "Start by adding a new part or supply."} />
      ) : (
        <div className="space-y-6">
          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {paginatedItems.map((item) => (
              <Card key={item.id} className="rounded-2xl border-slate-100 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{item.sku}</p>
                    </div>
                    <Badge className={cn(
                      "rounded-full text-[10px] font-black",
                      item.stockQty <= (item.minThreshold || 0) ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                    )}>
                      {item.stockQty} {item.unit}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{item.category || 'Uncategorized'}</span>
                    <span className="font-bold text-primary">₱{Number(item.sellPrice).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="ghost" size="sm" onClick={() => openDeduct(item)} className="h-8 text-amber-600">
                      <MinusCircle className="w-4 h-4 mr-1" /> Use
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="h-8">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="h-8 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table */}
          <Card className="hidden md:block rounded-2xl border-slate-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="pl-6">Item / SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Sell Price</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell className="pl-6">
                      <div>
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <code className="text-xs text-slate-400">{item.sku}</code>
                      </div>
                    </TableCell>
                    <TableCell>{item.category || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-mono font-bold",
                          item.stockQty <= (item.minThreshold || 0) ? "text-red-500" : "text-green-600"
                        )}>
                          {item.stockQty}
                        </span>
                        {item.stockQty <= (item.minThreshold || 0) && (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      ₱{Number(item.sellPrice).toFixed(2)}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                        <Button variant="ghost" size="icon" onClick={() => openDeduct(item)} className="h-8 w-8 text-amber-600">
                          <MinusCircle className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2">
            <p className="text-xs text-slate-400">Page {currentPage} of {totalPages || 1}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <DataModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit Inventory Item' : 'Add New Item'}
        onSubmit={handleSave}
        isLoading={saving}
      >
        <div className="space-y-4 px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Item Name *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Brake Pad Set" />
            </div>
            <div className="space-y-2">
              <Label>SKU * (Unique)</Label>
              <Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="e.g., BP-FRONT-001" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={form.unit} onValueChange={v => setForm({...form, unit: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Stock Quantity</Label>
              <Input type="number" value={form.stockQty} onChange={e => setForm({...form, stockQty: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label>Min Threshold</Label>
              <Input type="number" value={form.minThreshold} onChange={e => setForm({...form, minThreshold: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label>Cost Price (₱)</Label>
              <Input type="number" step="0.01" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Selling Price (₱) *</Label>
            <Input type="number" step="0.01" value={form.sellPrice} onChange={e => setForm({...form, sellPrice: e.target.value})} />
          </div>
        </div>
      </DataModal>

      {/* Stock Deduction Dialog */}
      <Dialog open={deductDialog.open} onOpenChange={(open) => setDeductDialog({ ...deductDialog, open })}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Use Stock Item</DialogTitle>
            <DialogDescription>
              Deduct inventory for <strong>{deductDialog.item?.name}</strong><br />
              Available: {deductDialog.item?.stockQty} {deductDialog.item?.unit}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label>Quantity to use</Label>
            <Input
              type="number"
              placeholder="Enter quantity"
              value={deductDialog.quantity}
              onChange={(e) => setDeductDialog({ ...deductDialog, quantity: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeductDialog({ open: false, item: null, quantity: '' })}>Cancel</Button>
            <Button onClick={handleDeduct} disabled={deducting} className="bg-amber-600 hover:bg-amber-700">
              {deducting ? 'Processing...' : 'Confirm Use'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}