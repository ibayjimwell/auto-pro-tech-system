import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/shared/PageContainer';
import DataModal from '@/components/shared/DataModal';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, FileText, Pencil, Trash2, CheckCircle, 
  DollarSign, QrCode, Search, Car, User, 
  Calendar, CreditCard, Receipt, FilterX 
} from 'lucide-react';
import { invoicesApi, appointmentsApi } from '@/services/api';
import { notify } from '@/lib/notify';
import { useAutoAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Invoices() {
  // --- State Management ---
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false); // For QR Scanner
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ 
    appointmentId: '', 
    invoiceType: 'ESTIMATE', 
    status: 'PENDING_APPROVAL', 
    totalAmount: '', 
    details: '' 
  });
  const [appointments, setAppointments] = useState([]);
  const [saving, setSaving] = useState(false);
  const { user } = useAutoAuth();

  // --- Logic / API Fetching ---
  const load = async () => {
    setLoading(true);
    try {
      const data = await invoicesApi.list(statusFilter);
      setInvoices(Array.isArray(data) ? data : []);
    } catch { 
      setInvoices([]); 
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const openCreate = async () => {
    setEditing(null);
    setForm({ appointmentId: '', invoiceType: 'ESTIMATE', status: 'PENDING_APPROVAL', totalAmount: '', details: '' });
    try {
      const appts = await appointmentsApi.list();
      setAppointments(Array.isArray(appts) ? appts : []);
    } catch { 
      setAppointments([]); 
    }
    setModalOpen(true);
  };

  const openEdit = (inv) => {
    setEditing(inv);
    setForm({
      appointmentId: inv.appointmentId || '',
      invoiceType: inv.invoiceType || 'ESTIMATE',
      status: inv.status || 'PENDING_APPROVAL',
      totalAmount: inv.totalAmount || '',
      details: inv.details || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form, totalAmount: parseFloat(form.totalAmount) || 0, issuedByStaffId: user?.id };
      if (editing) {
        await invoicesApi.update(editing.id, data);
        notify.success('Invoice updated');
      } else {
        await invoicesApi.create(data);
        notify.success('Invoice created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      notify.error(err.message || 'Error');
    }
    setSaving(false);
  };

  const handleApprove = async (inv) => {
    try {
      await invoicesApi.update(inv.id, { ...inv, status: 'APPROVED', approvedAt: new Date().toISOString() });
      notify.success('Invoice approved');
      load();
    } catch (err) {
      notify.error(err.message || 'Error');
    }
  };

  const handleMarkPaid = async (inv) => {
    try {
      await invoicesApi.update(inv.id, { ...inv, status: 'PAID' });
      notify.success('Payment settled successfully');
      load();
    } catch (err) {
      notify.error(err.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await invoicesApi.delete(id);
      notify.success('Invoice deleted');
      load();
    } catch (err) {
      notify.error(err.message || 'Error');
    }
  };

  return (
    <PageContainer
      title="Cashier & Billing"
      subtitle="Manage estimates, final billing, and shop revenue"
      actions={
        <div className="flex gap-2">
          {/* QR Scanner Trigger */}
          <Button 
            onClick={() => setScanModalOpen(true)}
            className="bg-primary hover:bg-primary/90 shadow-md"
          >
            <QrCode className="w-4 h-4 mr-2" /> Scan Receipt
          </Button>
        </div>
      }
    >
      {/* --- Filter & Stats Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-primary/5 border-none shadow-none md:col-span-3">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-lg text-white">
                <FilterX className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick Filter</p>
                <div className="flex gap-1 mt-1 overflow-x-auto pb-1 no-scrollbar">
                  {['', 'PENDING_APPROVAL', 'APPROVED', 'PENDING', 'PAID'].map(s => (
                    <Button
                      key={s}
                      size="sm"
                      variant={statusFilter === s ? 'default' : 'ghost'}
                      onClick={() => setStatusFilter(s)}
                      className={cn(
                        "h-8 rounded-full text-xs transition-all",
                        statusFilter === s ? "bg-primary shadow-sm" : "hover:bg-primary/10"
                      )}
                    >
                      {s === '' ? 'All Status' : s.replace(/_/g, ' ')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            {/* Search Input for touch friendliness */}
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search Customer..." className="pl-9 h-10 bg-background rounded-xl border-muted" />
            </div>
          </CardContent>
        </Card>
        
        {/* Mobile-only Scanner Button (Floating style feel) */}
        <Button 
          variant="outline" 
          onClick={() => setScanModalOpen(true)}
          className="sm:hidden w-full h-12 border-dashed border-primary text-primary"
        >
          <QrCode className="w-5 h-5 mr-2" /> Tap to Scan QR
        </Button>
      </div>

      {loading ? (
        <div className="py-20"><LoadingSpinner /></div>
      ) : invoices.length === 0 ? (
        <EmptyState icon={FileText} title="No billing records" description="No invoices found for the selected criteria." />
      ) : (
        <>
        {/* --- Mobile Card View (Optimized for Touch) --- */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {invoices.map(inv => (
            <Card key={inv.id} className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm leading-none">{inv.customerName || 'Walk-in Customer'}</h4>
                        <span className="text-[10px] text-muted-foreground font-mono">#{inv.id?.slice(0, 8).toUpperCase()}</span>
                      </div>
                    </div>
                    <StatusBadge status={inv.status || 'PENDING'} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-2 border-y border-dashed">
                    <div className="flex items-center gap-2">
                      <Car className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-medium uppercase">{inv.vehiclePlate || 'No Plate'}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {inv.createdAt ? format(new Date(inv.createdAt), 'MM/dd/yy') : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Amount</p>
                        <p className="text-lg font-black text-primary">₱{(inv.amount || inv.totalAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-1">
                        {inv.status === 'PENDING_APPROVAL' && (
                            <Button size="icon" className="bg-green-600 hover:bg-green-700 h-9 w-9" onClick={() => handleApprove(inv)}>
                                <CheckCircle className="w-4 h-4" />
                            </Button>
                        )}
                        {inv.status === 'APPROVED' && (
                            <Button size="icon" className="bg-blue-600 hover:bg-blue-700 h-9 w-9 text-white" onClick={() => handleMarkPaid(inv)}>
                                <DollarSign className="w-4 h-4" />
                            </Button>
                        )}
                        <Button variant="secondary" size="icon" className="h-9 w-9" onClick={() => openEdit(inv)}>
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => handleDelete(inv.id)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* --- Desktop Table View (Material/High Quality) --- */}
        <Card className="hidden md:block border-none shadow-lg overflow-hidden bg-card">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="py-4 px-6 font-bold text-xs uppercase tracking-widest">Billing Info</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest">Status/Type</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest">Details</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest text-right">Amount</TableHead>
                  <TableHead className="w-48 font-bold text-xs uppercase tracking-widest text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map(inv => (
                  <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell className="px-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-sm group-hover:text-primary transition-colors">
                           {inv.customerName || 'Unknown Customer'}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                          <span className="bg-muted px-1.5 py-0.5 rounded uppercase">{inv.vehiclePlate || 'N/A'}</span>
                          <span>•</span>
                          <span>{inv.createdAt ? format(new Date(inv.createdAt), 'MMM dd, yyyy') : 'N/A'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <StatusBadge status={inv.status || 'PENDING_APPROVAL'} />
                        <span className="text-[10px] font-bold text-muted-foreground/70 uppercase pl-1">{inv.invoiceType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                        {inv.details || 'No service notes provided...'}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-black text-sm text-primary">
                        ₱{inv.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {inv.status === 'PENDING_APPROVAL' && (
                          <Button variant="outline" size="sm" onClick={() => handleApprove(inv)} className="h-8 border-green-200 text-green-700 hover:bg-green-50">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                        )}
                        {inv.status === 'APPROVED' && (
                          <Button variant="default" size="sm" onClick={() => handleMarkPaid(inv)} className="h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                            <DollarSign className="w-3.5 h-3.5 mr-1" /> Pay
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => openEdit(inv)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10" onClick={() => handleDelete(inv.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* --- Main Invoice Form Modal (Scrollable & Responsive) --- */}
      <DataModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        title={editing ? 'Revise Invoice' : 'Generate New Bill'} 
        onSubmit={handleSave} 
        isLoading={saving}
      >
        <div className="space-y-6 px-2">
            
            {/* Header section in modal */}
            <div className="p-4 bg-muted/40 rounded-2xl border border-dashed border-muted-foreground/20 space-y-4">
                {!editing && (
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Linked Appointment</Label>
                    <Select value={form.appointmentId} onValueChange={v => setForm({ ...form, appointmentId: v })}>
                    <SelectTrigger className="h-11 bg-background rounded-xl border-none shadow-sm">
                        <SelectValue placeholder="Search appointment..." />
                    </SelectTrigger>
                    <SelectContent>
                        {appointments.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                            <div className="flex flex-col">
                                <span className="font-bold">{a.customerName || 'Customer'}</span>
                                <span className="text-[10px] text-muted-foreground">{a.vehiclePlate} — {a.appointmentDate}</span>
                            </div>
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Billing Type</Label>
                        <Select value={form.invoiceType} onValueChange={v => setForm({ ...form, invoiceType: v })}>
                            <SelectTrigger className="h-11 bg-background rounded-xl border-none shadow-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ESTIMATE">Estimate / Quote</SelectItem>
                                <SelectItem value="FINAL">Final Invoice</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Initial Status</Label>
                        <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                            <SelectTrigger className="h-11 bg-background rounded-xl border-none shadow-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                                <SelectItem value="APPROVED">Ready for Payment</SelectItem>
                                <SelectItem value="PAID">Paid / Settled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Financials section */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Billable Amount (₱)</Label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary">₱</div>
                        <Input 
                            type="number" 
                            className="h-14 pl-10 text-xl font-black bg-muted/20 border-none rounded-2xl ring-offset-primary focus-visible:ring-primary"
                            value={form.totalAmount} 
                            onChange={e => setForm({ ...form, totalAmount: e.target.value })} 
                            placeholder="0.00" 
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Service Details & Notes</Label>
                    <Textarea 
                        rows={4}
                        className="bg-muted/20 border-none rounded-2xl focus-visible:ring-primary resize-none p-4"
                        value={form.details} 
                        onChange={e => setForm({ ...form, details: e.target.value })} 
                        placeholder="Describe parts replaced, labor hours, and specific shop notes here..." 
                    />
                </div>
            </div>

            {/* Bottom Info */}
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl text-[10px] font-medium text-primary">
                <Receipt className="w-3.5 h-3.5" />
                <span>This bill will be recorded under your cashier ID: {user?.id?.slice(0,8) || 'SYSTEM'}</span>
            </div>
        </div>
      </DataModal>

      {/* --- QR Scanner Modal (New Piece) --- */}
      <DataModal
        open={scanModalOpen}
        onOpenChange={setScanModalOpen}
        title="QR Receipt Scanner"
        description="Point the camera at the customer's QR code on their booking or receipt."
        hideSubmit // Just for UI demonstration
      >
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="relative w-64 h-64 border-2 border-dashed border-primary/30 rounded-3xl flex items-center justify-center bg-muted/30 overflow-hidden">
                {/* Visual Scanner Overlay */}
                <div className="absolute inset-4 border-2 border-primary rounded-xl animate-pulse opacity-50"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 animate-bounce shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
                
                <QrCode className="w-20 h-20 text-primary/20" />
                
                <p className="absolute bottom-4 text-[10px] font-bold text-primary animate-pulse">CENTERING...</p>
            </div>
            
            <div className="w-full space-y-3">
                <Button className="w-full h-12 rounded-2xl bg-primary text-white font-bold">
                    Activate Camera
                </Button>
                <div className="flex items-center gap-2">
                    <div className="h-[1px] flex-1 bg-muted"></div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Or Manual Entry</span>
                    <div className="h-[1px] flex-1 bg-muted"></div>
                </div>
                <div className="flex gap-2">
                    <Input placeholder="Enter Reference #" className="h-11 rounded-xl bg-muted/30 border-none" />
                    <Button size="icon" className="h-11 w-11 rounded-xl shrink-0"><Search className="w-4 h-4" /></Button>
                </div>
            </div>
        </div>
      </DataModal>

      {/* --- Styling Overrides --- */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>

    </PageContainer>
  );
}