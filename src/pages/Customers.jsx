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
import { Plus, Search, Users, Pencil, Eye, Trash2, KeyRound } from 'lucide-react';
import { customersApi } from '@/api/customersApi';
import { notify } from '@/lib/notify';
import CustomerDetail from '@/components/customers/CustomerDetail';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });

  const loadCustomers = async () => {
    try {
      const res = await customersApi.list(search);
      // Backend returns { success: true, data: [...] }
      const customersArray = res.data?.data || [];
      setCustomers(customersArray);
    } catch (error) {
      console.error(error);
      setCustomers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const openCreate = () => {
    setEditingCustomer(null);
    setForm({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditingCustomer(c);
    setForm({
      fullName: c.fullName || '',
      email: c.email || '',
      phone: c.phone || '',
      password: '',        // password field appears but optional
      confirmPassword: '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    // Validation
    if (!form.fullName || !form.email || !form.phone) {
      notify.error('Full name, email, and phone are required');
      return;
    }
    if (!editingCustomer && (!form.password || form.password !== form.confirmPassword)) {
      notify.error('Password is required and must match confirmation');
      return;
    }
    if (editingCustomer && form.password && form.password !== form.confirmPassword) {
      notify.error('New password and confirmation do not match');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
      };
      if (!editingCustomer) {
        payload.password = form.password;
        await customersApi.create(payload);
        notify.success('Customer created');
      } else {
        if (form.password) payload.password = form.password;
        await customersApi.update(editingCustomer.id, payload);
        notify.success('Customer updated');
      }
      setModalOpen(false);
      loadCustomers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving customer';
      notify.error(msg);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await customersApi.delete(deleteDialog.id);
      notify.success('Customer deleted');
      setDeleteDialog({ open: false, id: null, name: '' });
      loadCustomers();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error deleting customer');
      setDeleteDialog({ open: false, id: null, name: '' });
    }
  };

  const confirmDelete = (id, name) => {
    setDeleteDialog({ open: true, id, name });
  };

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

      {loading ? (
        <LoadingSpinner />
      ) : customers.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" description="Add your first customer to get started" />
      ) : (
        <>
          {/* Mobile card view */}
          <div className="space-y-3 md:hidden">
            {customers.map((c) => (
              <Card key={c.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{c.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(c)} title="View details">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => confirmDelete(c.id, c.fullName)} title="Delete">
                        <Trash2 className="w-4 h-4 text-destructive" />
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
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-semibold">{c.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email}</TableCell>
                      <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(c)} title="View">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => confirmDelete(c.id, c.fullName)} title="Delete">
                            <Trash2 className="w-4 h-4 text-destructive" />
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
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+63 912 345 6789"
            />
          </div>

          {!editingCustomer && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Create a password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                />
              </div>
            </>
          )}

          {editingCustomer && (
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password (optional)</Label>
              <Input
                id="newPassword"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Leave blank to keep current"
              />
              {form.password && (
                <div className="space-y-2 mt-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </DataModal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteDialog.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog({ open: false, id: null, name: '' })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}