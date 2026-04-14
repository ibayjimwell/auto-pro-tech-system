import React, { useState } from 'react';
import DataModal from '@/components/shared/DataModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { vehiclesApi } from '@/services/api';
import { notify } from '@/lib/notify';

export default function VehicleForm({ open, onOpenChange, customerId, vehicle, onSaved }) {
  const [form, setForm] = useState({
    plateNumber: vehicle?.plateNumber || '',
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    year: vehicle?.year || '',
  });
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form, year: parseInt(form.year) || 0, customerId };
      if (vehicle) {
        await vehiclesApi.update(vehicle.id, data);
        notify.success('Vehicle updated');
      } else {
        await vehiclesApi.create(data);
        notify.success('Vehicle added');
      }
      onSaved();
    } catch (err) {
      notify.error(err.message || 'Error');
    }
    setSaving(false);
  };

  return (
    <DataModal
      open={open}
      onOpenChange={onOpenChange}
      title={vehicle ? 'Edit Vehicle' : 'Add Vehicle'}
      onSubmit={handleSave}
      isLoading={saving}
    >
      <div className="space-y-2">
        <Label>Plate Number</Label>
        <Input value={form.plateNumber} onChange={e => setForm({ ...form, plateNumber: e.target.value })} placeholder="ABC-123" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Make</Label>
          <Input value={form.make} onChange={e => setForm({ ...form, make: e.target.value })} placeholder="Toyota" />
        </div>
        <div className="space-y-2">
          <Label>Model</Label>
          <Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="Camry" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Year</Label>
        <Input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} placeholder="2020" />
      </div>
    </DataModal>
  );
}