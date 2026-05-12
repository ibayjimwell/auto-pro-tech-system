import React, { useState, useEffect, useCallback } from 'react';
import PageContainer from '@/components/shared/PageContainer';
import DataModal from '@/components/shared/DataModal';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Package, 
  Pencil, 
  Trash2, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  MinusCircle,
  Tag,
  Layers,
  DollarSign,
  Filter,
  MoreVertical,
  History
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CATEGORIES = ['Engine', 'Brakes', 'Suspension', 'Electrical', 'Body', 'Interior', 'Fluids', 'Tools', 'Other'];
const UNITS = ['pc', 'set', 'kg', 'liter', 'meter'];

/**
 * Inventory Management Redesign
 * A responsive, modern dashboard for tracking automotive parts and stock.
 */
export default function InventoryManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // --- Modal & Form State ---
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

  // --- Deduction State ---
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

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- Logic Handlers (Unchanged) ---
  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', sku: '', category: '', stockQty: 0, minThreshold: 5, unit: 'pc', costPrice: '', sellPrice: '' });
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

  const openDeduct = (item) => setDeductDialog({ open: true, item, quantity: '' });

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
      title="Inventory Hub"
      subtitle="Comprehensive tracking of automotive parts and supplies"
      actions={
        <Button 
          onClick={openCreate} 
          className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25 rounded-2xl px-6 h-12 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          <span className="font-semibold text-base">New Item</span>
        </Button>
      }
    >
      {/* --- Search & Analytics Strip --- */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 max-w-2xl">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <Input
            placeholder="Search items by name, SKU, or category..."
            className="pl-12 h-14 text-lg rounded-[20px] border-slate-200 bg-white shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white border border-slate-100 p-3 px-5 rounded-[20px] shadow-sm">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 leading-tight">Catalog Size</p>
              <p className="text-lg font-black text-slate-800">{items.length} <span className="text-sm font-medium text-slate-500">Items</span></p>
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Package} title="Inventory is empty" description={search ? "No results found for your search." : "Your catalog is empty. Start adding parts to track stock levels."} />
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* --- Desktop View: Master Table --- */}
          <Card className="hidden lg:block border-none shadow-xl shadow-slate-200/50 rounded-[24px] overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                <TableRow>
                  <TableHead className="pl-8 py-5 h-auto text-slate-500 font-bold uppercase text-[11px] tracking-widest">Part Identification</TableHead>
                  <TableHead className="py-5 h-auto text-slate-500 font-bold uppercase text-[11px] tracking-widest">Category</TableHead>
                  <TableHead className="py-5 h-auto text-slate-500 font-bold uppercase text-[11px] tracking-widest text-center">Availability</TableHead>
                  <TableHead className="py-5 h-auto text-slate-500 font-bold uppercase text-[11px] tracking-widest text-right">Pricing</TableHead>
                  <TableHead className="py-5 h-auto pr-8 text-slate-500 font-bold uppercase text-[11px] tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((item) => (
                  <TableRow key={item.id} className="group transition-colors hover:bg-slate-50/50 border-slate-50">
                    <TableCell className="pl-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                          <Tag className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-base">{item.name}</p>
                          <p className="text-xs font-mono text-slate-400 mt-0.5 tracking-tight">{item.sku}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-lg px-3 py-1 bg-white border-slate-200 text-slate-600 font-semibold shadow-sm">
                        {item.category || 'Unassigned'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2">
                           <span className={cn(
                            "text-lg font-black",
                            item.stockQty <= (item.minThreshold || 0) ? "text-red-500" : "text-green-600"
                          )}>
                            {item.stockQty}
                          </span>
                          <span className="text-xs text-slate-400 font-bold uppercase">{item.unit}</span>
                        </div>
                        {item.stockQty <= (item.minThreshold || 0) && (
                          <div className="flex items-center text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                            <AlertTriangle className="w-3 h-3 mr-1" /> LOW STOCK
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <p className="font-black text-primary text-base tracking-tight">₱{Number(item.sellPrice).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">MSRP</p>
                      </div>
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openDeduct(item)} 
                          className="rounded-xl h-10 px-4 border-slate-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-all font-bold"
                        >
                          <MinusCircle className="w-4 h-4 mr-2" /> Use
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-200/50">
                              <MoreVertical className="w-5 h-5 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-slate-200 w-40 shadow-xl">
                            <DropdownMenuItem onClick={() => openEdit(item)} className="cursor-pointer py-2.5 font-semibold text-slate-700">
                              <Pencil className="w-4 h-4 mr-2" /> Edit Item
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(item.id)} className="cursor-pointer py-2.5 font-semibold text-red-600 focus:text-red-700 focus:bg-red-50">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete Item
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* --- Mobile View: Tactile Cards --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {paginatedItems.map((item) => (
              <Card key={item.id} className="rounded-[24px] border-none shadow-lg shadow-slate-200/50 overflow-hidden bg-white">
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-base">{item.name}</p>
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{item.sku}</p>
                      </div>
                    </div>
                    <Badge className={cn(
                      "rounded-full px-3 py-1 font-black text-[10px]",
                      item.stockQty <= (item.minThreshold || 0) ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                    )}>
                      {item.stockQty} {item.unit}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Category</span>
                      <span className="font-bold text-slate-700">{item.category || '—'}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Retail Price</span>
                      <span className="font-black text-primary">₱{Number(item.sellPrice).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-xl h-11 border-slate-200 text-amber-600 font-bold bg-white active:scale-95 transition-all" onClick={() => openDeduct(item)}>
                      <MinusCircle className="w-4 h-4 mr-2" /> Use
                    </Button>
                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 text-slate-600 bg-white active:scale-95 transition-all" onClick={() => openEdit(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 text-red-500 bg-white active:scale-95 transition-all" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* --- Modern Pagination Controls --- */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 px-2 gap-4">
            <p className="text-sm font-bold text-slate-400">
              Showing <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, items.length)}</span> of <span className="text-slate-800">{items.length}</span> parts
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="rounded-xl h-10 w-10 p-0 border-slate-200 shadow-sm" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center px-4 h-10 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 shadow-sm">
                {currentPage} / {totalPages || 1}
              </div>

              <Button 
                variant="outline" 
                className="rounded-xl h-10 w-10 p-0 border-slate-200 shadow-sm" 
                disabled={currentPage === totalPages || totalPages === 0} 
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- Part Creation/Update Modal --- */}
      <DataModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Update Inventory Part' : 'Register New Part'}
        onSubmit={handleSave}
        isLoading={saving}
      >
        <ScrollArea className="max-h-[90vh] px-1">
          <div className="space-y-6 pb-6">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Tag className="w-5 h-5" />
                <h4 className="font-bold text-sm uppercase tracking-wide">Identity Information</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Display Name <span className="text-red-500">*</span></Label>
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Ceramic Brake Pad" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">SKU / Serial <span className="text-red-500">*</span></Label>
                  <Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="Unique identifier" className="h-11 rounded-xl font-mono" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Layers className="w-5 h-5" />
                  <h4 className="font-bold text-sm uppercase tracking-wide">Categorization</h4>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Category</Label>
                    <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select a system..." /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Unit of Measurement</Label>
                    <Select value={form.unit} onValueChange={v => setForm({...form, unit: v})}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {UNITS.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Package className="w-5 h-5" />
                  <h4 className="font-bold text-sm uppercase tracking-wide">Stock Dynamics</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Initial Qty</Label>
                    <Input type="number" value={form.stockQty} onChange={e => setForm({...form, stockQty: parseInt(e.target.value) || 0})} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Low Threshold</Label>
                    <Input type="number" value={form.minThreshold} onChange={e => setForm({...form, minThreshold: parseInt(e.target.value) || 0})} className="h-11 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <DollarSign className="w-5 h-5" />
                <h4 className="font-bold text-sm uppercase tracking-wide">Financial Settings</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Procurement Cost (₱)</Label>
                  <Input type="number" step="0.01" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Retail Sell Price (₱) <span className="text-red-500">*</span></Label>
                  <Input type="number" step="0.01" value={form.sellPrice} onChange={e => setForm({...form, sellPrice: e.target.value})} className="h-11 rounded-xl border-primary/30 bg-primary/5 focus:bg-white" />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DataModal>

      {/* --- Stock Use Confirmation Dialog --- */}
      <Dialog open={deductDialog.open} onOpenChange={(open) => setDeductDialog({ ...deductDialog, open })}>
        <DialogContent className="sm:max-w-md rounded-[28px] border-none shadow-2xl p-8">
          <DialogHeader className="space-y-3">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mx-auto">
              <History className="w-8 h-8" />
            </div>
            <DialogTitle className="text-center text-2xl font-black text-slate-800">Confirm Usage</DialogTitle>
            <DialogDescription className="text-center text-slate-500 text-base">
              You are about to record the use of <br/>
              <strong className="text-slate-800 underline decoration-amber-500 underline-offset-4">{deductDialog.item?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-widest px-1">
              <span>Quantity to deduct</span>
              <span>Available: {deductDialog.item?.stockQty}</span>
            </div>
            <Input
              type="number"
              placeholder="0"
              className="h-16 text-3xl font-black text-center rounded-[20px] bg-slate-50 border-slate-200 focus:ring-amber-500/20"
              value={deductDialog.quantity}
              onChange={(e) => setDeductDialog({ ...deductDialog, quantity: e.target.value })}
              autoFocus
            />
          </div>
          <DialogFooter className="sm:justify-center gap-3">
            <Button 
              variant="ghost" 
              className="flex-1 rounded-2xl h-12 font-bold text-slate-500" 
              onClick={() => setDeductDialog({ open: false, item: null, quantity: '' })}
            >
              Back
            </Button>
            <Button 
              onClick={handleDeduct} 
              disabled={deducting} 
              className="flex-[2] bg-amber-600 hover:bg-amber-700 text-white rounded-2xl h-12 font-bold shadow-lg shadow-amber-600/20 active:scale-95 transition-all"
            >
              {deducting ? 'Updating Stock...' : 'Confirm Deduction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}