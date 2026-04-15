import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/shared/PageContainer';
import DataModal from '@/components/shared/DataModal';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Users, Pencil, Eye } from 'lucide-react';
import { customersApi, vehiclesApi, appointmentsApi } from '@/services/api';
import { notify } from '@/lib/notify';
import CustomerDetail from '@/components/customers/CustomerDetail';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const loadCustomers = async () => {
    try {
      const data = await customersApi.list();
      setCustomers(Array.isArray(data) ? data : []);
    } catch { setCustomers([]); }
    setLoading(false);
  };

  useEffect(() => { loadCustomers(); }, []);

  const openCreate = () => {
    setEditingCustomer(null);
    setForm({ fullName: '', email: '', phone: '' });
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditingCustomer(c);
    setForm({ fullName: c.fullName || '', email: c.email || '', phone: c.phone || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingCustomer) {
        await customersApi.update(editingCustomer.id, form);
        notify.success('Customer updated');
      } else {
        await customersApi.create(form);
        notify.success('Customer created');
      }
      setModalOpen(false);
      loadCustomers();
    } catch (err) {
      notify.error(err.message || 'Error');
    }
    setSaving(false);
  };

  const filtered = customers.filter(c =>
    (c.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  if (selectedCustomer) {
    return <CustomerDetail customer={selectedCustomer} onBack={() => { setSelectedCustomer(null); loadCustomers(); }} />;
  }

  return (
    <PageContainer
      title="Customers"
      subtitle="Manage your customer base"
      actions={
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />Add Customer
        </Button>
      }
    >
      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" description="Add your first customer to get started" />
      ) : (
        <>
        {/* Mobile card view */}
        <div className="space-y-3 md:hidden">
          {filtered.map(c => (
            <Card key={c.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{c.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(c)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Desktop table view */}
        <Card className="hidden md:block">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-semibold">{c.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{c.email}</TableCell>
                    <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(c)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
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

      {/* Create/Edit Modal */}
      <DataModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        onSubmit={handleSave}
        isLoading={saving}
      >
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="John Doe" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="123-456-7890" />
        </div>
      </DataModal>
    </PageContainer>
  );
}