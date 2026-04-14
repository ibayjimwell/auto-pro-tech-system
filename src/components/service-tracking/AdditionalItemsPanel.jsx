import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PackagePlus, Plus, CheckCircle2, XCircle, Clock } from 'lucide-react';

const statusConfig = {
  PENDING: { label: 'Awaiting Approval', icon: Clock, className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  APPROVED: { label: 'Approved', icon: CheckCircle2, className: 'bg-green-100 text-green-700 border-green-200' },
  REJECTED: { label: 'Rejected', icon: XCircle, className: 'bg-red-100 text-red-700 border-red-200' },
};

export default function AdditionalItemsPanel({ session, onAdd, onUpdateItem }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ description: '', price: '', reason: '' });

  const items = session.additionalItems || [];

  const handleAdd = () => {
    if (!form.description.trim()) return;
    onAdd({
      description: form.description.trim(),
      price: parseFloat(form.price) || 0,
      reason: form.reason.trim(),
    });
    setForm({ description: '', price: '', reason: '' });
    setAdding(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <PackagePlus className="w-4 h-4 text-primary" />
            Additional Items
            {items.filter(i => i.approvalStatus === 'PENDING').length > 0 && (
              <Badge className="h-5 px-1.5 text-[10px] bg-yellow-500 text-white">
                {items.filter(i => i.approvalStatus === 'PENDING').length} pending
              </Badge>
            )}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAdding(!adding)} className="h-7 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Request
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Items discovered during service that need customer approval before proceeding.
        </p>

        {items.length === 0 && !adding && (
          <p className="text-xs text-muted-foreground italic text-center py-3">No additional items requested</p>
        )}

        {items.map(item => {
          const cfg = statusConfig[item.approvalStatus] || statusConfig.PENDING;
          const Icon = cfg.icon;
          return (
            <div key={item.id} className="p-3 rounded-lg border border-border bg-muted/20 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium flex-1">{item.description}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 flex-shrink-0 ${cfg.className}`}>
                  <Icon className="w-2.5 h-2.5" />{cfg.label}
                </span>
              </div>
              {item.reason && <p className="text-xs text-muted-foreground">Reason: {item.reason}</p>}
              <p className="text-sm font-bold text-primary">₱{item.price.toLocaleString()}</p>
              {/* Simulate approval actions (in real system, customer approves via notification) */}
              {item.approvalStatus === 'PENDING' && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => onUpdateItem(item.id, { approvalStatus: 'APPROVED' })}
                    className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white flex-1"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Approve (Customer)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateItem(item.id, { approvalStatus: 'REJECTED' })}
                    className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50 flex-1"
                  >
                    <XCircle className="w-3 h-3 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {adding && (
          <div className="p-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 space-y-2">
            <p className="text-xs font-semibold text-primary">New Additional Item Request</p>
            <Input
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Item / service description"
              className="text-xs h-8"
            />
            <Input
              type="number"
              value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
              placeholder="Estimated price (₱)"
              className="text-xs h-8"
            />
            <Input
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              placeholder="Reason / justification"
              className="text-xs h-8"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} className="h-7 text-xs bg-primary hover:bg-primary/90 flex-1">
                Submit for Approval
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)} className="h-7 text-xs">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}