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
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, UserCog, Pencil, Trash2, Search } from 'lucide-react';
import { staffApi } from '@/services/api';
import { notify } from '@/lib/notify';

const MODULES = ['Appointments', 'Service Tracking', 'Invoices', 'Customers', 'Vehicles', 'Service Types', 'Staff'];

export default function Staff() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', role: 'Mechanic', active: true, permissions: [] });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await staffApi.list(search ? `search=${search}` : '');
      setStaffList(Array.isArray(data) ? data : []);
    } catch { setStaffList([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ fullName: '', email: '', role: 'Mechanic', active: true, permissions: [] });
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ fullName: s.fullName || '', email: s.email || '', role: s.role || 'Mechanic', active: s.active !== false, permissions: s.permissions || [] });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await staffApi.update(editing.id, form);
        notify.success('Staff updated');
      } else {
        await staffApi.create(form);
        notify.success('Staff created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      notify.error(err.message || 'Error');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await staffApi.delete(id);
      notify.success('Staff deleted');
      load();
    } catch (err) {
      notify.error(err.message || 'Error');
    }
  };

  const togglePermission = (mod) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(mod) ? prev.permissions.filter(p => p !== mod) : [...prev.permissions, mod]
    }));
  };

  return (
    <PageContainer
      title="Staff Management"
      subtitle="Manage your team"
      actions={
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />Add Staff
        </Button>
      }
    >
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search staff..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? <LoadingSpinner /> : staffList.length === 0 ? (
        <EmptyState icon={UserCog} title="No staff found" description="Add your first team member" />
      ) : (
        <>
        {/* Mobile card view */}
        <div className="space-y-3 md:hidden">
          {staffList.map(s => (
            <Card key={s.id}>
              <CardContent className="p-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{s.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="capitalize text-xs">{s.role}</Badge>
                    <Badge variant={s.active !== false ? 'default' : 'secondary'} className={s.active !== false ? 'bg-green-500/10 text-green-600 border-green-500/20 text-xs' : 'text-xs'}>
                      {s.active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
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
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-semibold">{s.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{s.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{s.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.active !== false ? 'default' : 'secondary'} className={s.active !== false ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}>
                        {s.active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
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

      <DataModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Staff' : 'Add Staff'} onSubmit={handleSave} isLoading={saving}>
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="John Doe" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@staff.com" />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Staff">Staff</SelectItem>
              <SelectItem value="Mechanic">Mechanic</SelectItem>
              <SelectItem value="Cashier">Cashier</SelectItem>
              <SelectItem value="Senior Mechanic">Senior Mechanic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Module Permissions</Label>
          <div className="grid grid-cols-2 gap-2">
            {MODULES.map(mod => (
              <label key={mod} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                <Checkbox checked={form.permissions.includes(mod)} onCheckedChange={() => togglePermission(mod)} />
                <span className="text-sm">{mod}</span>
              </label>
            ))}
          </div>
        </div>
      </DataModal>
    </PageContainer>
  );
}