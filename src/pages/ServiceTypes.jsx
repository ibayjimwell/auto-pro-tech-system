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
import { Plus, Cog, Pencil } from 'lucide-react';
import { serviceTypesApi } from '@/services/api';
import { notify } from '@/lib/notify';

export default function ServiceTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', basePrice: '', durationMinutes: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await serviceTypesApi.list();
      setTypes(Array.isArray(data) ? data : []);
    } catch { setTypes([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', basePrice: '', durationMinutes: '' });
    setModalOpen(true);
  };

  const openEdit = (st) => {
    setEditing(st);
    setForm({ name: st.name || '', description: st.description || '', basePrice: st.basePrice || '', durationMinutes: st.durationMinutes || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form, basePrice: parseFloat(form.basePrice) || 0, durationMinutes: parseInt(form.durationMinutes) || 0 };
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
      notify.error(err.message || 'Error');
    }
    setSaving(false);
  };

  return (
    <PageContainer
      title="Service Types"
      subtitle="Manage available services"
      actions={
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />Add Service Type
        </Button>
      }
    >
      {loading ? <LoadingSpinner /> : types.length === 0 ? (
        <EmptyState icon={Cog} title="No service types" description="Create your first service type" />
      ) : (
        <>
        {/* Mobile card view */}
        <div className="space-y-3 md:hidden">
          {types.map(st => (
            <Card key={st.id}>
              <CardContent className="p-4 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{st.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{st.description}</p>
                  <p className="text-sm mt-1">₱{st.basePrice?.toFixed(2)} · {st.estimatedMinutes || st.durationMinutes} min</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => openEdit(st)} className="flex-shrink-0">
                  <Pencil className="w-4 h-4" />
                </Button>
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
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.map(st => (
                  <TableRow key={st.id}>
                    <TableCell className="font-semibold">{st.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">{st.description}</TableCell>
                    <TableCell>₱{st.basePrice?.toFixed(2)}</TableCell>
                    <TableCell>{st.estimatedMinutes || st.durationMinutes} min</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(st)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </>
      )}

      <DataModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Service Type' : 'Add Service Type'} onSubmit={handleSave} isLoading={saving}>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Oil Change" />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Service description" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Base Price (₱)</Label>
            <Input type="number" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} placeholder="50.00" />
          </div>
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input type="number" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: e.target.value })} placeholder="30" />
          </div>
        </div>
      </DataModal>
    </PageContainer>
  );
}