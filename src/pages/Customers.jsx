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
import { 
  Plus, Search, Users, Pencil, Eye, Trash2, 
  ChevronLeft, ChevronRight, Mail, Phone, 
  User, Lock, ShieldCheck, Filter, MoreHorizontal
} from 'lucide-react';
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
import { cn } from "@/lib/utils";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [focusField, setFocusField] = useState(null); // For icon highlighting
  
  // Pagination State for DataTable functionality
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    setLoading(true);
    try {
      const res = await customersApi.list(search);
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

  // Pagination Logic
  const totalPages = Math.ceil(customers.length / itemsPerPage);
  const currentData = customers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      password: '',
      confirmPassword: '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
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
      const payload = { fullName: form.fullName, email: form.email, phone: form.phone };
      if (!editingCustomer) {
        payload.password = form.password;
        await customersApi.create(payload);
        notify.success('Walk-in Customer Registered');
      } else {
        if (form.password) payload.password = form.password;
        await customersApi.update(editingCustomer.id, payload);
        notify.success('Customer Profile Updated');
      }
      setModalOpen(false);
      loadCustomers();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error saving customer');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await customersApi.delete(deleteDialog.id);
      notify.success('Customer removed');
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
      subtitle="Manage and track your customer base"
      actions={
        /* --- Redesigned "Walk In" Button --- */
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 h-11 px-6 rounded-xl font-bold transition-all active:scale-95">
          <Plus className="w-5 h-5 mr-2" />Walk In
        </Button>
      }
    >
      {/* --- Filter & Search Bar Section --- */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="relative w-full max-w-lg">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200">
            <Search className={cn("w-5 h-5", focusField === 'search' ? "text-primary" : "text-muted-foreground")} />
          </div>
          <Input
            placeholder="Search by name, email, or phone..."
            className="pl-12 h-12 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-primary focus:border-primary transition-all text-base"
            value={search}
            onFocus={() => setFocusField('search')}
            onBlur={() => setFocusField(null)}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
           <Button variant="outline" className="h-12 rounded-2xl border-slate-200 flex-1 md:flex-none">
             <Filter className="w-4 h-4 mr-2" /> Filters
           </Button>
           <p className="hidden md:block text-sm font-medium text-muted-foreground whitespace-nowrap">
             Showing {currentData.length} of {customers.length} records
           </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : customers.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" description="Add your first customer to get started" />
      ) : (
        <div className="animate-in fade-in duration-700">
          {/* --- Mobile View: Modern Cards --- */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {currentData.map((c) => (
              <Card key={c.id} className="border-none shadow-md rounded-2xl bg-white overflow-hidden active:scale-[0.98] transition-transform">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-primary font-bold border border-slate-200">
                        {c.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-lg text-slate-900 truncate">{c.fullName}</p>
                        <div className="flex flex-col gap-1 mt-1">
                          <span className="flex items-center text-xs text-muted-foreground">
                            <Mail className="w-3 h-3 mr-1" /> {c.email}
                          </span>
                          <span className="flex items-center text-xs text-muted-foreground">
                            <Phone className="w-3 h-3 mr-1" /> {c.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-50">
                      <Button variant="secondary" size="sm" onClick={() => setSelectedCustomer(c)} className="rounded-lg font-bold">
                        <Eye className="w-4 h-4 mr-2" /> View
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)} className="rounded-lg text-slate-600">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => confirmDelete(c.id, c.fullName)} className="rounded-lg text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* --- Desktop View: Modern DataTable --- */}
          <div className="hidden md:block bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="py-5 px-6 font-bold text-slate-700">Customer Identity</TableHead>
                  <TableHead className="py-5 px-6 font-bold text-slate-700">Contact Details</TableHead>
                  <TableHead className="py-5 px-6 font-bold text-slate-700">Registration Phone</TableHead>
                  <TableHead className="py-5 px-6 font-bold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map((c) => (
                  <TableRow key={c.id} className="group border-slate-50 transition-colors hover:bg-slate-50/40">
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold transition-colors group-hover:bg-primary group-hover:text-white">
                          {c.fullName.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800">{c.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center text-slate-500">
                        <Mail className="w-3.5 h-3.5 mr-2" />
                        {c.email}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center text-slate-500">
                        <Phone className="w-3.5 h-3.5 mr-2" />
                        {c.phone}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(c)} className="rounded-lg hover:bg-primary/10 hover:text-primary">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)} className="rounded-lg">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(c.id, c.fullName)} className="rounded-lg text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* --- Advanced Pagination Footer --- */}
            <div className="p-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
               <span className="text-sm text-muted-foreground font-medium">
                 Page {currentPage} of {totalPages}
               </span>
               <div className="flex items-center gap-2">
                 <Button 
                   variant="outline" 
                   size="sm" 
                   disabled={currentPage === 1}
                   onClick={() => setCurrentPage(p => p - 1)}
                   className="rounded-xl h-10 border-slate-200"
                 >
                   <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                 </Button>
                 <div className="flex gap-1">
                   {[...Array(totalPages)].map((_, i) => (
                     <Button 
                       key={i} 
                       size="sm"
                       variant={currentPage === i + 1 ? "default" : "ghost"}
                       onClick={() => setCurrentPage(i + 1)}
                       className={cn("w-10 h-10 rounded-xl", currentPage === i + 1 ? "shadow-md" : "")}
                     >
                       {i + 1}
                     </Button>
                   ))}
                 </div>
                 <Button 
                   variant="outline" 
                   size="sm" 
                   disabled={currentPage === totalPages}
                   onClick={() => setCurrentPage(p => p + 1)}
                   className="rounded-xl h-10 border-slate-200"
                 >
                   Next <ChevronRight className="w-4 h-4 ml-1" />
                 </Button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Rebuilt Create/Edit Modal with Focus Icons --- */}
      <DataModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingCustomer ? 'Update Profile' : 'New Walk-in Customer'}
        onSubmit={handleSave}
        isLoading={saving}
      >
        <div className="space-y-6 pt-4 px-2">
          <div className="space-y-2">
            <Label className="text-sm font-bold text-slate-700">Full Name</Label>
            <div className="relative group">
              <User className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", focusField === 'name' ? "text-primary" : "text-slate-400")} />
              <Input
                id="fullName"
                value={form.fullName}
                onFocus={() => setFocusField('name')}
                onBlur={() => setFocusField(null)}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                placeholder="Ex: John Smith"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Email Address</Label>
              <div className="relative group">
                <Mail className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", focusField === 'email' ? "text-primary" : "text-slate-400")} />
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onFocus={() => setFocusField('email')}
                  onBlur={() => setFocusField(null)}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                  placeholder="name@email.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Phone Number</Label>
              <div className="relative group">
                <Phone className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", focusField === 'phone' ? "text-primary" : "text-slate-400")} />
                <Input
                  id="phone"
                  value={form.phone}
                  onFocus={() => setFocusField('phone')}
                  onBlur={() => setFocusField(null)}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                  placeholder="+63 9xx xxx xxxx"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* Password Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">
                {editingCustomer ? 'New Password (Optional)' : 'Security Password'}
              </Label>
              <div className="relative group">
                <Lock className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", focusField === 'pass' ? "text-primary" : "text-slate-400")} />
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onFocus={() => setFocusField('pass')}
                  onBlur={() => setFocusField(null)}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Confirm Security</Label>
              <div className="relative group">
                <ShieldCheck className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", focusField === 'confirm' ? "text-primary" : "text-slate-400")} />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onFocus={() => setFocusField('confirm')}
                  onBlur={() => setFocusField(null)}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
        </div>
      </DataModal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent className="rounded-3xl p-8 border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4 mx-auto md:mx-0">
               <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-slate-900">Confirm Removal</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-slate-600">
              You are about to remove <strong>{deleteDialog.name}</strong> from the system. All associated data will be archived.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-12 rounded-xl border-slate-200 font-bold px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-12 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold px-6">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

// Minimal Separator helper inside the component
const Separator = ({ className }) => <div className={cn("h-[1px] w-full", className)} />;