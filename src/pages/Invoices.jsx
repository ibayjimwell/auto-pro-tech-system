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
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, Pencil, Trash2, CheckCircle, DollarSign } from 'lucide-react';
import { invoicesApi, appointmentsApi } from '@/services/api';
import { notify } from '@/lib/notify';
import { useAutoAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ appointmentId: '', invoiceType: 'ESTIMATE', status: 'PENDING_APPROVAL', totalAmount: '', details: '' });
  const [appointments, setAppointments] = useState([]);
  const [saving, setSaving] = useState(false);
  const { user } = useAutoAuth();

  const load = async () => {
    try {
      const data = await invoicesApi.list(statusFilter);
      setInvoices(Array.isArray(data) ? data : []);
    } catch { setInvoices([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const openCreate = async () => {
    setEditing(null);
    setForm({ appointmentId: '', invoiceType: 'ESTIMATE', status: 'PENDING_APPROVAL', totalAmount: '', details: '' });
    try {
      const appts = await appointmentsApi.list();
      setAppointments(Array.isArray(appts) ? appts : []);
    } catch { setAppointments([]); }
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
      notify.success('Invoice marked as paid');
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
      title="Invoices"
      subtitle="Manage estimates and final invoices"
      actions={
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />New Invoice
        </Button>
      }
    >
      {/* Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-6">
        <span className="text-sm font-semibold text-muted-foreground">Status:</span>
        <div className="flex gap-2 flex-wrap">
          {['', 'PENDING_APPROVAL', 'APPROVED', 'PAID'].map(s => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => setStatusFilter(s)}
              className={statusFilter === s ? 'bg-primary' : ''}
            >
              {s === '' ? 'All' : s.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : invoices.length === 0 ? (
        <EmptyState icon={FileText} title="No invoices found" description="Create your first invoice" />
      ) : (
        <>
        {/* Mobile card view */}
        <div className="space-y-3 md:hidden">
          {invoices.map(inv => (
            <Card key={inv.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{inv.customerName || 'Customer'}</p>
                    <p className="text-xs text-muted-foreground">{inv.vehiclePlate} · {inv.serviceName}</p>
                  </div>
                  <StatusBadge status={inv.status || 'PENDING'} />
                </div>
                <p className="text-base font-bold text-primary">₱{(inv.amount || inv.totalAmount || 0).toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-3">
                  {inv.status === 'PENDING_APPROVAL' && (
                    <Button variant="ghost" size="icon" onClick={() => handleApprove(inv)} title="Approve">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </Button>
                  )}
                  {inv.status === 'APPROVED' && (
                    <Button variant="ghost" size="icon" onClick={() => handleMarkPaid(inv)} title="Mark Paid">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(inv)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(inv.id)}>
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
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.id?.slice(0, 8)}...</TableCell>
                    <TableCell><StatusBadge status={inv.invoiceType || 'ESTIMATE'} /></TableCell>
                    <TableCell className="font-semibold">₱{inv.totalAmount?.toFixed(2)}</TableCell>
                    <TableCell><StatusBadge status={inv.status || 'PENDING_APPROVAL'} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{inv.details}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {inv.createdAt ? format(new Date(inv.createdAt), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {inv.status === 'PENDING_APPROVAL' && (
                          <Button variant="ghost" size="icon" onClick={() => handleApprove(inv)} title="Approve">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        {inv.status === 'APPROVED' && (
                          <Button variant="ghost" size="icon" onClick={() => handleMarkPaid(inv)} title="Mark Paid">
                            <DollarSign className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEdit(inv)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(inv.id)}>
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

      <DataModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Invoice' : 'New Invoice'} onSubmit={handleSave} isLoading={saving}>
        {!editing && (
          <div className="space-y-2">
            <Label>Appointment</Label>
            <Select value={form.appointmentId} onValueChange={v => setForm({ ...form, appointmentId: v })}>
              <SelectTrigger><SelectValue placeholder="Select appointment" /></SelectTrigger>
              <SelectContent>
                {appointments.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.customerName || 'Customer'} - {a.appointmentDate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.invoiceType} onValueChange={v => setForm({ ...form, invoiceType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ESTIMATE">Estimate</SelectItem>
                <SelectItem value="FINAL">Final</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Total Amount (₱)</Label>
          <Input type="number" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} placeholder="150.00" />
        </div>
        <div className="space-y-2">
          <Label>Details</Label>
          <Textarea value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} placeholder="Service details..." />
        </div>
      </DataModal>
    </PageContainer>
  );
}