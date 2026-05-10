import React, { useState } from 'react';
import DataModal from '@/components/shared/DataModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { vehiclesApi } from '@/services/api';
import { notify } from '@/lib/notify';
import { 
  Car, 
  Hash, 
  Calendar, 
  Info, 
  Trophy,
  Activity
} from 'lucide-react';
import { cn } from "@/lib/utils";

export default function VehicleForm({ open, onOpenChange, customerId, vehicle, onSaved }) {
  const [form, setForm] = useState({
    plateNumber: vehicle?.plateNumber || '',
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    year: vehicle?.year || '',
  });
  const [saving, setSaving] = useState(false);
  
  // State for dynamic icon highlighting
  const [focusField, setFocusField] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form, year: parseInt(form.year) || 0, customerId };
      if (vehicle) {
        await vehiclesApi.update(vehicle.id, data);
        notify.success('Vehicle records updated');
      } else {
        await vehiclesApi.create(data);
        notify.success('New vehicle registered');
      }
      onSaved();
    } catch (err) {
      notify.error(err.message || 'Error saving vehicle information');
    }
    setSaving(false);
  };

  return (
    <DataModal
      open={open}
      onOpenChange={onOpenChange}
      title={vehicle ? 'Update Vehicle' : 'Register Vehicle'}
      onSubmit={handleSave}
      isLoading={saving}
    >
      {/* --- Scrollable Container --- */}
      {/* Ensures form content is always accessible regardless of device height */}
      <div className="max-h-[70vh] px-2">
        <div className="space-y-6">
          
          {/* Header Info Section */}
          <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Car className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">Vehicle Details</p>
              <p className="text-xs text-slate-500">Provide the asset information for the service logs.</p>
            </div>
          </div>

          {/* Plate Number Input */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-slate-700 ml-1">Plate Number</Label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200">
                <Hash className={cn("w-4 h-4", focusField === 'plate' ? "text-primary" : "text-slate-400")} />
              </div>
              <Input 
                value={form.plateNumber} 
                onFocus={() => setFocusField('plate')}
                onBlur={() => setFocusField(null)}
                onChange={e => setForm({ ...form, plateNumber: e.target.value.toUpperCase() })} 
                placeholder="ABC-1234"
                className="pl-10 h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-primary transition-all font-mono uppercase"
              />
            </div>
          </div>

          {/* Make & Model Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Make Input */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 ml-1">Brand / Make</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200">
                  <Trophy className={cn("w-4 h-4", focusField === 'make' ? "text-primary" : "text-slate-400")} />
                </div>
                <Input 
                  value={form.make} 
                  onFocus={() => setFocusField('make')}
                  onBlur={() => setFocusField(null)}
                  onChange={e => setForm({ ...form, make: e.target.value })} 
                  placeholder="Toyota" 
                  className="pl-10 h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Model Input */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 ml-1">Model Name</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200">
                  <Activity className={cn("w-4 h-4", focusField === 'model' ? "text-primary" : "text-slate-400")} />
                </div>
                <Input 
                  value={form.model} 
                  onFocus={() => setFocusField('model')}
                  onBlur={() => setFocusField(null)}
                  onChange={e => setForm({ ...form, model: e.target.value })} 
                  placeholder="Camry" 
                  className="pl-10 h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Year Input */}
          <div className="space-y-2 pb-2">
            <Label className="text-sm font-bold text-slate-700 ml-1">Manufacturing Year</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200">
                <Calendar className={cn("w-4 h-4", focusField === 'year' ? "text-primary" : "text-slate-400")} />
              </div>
              <Input 
                type="number" 
                value={form.year} 
                onFocus={() => setFocusField('year')}
                onBlur={() => setFocusField(null)}
                onChange={e => setForm({ ...form, year: e.target.value })} 
                placeholder="2024" 
                className="pl-10 h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Development Hint / Footer */}
          <div className="mt-4 p-4 border-t border-slate-100 flex items-start gap-3">
             <Info className="w-4 h-4 text-slate-400 mt-0.5" />
             <p className="text-[10px] text-slate-400 leading-tight uppercase font-bold tracking-wider">
               Ensure the plate number matches official registration to prevent record duplication.
             </p>
          </div>

        </div>
      </div>
    </DataModal>
  );
}