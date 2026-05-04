import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/shared/PageContainer';
import DataModal from '@/components/shared/DataModal';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Cog, Pencil, Trash2, PowerOff } from 'lucide-react';
import { serviceTypesApi } from '@/api/serviceTypesApi';
import { notify } from '@/lib/notify';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';

export default function ServiceTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(true); // true = show active, false = show disabled
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', basePrice: '', durationMinutes: '' });
  const [saving, setSaving] = useState(false);
  const [deactivateDialog, setDeactivateDialog] = useState({ open: false, id: null, name: '' });
  const [permanentDeleteDialog, setPermanentDeleteDialog] = useState({ open: false, id: null, name: '' });

  const load = async () => {
    try {
      const res = await serviceTypesApi.list(activeFilter);
      const data = res.data?.data || res.data || [];
      setTypes(data);
    } catch (err) {
      console.error(err);
      setTypes([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [activeFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', basePrice: '', durationMinutes: '' });
    setModalOpen(true);
  };

  const openEdit = (st) => {
    setEditing(st);
    setForm({
      name: st.name || '',
      description: st.description || '',
      basePrice: st.basePrice?.toString() || '',
      durationMinutes: st.durationMinutes?.toString() || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        ...form,
        basePrice: parseFloat(form.basePrice) || 0,
        durationMinutes: parseInt(form.durationMinutes, 10) || 0,
      };
      if (editing) {
        await serviceTypesApi.update(editing.id, data);
        notify.success('Service type updated');
      } else {
        await serviceTypesApi.create(data);
        notify.success('Service type created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error');
    }
    setSaving(false);
  };

  const confirmDeactivate = (id, name) => {
    setDeactivateDialog({ open: true, id, name });
  };

  const handleDeactivate = async () => {
    try {
      await serviceTypesApi.deactivate(deactivateDialog.id);
      notify.success('Service type deactivated');
      setDeactivateDialog({ open: false, id: null, name: '' });
      load();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to deactivate');
    }
  };

  const confirmPermanentDelete = (id, name) => {
    setPermanentDeleteDialog({ open: true, id, name });
  };

  const handlePermanentDelete = async () => {
    try {
      await serviceTypesApi.permanentDelete(permanentDeleteDialog.id);
      notify.success('Service type permanently deleted');
      setPermanentDeleteDialog({ open: false, id: null, name: '' });
      load();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '0.00';
    const num = typeof price === 'number' ? price : parseFloat(price);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <PageContainer
      title="Service Types"
      subtitle="Manage available services"
      actions={
        <div className="flex gap-2">
          <div className="flex gap-1 items-center border rounded-md overflow-hidden">
            <button
              onClick={() => setActiveFilter(true)}
              className={`px-3 py-1 text-sm font-medium transition-colors ${activeFilter ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveFilter(false)}
              className={`px-3 py-1 text-sm font-medium transition-colors ${!activeFilter ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Disabled
            </button>
          </div>
          <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />Add Service Type
          </Button>
        </div>
      }
    >
      {types.length === 0 ? (
        <EmptyState icon={Cog} title={`No ${activeFilter ? 'active' : 'disabled'} service types`} description={activeFilter ? 'Create your first service type' : 'Deactivated services will appear here'} />
      ) : (
        <>
          {/* Mobile card view */}
          <div className="space-y-3 md:hidden">
            {types.map((st) => (
              <Card key={st.id}>
                <CardContent className="p-4 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{st.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{st.description}</p>
                    <p className="text-sm mt-1">₱{formatPrice(st.basePrice)} · {st.durationMinutes} min</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(st)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {activeFilter ? (
                      <Button variant="ghost" size="icon" onClick={() => confirmDeactivate(st.id, st.name)} className="text-orange-500">
                        <PowerOff className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => confirmPermanentDelete(st.id, st.name)} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {types.map((st) => (
                    <TableRow key={st.id}>
                      <TableCell className="font-semibold">{st.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">{st.description}</TableCell>
                      <TableCell>₱{formatPrice(st.basePrice)}</TableCell>
                      <TableCell>{st.durationMinutes} min</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(st)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {activeFilter ? (
                            <Button variant="ghost" size="icon" onClick={() => confirmDeactivate(st.id, st.name)} className="text-orange-500 hover:text-orange-700">
                              <PowerOff className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" onClick={() => confirmPermanentDelete(st.id, st.name)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <DataModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit Service Type' : 'Add Service Type'}
        onSubmit={handleSave}
        isLoading={saving}
      >
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Oil Change" />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Service description" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Base Price (₱)</Label>
            <Input type="number" step="0.01" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} placeholder="50.00" />
          </div>
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} placeholder="30" />
          </div>
        </div>
      </DataModal>

      <ConfirmationDialog
        open={deactivateDialog.open}
        onOpenChange={(open) => setDeactivateDialog({ ...deactivateDialog, open })}
        title="Deactivate Service Type"
        description={`Are you sure you want to deactivate "${deactivateDialog.name}"? It will be hidden from customer booking.`}
        onConfirm={handleDeactivate}
        confirmText="Deactivate"
        variant="default"
      />

      <ConfirmationDialog
        open={permanentDeleteDialog.open}
        onOpenChange={(open) => setPermanentDeleteDialog({ ...permanentDeleteDialog, open })}
        title="Permanently Delete Service Type"
        description={`Are you sure you want to permanently delete "${permanentDeleteDialog.name}"? This action cannot be undone.`}
        onConfirm={handlePermanentDelete}
        confirmText="Delete Permanently"
        variant="destructive"
      />
    </PageContainer>
  );
}