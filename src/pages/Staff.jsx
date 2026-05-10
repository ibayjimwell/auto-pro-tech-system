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
import { 
  Plus, 
  UserCog, 
  Pencil, 
  Trash2, 
  Search, 
  KeyRound, 
  AlertCircle, 
  Copy, 
  Eye, 
  EyeOff,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  UserCircle2,
  CheckCircle2
} from 'lucide-react';
import { staffApi } from '@/api/staffApi';
import { notify } from '@/lib/notify';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

const MODULES = ['Appointments', 'Service Tracking', 'Invoices', 'Customers', 'Vehicles', 'Service Types', 'Staff'];

/**
 * StaffManagement Component: Advanced Team & Permissions Control
 * Redesigned for Material-grade UI/UX with full responsiveness and pagination.
 */
export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  /* --- Pagination State --- */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  /* --- Form & UI States --- */
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    password: '',
    role: 'Mechanic',
    active: true,
    permissions: [],
  });
  const [saving, setSaving] = useState(false);
  const [resetDialog, setResetDialog] = useState({ open: false, staff: null, tempPassword: '' });
  const [tempPasswordDialog, setTempPasswordDialog] = useState({ open: false, tempPassword: '', staffName: '' });
  const [showTempPassword, setShowTempPassword] = useState(false);

  /* --- Data Loading --- */
  const loadStaff = async () => {
    try {
      const res = await staffApi.list(search ? `search=${search}` : '');
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
    setCurrentPage(1);
  }, [search]);

  /* --- Logic: Pagination --- */
  const totalPages = Math.ceil(staffList.length / itemsPerPage);
  const paginatedStaff = staffList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* --- Handlers --- */
  const openCreate = () => {
    setEditing(null);
    setForm({
      fullName: '',
      username: '',
      password: '',
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
      password: '',
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
        const payload = {
          fullName: form.fullName,
          username: form.username,
          role: form.role,
          active: form.active,
          permissions: form.permissions,
        };
        if (form.password) payload.password = form.password;
        await staffApi.update(editing.id, payload);
        notify.success('Staff profile updated');
        setModalOpen(false);
        loadStaff();
      } else {
        const res = await staffApi.create({
          fullName: form.fullName,
          username: form.username,
          role: form.role,
          active: form.active,
          permissions: form.permissions,
        });
        const tempPw = res.data.tempPassword;
        const staffName = res.data.data.fullName;
        setTempPasswordDialog({ open: true, tempPassword: tempPw, staffName });
        setModalOpen(false);
        loadStaff();
        notify.success('New staff member onboarded');
      }
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error saving staff');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this staff member? This will revoke all access immediately.')) {
      try {
        await staffApi.delete(id);
        notify.success('Staff member removed');
        loadStaff();
      } catch (err) {
        notify.error('Error deleting staff member');
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
    notify.success('Copied to clipboard');
  };

  if (loading && staffList.length === 0) return <LoadingSpinner />;

  return (
    <PageContainer
      title="Team Directory"
      subtitle="Manage internal personnel, roles, and access control"
      actions={
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl px-6 active:scale-95 transition-all">
          <Plus className="w-4 h-4 mr-2" />
          Add Team Member
        </Button>
      }
    >
      {/* --- Filter & Search Bar --- */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by name, role, or username..."
            className="pl-10 rounded-2xl border-slate-200 focus:ring-primary/20 transition-all bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
          <UserCircle2 className="w-3 h-3" />
          {staffList.length} Total Personnel
        </div>
      </div>

      {staffList.length === 0 ? (
        <EmptyState 
          icon={UserCog} 
          title="No staff members found" 
          description={search ? "Try a different search term" : "Your team directory is currently empty."} 
        />
      ) : (
        <div className="space-y-6">
          {/* --- Mobile View: Staff Cards --- */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {paginatedStaff.map((staff) => (
              <Card key={staff.id} className="rounded-2xl border-slate-100 shadow-sm overflow-hidden active:scale-[0.98] transition-transform">
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        {staff.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-800 leading-tight truncate">{staff.fullName}</p>
                        <p className="text-xs text-slate-400">@{staff.username}</p>
                      </div>
                    </div>
                    <Badge 
                      className={cn(
                        "rounded-lg border-none px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter",
                        staff.active ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {staff.active ? 'Active' : 'Offline'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {staff.role}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(staff)} className="h-9 w-9 rounded-xl text-slate-400">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleResetPassword(staff)} className="h-9 w-9 rounded-xl text-primary/60">
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(staff.id)} className="h-9 w-9 rounded-xl text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* --- Desktop View: Detailed Table --- */}
          <Card className="hidden md:block rounded-[2rem] border-slate-100 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="pl-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Team Member</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">System ID</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role & Access</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="pr-8 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStaff.map((staff) => (
                  <TableRow key={staff.id} className="group hover:bg-slate-50/30 transition-colors border-slate-50">
                    <TableCell className="pl-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-black text-sm">
                          {staff.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm">{staff.fullName}</p>
                          <p className="text-xs text-slate-400">Internal Personnel</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                        @{staff.username}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-700">{staff.role}</span>
                        <p className="text-[9px] text-slate-400 font-medium">
                          {staff.permissions?.length || 0} modules assigned
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={cn(
                          "rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest border-none",
                          staff.active ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {staff.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-8">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(staff)} className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm text-slate-400 hover:text-primary transition-all">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleResetPassword(staff)} className="h-9 w-9 rounded-xl hover:bg-primary/5 text-primary/60 transition-all">
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(staff.id)} className="h-9 w-9 rounded-xl hover:bg-red-50 text-red-400 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* --- Pagination Footer --- */}
          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Page {currentPage} of {totalPages || 1}
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="h-8 rounded-xl border-slate-200 text-slate-600 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "w-8 h-8 rounded-xl text-[10px] font-black transition-all",
                      currentPage === i + 1 ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="h-8 rounded-xl border-slate-200 text-slate-600 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- Main Management Modal --- */}
      <DataModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Update Personnel' : 'Onboard New Staff'}
        onSubmit={handleSave}
        isLoading={saving}
      >
        <div className="space-y-6 px-2">
          {/* Identity Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Full Legal Name</Label>
              <Input 
                value={form.fullName} 
                onChange={e => setForm({ ...form, fullName: e.target.value })} 
                placeholder="Ex. Michael Tan"
                className="rounded-xl border-slate-200 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">System Username</Label>
              <Input 
                value={form.username} 
                onChange={e => setForm({ ...form, username: e.target.value })} 
                placeholder="mtan_mechanic"
                className="rounded-xl border-slate-200"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Security Credentials (Optional Update) */}
          {editing && (
            <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">Security Update</Label>
              <Input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Enter new password (optional)"
                className="rounded-xl border-slate-200 bg-white"
              />
              <p className="text-[9px] text-slate-400 font-medium">Leave empty to keep existing password.</p>
            </div>
          )}

          {/* Organizational Role */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Organizational Role</Label>
            <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
              <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Staff">General Staff</SelectItem>
                <SelectItem value="Mechanic">Mechanic</SelectItem>
                <SelectItem value="Cashier">Cashier</SelectItem>
                <SelectItem value="Senior Mechanic">Senior Mechanic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Account Status */}
          <div className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl">
            <Checkbox 
              id="active" 
              checked={form.active} 
              onCheckedChange={(checked) => setForm({ ...form, active: !!checked })} 
              className="rounded-md h-5 w-5"
            />
            <div className="grid gap-0.5 leading-none">
              <Label htmlFor="active" className="text-sm font-black text-slate-800 cursor-pointer">Grant Account Access</Label>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">Toggle to enable or disable system entry for this user.</p>
            </div>
          </div>

          {/* Module Access Grid */}
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Module Permissions</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MODULES.map(mod => (
                <label 
                  key={mod} 
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none",
                    form.permissions.includes(mod) 
                      ? "border-primary bg-primary/5 text-primary" 
                      : "border-slate-100 hover:border-slate-200 text-slate-600"
                  )}
                >
                  <span className="text-xs font-bold tracking-tight">{mod}</span>
                  <Checkbox 
                    checked={form.permissions.includes(mod)} 
                    onCheckedChange={() => togglePermission(mod)} 
                    className="h-4 w-4 border-slate-300"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </DataModal>

      {/* --- Reset Password (Security Dialog) --- */}
      <Dialog open={resetDialog.open} onOpenChange={(open) => setResetDialog({ ...resetDialog, open })}>
        <DialogContent className="rounded-[2rem] sm:max-w-md border-none shadow-2xl">
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center mb-4">
              <KeyRound className="w-8 h-8 text-amber-500" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-800">Password Reset Generated</DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Temporary credentials for <strong>{resetDialog.staff?.fullName}</strong> are now active.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Temporary Access Key</p>
              <code className="text-3xl font-mono font-black text-primary tracking-tighter">
                {resetDialog.tempPassword}
              </code>
            </div>
            <Button 
              variant="outline" 
              className="w-full rounded-2xl border-slate-200 font-bold h-11"
              onClick={() => copyToClipboard(resetDialog.tempPassword)}
            >
              <Copy className="w-4 h-4 mr-2" /> Copy to Clipboard
            </Button>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
              This credential expires in 24 hours. The staff member will be required to define a unique password upon their next system entry.
            </p>
          </div>
          
          <Button 
            className="w-full rounded-2xl h-12 font-black uppercase tracking-widest"
            onClick={() => setResetDialog({ open: false, staff: null, tempPassword: '' })}
          >
            Acknowledge
          </Button>
        </DialogContent>
      </Dialog>

      {/* --- New Creation (Security Dialog) --- */}
      <Dialog open={tempPasswordDialog.open} onOpenChange={(open) => setTempPasswordDialog({ ...tempPasswordDialog, open })}>
        <DialogContent className="rounded-[2rem] sm:max-w-md border-none shadow-2xl">
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-green-500" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-800">Personnel Registered</DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              System access has been provisioned for <strong>{tempPasswordDialog.staffName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-900 p-6 rounded-[2rem] space-y-4 relative overflow-hidden">
            {/* Visual Flair */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-12 -mt-12 blur-2xl" />
            
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Temporary Password</p>
            <div className="flex items-center justify-center gap-3">
              <code className="text-3xl font-mono font-black text-white tracking-tighter">
                {showTempPassword ? tempPasswordDialog.tempPassword : '••••••••'}
              </code>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-white" onClick={() => setShowTempPassword(!showTempPassword)}>
                  {showTempPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-white" onClick={() => copyToClipboard(tempPasswordDialog.tempPassword)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Account created successfully. Provide these credentials to the staff member. A password reset will be forced upon first login for security compliance.
            </p>
          </div>

          <Button 
            className="w-full rounded-2xl h-12 font-black uppercase tracking-widest"
            onClick={() => {
              setTempPasswordDialog({ open: false, tempPassword: '', staffName: '' });
              setShowTempPassword(false);
            }}
          >
            Complete Onboarding
          </Button>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}