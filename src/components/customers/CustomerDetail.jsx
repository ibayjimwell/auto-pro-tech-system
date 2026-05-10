import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/shared/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Car, 
  CalendarDays, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Mail,
  Phone,
  User,
  History,
  Info
} from 'lucide-react';
import { vehiclesApi, customersApi } from '@/services/api';
import VechicleForm from "@/components/vechicles/VechicleForm";
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function CustomerDetail({ customer, onBack }) {
  const [vehicles, setVehicles] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehicleModal, setVehicleModal] = useState(false);

  // --- Pagination & Filter States ---
  const [vSearch, setVSearch] = useState('');
  const [vPage, setVPage] = useState(1);
  const [aPage, setAPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    async function load() {
      try {
        const [v, a] = await Promise.all([
          vehiclesApi.getByCustomer(customer.id).catch(() => []),
          customersApi.getAppointments(customer.id).catch(() => []),
        ]);
        setVehicles(Array.isArray(v) ? v : []);
        setAppointments(Array.isArray(a) ? a : []);
      } catch (error) {
        console.error("Failed to load customer details", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [customer.id]);

  const handleVehicleSaved = () => {
    setVehicleModal(false);
    vehiclesApi.getByCustomer(customer.id).then(v => setVehicles(Array.isArray(v) ? v : []));
  };

  // --- Logic for Data Handling ---
  const filteredVehicles = vehicles.filter(v => 
    `${v.make} ${v.model} ${v.plateNumber}`.toLowerCase().includes(vSearch.toLowerCase())
  );

  const paginatedVehicles = filteredVehicles.slice((vPage - 1) * itemsPerPage, vPage * itemsPerPage);
  const paginatedAppointments = appointments.slice((aPage - 1) * itemsPerPage, aPage * itemsPerPage);
  
  const vTotalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const aTotalPages = Math.ceil(appointments.length / itemsPerPage);

  if (loading) return <LoadingSpinner />;

  return (
    <PageContainer
      title={customer.fullName}
      subtitle="Customer Profile & Asset Management"
      actions={
        <Button variant="ghost" onClick={onBack} className="rounded-xl hover:bg-slate-100 transition-all font-semibold">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
        </Button>
      }
    >
      {/* --- Customer Info Header Card --- */}
      <Card className="mb-8 border-none shadow-sm bg-gradient-to-r from-slate-50 to-white overflow-hidden animate-in fade-in duration-500">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-3xl font-black shadow-lg">
              {customer.fullName.charAt(0)}
            </div>
            <div className="space-y-1 flex-1">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                {customer.fullName}
              </h2>
              <div className="flex flex-wrap gap-4">
                <span className="flex items-center text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-100">
                  <Mail className="w-3.5 h-3.5 mr-2 text-primary" /> {customer.email}
                </span>
                <span className="flex items-center text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-100">
                  <Phone className="w-3.5 h-3.5 mr-2 text-primary" /> {customer.phone}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Main Content Tabs --- */}
      <Tabs defaultValue="vehicles" className="w-full space-y-6">
        <TabsList className="bg-slate-100/50 p-1 rounded-2xl h-14 w-full md:w-auto grid grid-cols-2 md:inline-flex">
          <TabsTrigger value="vehicles" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold px-8 transition-all">
            <Car className="w-4 h-4 mr-2" /> Registered Vehicles
          </TabsTrigger>
          <TabsTrigger value="appointments" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold px-8 transition-all">
            <CalendarDays className="w-4 h-4 mr-2" /> Appointments
          </TabsTrigger>
        </TabsList>

        {/* --- Vehicles Section --- */}
        <TabsContent value="vehicles" className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Find specific vehicle..." 
                className="pl-10 h-11 rounded-xl bg-white border-slate-200 focus:ring-primary"
                value={vSearch}
                onChange={(e) => { setVSearch(e.target.value); setVPage(1); }}
              />
            </div>
            <Button onClick={() => setVehicleModal(true)} className="w-full md:w-auto h-11 px-6 rounded-xl font-bold shadow-md shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Add Vehicle
            </Button>
          </div>

          <Card className="border-slate-100 shadow-sm overflow-hidden rounded-2xl">
            <CardContent className="p-0">
              {filteredVehicles.length === 0 ? (
                <div className="text-center py-16">
                   <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Car className="text-slate-300 w-8 h-8" />
                   </div>
                   <p className="text-slate-500 font-medium">No registered vehicles found</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-50">
                    {paginatedVehicles.map(v => (
                      <div key={v.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="bg-slate-100 p-3 rounded-xl">
                            <Info className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 uppercase">{v.make} {v.model}</p>
                            <div className="flex gap-3 mt-1">
                                <span className="text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">YEAR: {v.year}</span>
                                <span className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-md uppercase">PLATE: {v.plateNumber}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-lg font-bold border-slate-200">Manage</Button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Vehicle Pagination */}
                  {vTotalPages > 1 && (
                    <div className="p-4 border-t border-slate-50 flex items-center justify-center gap-2 bg-slate-50/20">
                      <Button variant="ghost" size="sm" onClick={() => setVPage(p => Math.max(1, p-1))} disabled={vPage === 1}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Page {vPage} of {vTotalPages}</span>
                      <Button variant="ghost" size="sm" onClick={() => setVPage(p => Math.min(vTotalPages, p+1))} disabled={vPage === vTotalPages}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Appointments Section --- */}
        <TabsContent value="appointments" className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <Card className="border-slate-100 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-slate-50/30 border-b border-slate-100">
                <CardTitle className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" /> Service Logs & History
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {appointments.length === 0 ? (
                <div className="text-center py-16 text-slate-500 font-medium italic">
                  No appointment history available
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-50">
                    {paginatedAppointments.map(a => (
                      <div key={a.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex gap-4">
                            <div className="text-center bg-white border border-slate-200 rounded-xl px-3 py-2 min-w-[70px] shadow-sm">
                                <p className="text-[10px] font-black text-primary uppercase">{a.appointmentDate ? format(new Date(a.appointmentDate), 'MMM') : 'N/A'}</p>
                                <p className="text-xl font-black text-slate-900 leading-none">{a.appointmentDate ? format(new Date(a.appointmentDate), 'dd') : '-'}</p>
                                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{a.appointmentDate ? format(new Date(a.appointmentDate), 'yyyy') : ''}</p>
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-800 uppercase line-clamp-1">{a.notes || 'REGULAR SERVICE CHECKUP'}</p>
                                <p className="text-xs text-slate-500 mt-1 flex items-center">
                                    <User className="w-3 h-3 mr-1" /> Assigned to Service Team
                                </p>
                            </div>
                        </div>
                        <StatusBadge status={a.status || 'PENDING'} className="md:self-center font-black rounded-lg uppercase tracking-tight" />
                      </div>
                    ))}
                  </div>

                  {/* Appointment Pagination */}
                  {aTotalPages > 1 && (
                    <div className="p-4 border-t border-slate-50 flex items-center justify-center gap-2 bg-slate-50/20">
                      <Button variant="ghost" size="sm" onClick={() => setAPage(p => Math.max(1, p-1))} disabled={aPage === 1}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Page {aPage} of {aTotalPages}</span>
                      <Button variant="ghost" size="sm" onClick={() => setAPage(p => Math.min(aTotalPages, p+1))} disabled={aPage === aTotalPages}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- Vehicle Form Modal --- */}
      {/* Note: Ensure the Dialog component in VechicleForm allows for scrolling max-h-screen */}
      <VechicleForm
        open={vehicleModal}
        onOpenChange={setVehicleModal}
        customerId={customer.id}
        onSaved={handleVehicleSaved}
      />
    </PageContainer>
  );
}