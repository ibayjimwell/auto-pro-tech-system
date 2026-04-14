import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/shared/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Car, CalendarDays, Plus } from 'lucide-react';
import { vehiclesApi, customersApi } from '@/services/api';
import VehicleForm from '@/components/vehicles/VehicleForm';
import { format } from 'date-fns';

export default function CustomerDetail({ customer, onBack }) {
  const [vehicles, setVehicles] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehicleModal, setVehicleModal] = useState(false);

  useEffect(() => {
    async function load() {
      const [v, a] = await Promise.all([
        vehiclesApi.getByCustomer(customer.id).catch(() => []),
        customersApi.getAppointments(customer.id).catch(() => []),
      ]);
      setVehicles(Array.isArray(v) ? v : []);
      setAppointments(Array.isArray(a) ? a : []);
      setLoading(false);
    }
    load();
  }, [customer.id]);

  const handleVehicleSaved = () => {
    setVehicleModal(false);
    vehiclesApi.getByCustomer(customer.id).then(v => setVehicles(Array.isArray(v) ? v : []));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <PageContainer
      title={customer.fullName}
      subtitle={`${customer.email} • ${customer.phone}`}
      actions={
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicles */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Car className="w-4 h-4" />Vehicles
            </CardTitle>
            <Button size="sm" onClick={() => setVehicleModal(true)}>
              <Plus className="w-3 h-3 mr-1" />Add
            </Button>
          </CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No vehicles registered</p>
            ) : (
              <div className="space-y-3">
                {vehicles.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-semibold">{v.make} {v.model} ({v.year})</p>
                      <p className="text-xs text-muted-foreground">Plate: {v.plateNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />Appointment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No appointments</p>
            ) : (
              <div className="space-y-3">
                {appointments.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-semibold">
                        {a.appointmentDate ? format(new Date(a.appointmentDate), 'MMM d, yyyy') : 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">{a.notes || 'No notes'}</p>
                    </div>
                    <StatusBadge status={a.status || 'PENDING'} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <VehicleForm
        open={vehicleModal}
        onOpenChange={setVehicleModal}
        customerId={customer.id}
        onSaved={handleVehicleSaved}
      />
    </PageContainer>
  );
}