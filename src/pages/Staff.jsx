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
import { Plus, UserCog, Pencil, Trash2, Search, KeyRound, AlertCircle, Copy, Eye, EyeOff } from 'lucide-react';
import { staffApi } from '@/api/staffApi';
import { notify } from '@/lib/notify';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const MODULES = ['Appointments', 'Service Tracking', 'Invoices', 'Customers', 'Vehicles', 'Service Types', 'Staff'];

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    password: '',      // only used when editing (optional)
    role: 'Mechanic',
    active: true,
    permissions: [],
  });
  const [saving, setSaving] = useState(false);
  const [resetDialog, setResetDialog] = useState({ open: false, staff: null, tempPassword: '' });
  const [tempPasswordDialog, setTempPasswordDialog] = useState({ open: false, tempPassword: '', staffName: '' });
  const [showTempPassword, setShowTempPassword] = useState(false);

  const loadStaff = async () => {
    try {
      const res = await staffApi.list(search ? `search=${search}` : '');
      // The array is inside res.data.data (based on your backend response)
      const staffArray = res.data?.data || [];
      setStaffList(staffArray);
    } catch (error) {
      console.error(error);
      setStaffList([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStaff();
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      fullName: '',
      username: '',
      password: '',      // not used for create
      role: 'Mechanic',
      active: true,
      permissions: [],
    });
    setModalOpen(true);
  };

  const openEdit = (staff) => {
    setEditing(staff);
    setForm({
      fullName: staff.fullName || '',
      username: staff.username || '',
      password: '',     // password field appears but is optional
      role: staff.role || 'Mechanic',
      active: staff.active !== false,
      permissions: staff.permissions || [],
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.fullName || !form.username) {
      notify.error('Full name and username are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        // Update: password is optional
        const payload = {
          fullName: form.fullName,
          username: form.username,
          role: form.role,
          active: form.active,
          permissions: form.permissions,
        };
        if (form.password) payload.password = form.password;
        await staffApi.update(editing.id, payload);
        notify.success('Staff updated');
        setModalOpen(false);
        loadStaff();
      } else {
        // Create: no password sent; backend generates a temporary one
        const res = await staffApi.create({
          fullName: form.fullName,
          username: form.username,
          role: form.role,
          active: form.active,
          permissions: form.permissions,
        });
        // Response includes { data: staff, tempPassword: "temp@1234" }
        const tempPw = res.data.tempPassword;
        const staffName = res.data.data.fullName;
        setTempPasswordDialog({
          open: true,
          tempPassword: tempPw,
          staffName,
        });
        setModalOpen(false);
        loadStaff();
        notify.success('Staff created');
      }
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error saving staff');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this staff member?')) {
      try {
        await staffApi.delete(id);
        notify.success('Staff deleted');
        loadStaff();
      } catch (err) {
        notify.error(err.response?.data?.message || 'Error deleting');
      }
    }
  };

  const handleResetPassword = async (staff) => {
    try {
      const res = await staffApi.resetPassword(staff.id);
      setResetDialog({
        open: true,
        staff,
        tempPassword: res.data.tempPassword,
      });
    } catch (err) {
      notify.error('Failed to reset password');
    }
  };

  const togglePermission = (mod) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(mod)
        ? prev.permissions.filter(p => p !== mod)
        : [...prev.permissions, mod],
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    notify.success('Password copied to clipboard');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <PageContainer
      title="Staff Management"
      subtitle="Manage your team members and permissions"
      actions={
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />Add Staff
        </Button>
      }
    >
      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or username..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {staffList.length === 0 ? (
        <EmptyState icon={UserCog} title="No staff found" description="Get started by adding your first team member" />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {staffList.map((staff) => (
              <Card key={staff.id}>
                <CardContent className="p-4 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{staff.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">@{staff.username}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="capitalize text-xs">{staff.role}</Badge>
                      <Badge variant={staff.active ? 'default' : 'secondary'} className={staff.active ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}>
                        {staff.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(staff)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleResetPassword(staff)}>
                      <KeyRound className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(staff.id)}>
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
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffList.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-semibold">{staff.fullName}</TableCell>
                      <TableCell className="text-muted-foreground monospace">{staff.username}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{staff.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={staff.active ? 'default' : 'secondary'} className={staff.active ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}>
                          {staff.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(staff)} title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleResetPassword(staff)} title="Reset password">
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(staff.id)} title="Delete">
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
        title={editing ? 'Edit Staff' : 'Add Staff'}
        onSubmit={handleSave}
        isLoading={saving}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="johndoe" autoComplete="off" />
          </div>
          {/* Password field appears only when editing */}
          {editing && (
            <div className="space-y-2">
              <Label htmlFor="password">New Password (optional)</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Leave blank to keep current"
              />
            </div>
          )}
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
          <div className="flex items-center space-x-2">
            <Checkbox id="active" checked={form.active} onCheckedChange={(checked) => setForm({ ...form, active: !!checked })} />
            <Label htmlFor="active">Active</Label>
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
        </div>
      </DataModal>

      {/* Reset Password Dialog (admin‑initiated) */}
      <Dialog open={resetDialog.open} onOpenChange={(open) => setResetDialog({ ...resetDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Temporary password for <strong>{resetDialog.staff?.fullName}</strong> (username: {resetDialog.staff?.username})
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Temporary password (valid for 24 hours):</p>
            <code className="text-2xl font-mono font-bold text-primary">{resetDialog.tempPassword}</code>
          </div>
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">Provide this password to the staff member. They will be forced to change it on next login.</p>
          </div>
          <Button onClick={() => setResetDialog({ open: false, staff: null, tempPassword: '' })}>Close</Button>
        </DialogContent>
      </Dialog>

      {/* Temporary Password Dialog (shown after creation) */}
      <Dialog open={tempPasswordDialog.open} onOpenChange={(open) => setTempPasswordDialog({ ...tempPasswordDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Staff Created</DialogTitle>
            <DialogDescription>
              Staff <strong>{tempPasswordDialog.staffName}</strong> has been created.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <p className="text-sm text-muted-foreground text-center">Temporary password (valid for 24 hours):</p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-2xl font-mono font-bold text-primary">
                {showTempPassword ? tempPasswordDialog.tempPassword : '••••••••'}
              </code>
              <Button variant="ghost" size="icon" onClick={() => setShowTempPassword(!showTempPassword)}>
                {showTempPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(tempPasswordDialog.tempPassword)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">Provide this password to the staff member. They will be forced to change it on first login.</p>
          </div>
          <Button onClick={() => {
            setTempPasswordDialog({ open: false, tempPassword: '', staffName: '' });
            setShowTempPassword(false);
          }}>Close</Button>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}