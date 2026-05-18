import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Users, 
  CalendarDays, 
  FileText, 
  UserCog, 
  Activity, 
  ArrowUpRight, 
  Plus, 
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wrench,
  DollarSign
} from 'lucide-react';

// Shadcn & UI Components
import PageContainer from '@/components/shared/PageContainer';
import StatCard from '@/components/dashboard/StatCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// Real API services (not mock)
import { customersApi } from '@/api/customersApi';
import { appointmentsApi } from '@/api/appointmentsApi';
import { invoicesApi } from '@/api/invoicesApi';
import { staffApi } from '@/api/staffApi';
import { useAutoAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAutoAuth();
  const [stats, setStats] = useState({ customers: 0, appointments: 0, invoices: 0, staff: 0 });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [appointmentStatusBreakdown, setAppointmentStatusBreakdown] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  });
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- Data Fetching from Real API ---
  useEffect(() => {
    async function load() {
      try {
        // Fetch all data in parallel with error isolation
        let customers = [];
        let appointments = [];
        let invoices = [];
        let staffList = [];

        try {
          const customersRes = await customersApi.list();
          customers = customersRes?.data?.data || customersRes?.data || [];
        } catch (e) {
          console.warn('Failed to fetch customers:', e);
        }

        try {
          const appointmentsRes = await appointmentsApi.list();
          appointments = appointmentsRes?.data?.data || appointmentsRes?.data || [];
        } catch (e) {
          console.warn('Failed to fetch appointments:', e);
        }

        try {
          const invoicesRes = await invoicesApi.list();
          invoices = invoicesRes?.data?.data || invoicesRes?.data || [];
        } catch (e) {
          console.warn('Failed to fetch invoices:', e);
        }

        try {
          const staffRes = await staffApi.list();
          staffList = staffRes?.data?.data || staffRes?.data || [];
        } catch (e) {
          console.warn('Failed to fetch staff:', e);
        }

        const customerCount = Array.isArray(customers) ? customers.length : 0;
        const appointmentCount = Array.isArray(appointments) ? appointments.length : 0;
        const invoiceCount = Array.isArray(invoices) ? invoices.length : 0;
        const staffCount = Array.isArray(staffList) ? staffList.length : 0;

        setStats({
          customers: customerCount,
          appointments: appointmentCount,
          invoices: invoiceCount,
          staff: staffCount,
        });

        // Calculate appointment status breakdown
        if (Array.isArray(appointments)) {
          const statusBreakdown = {
            pending: appointments.filter(a => 
              ['PENDING', 'CONFIRMED'].includes(a.status)
            ).length,
            inProgress: appointments.filter(a => 
              ['UNDER_INSPECTION', 'WAITING_FOR_APPROVAL', 'IN_PROGRESS'].includes(a.status)
            ).length,
            completed: appointments.filter(a => a.status === 'COMPLETED').length,
            cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
          };
          setAppointmentStatusBreakdown(statusBreakdown);

          // Sort by date descending and take 5 for recent appointments
          const sorted = [...appointments].sort((a, b) => {
            const dateA = a.appointmentDate ? new Date(a.appointmentDate) : new Date(0);
            const dateB = b.appointmentDate ? new Date(b.appointmentDate) : new Date(0);
            return dateB - dateA;
          });
          setRecentAppointments(sorted.slice(0, 5));
        }

        // Calculate total revenue from invoices
        if (Array.isArray(invoices)) {
          const revenue = invoices
            .filter(inv => inv.status === 'PAID' || inv.status === 'COMPLETED')
            .reduce((sum, inv) => sum + (parseFloat(inv.totalAmount) || 0), 0);
          setTotalRevenue(revenue);
        }
      } catch (error) {
        console.error("Dashboard data load failed", error);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <PageContainer 
      title="Dashboard" 
      subtitle={`Welcome back, ${user?.name || 'Administrator'}`}
    >
      {/* --- Key Performance Indicators (KPIs) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <StatCard 
          title="Total Customers" 
          value={stats.customers} 
          icon={Users} 
          color="primary" 
          description="Active garage clients"
        />
        <StatCard 
          title="Appointments" 
          value={stats.appointments} 
          icon={CalendarDays} 
          color="secondary" 
          description="Total service bookings"
        />
        <StatCard 
          title="Total Invoices" 
          value={stats.invoices} 
          icon={FileText} 
          color="accent" 
          description="Processed billing"
        />
        <StatCard 
          title="Staff Members" 
          value={stats.staff} 
          icon={UserCog} 
          color="destructive" 
          description="Active employees"
        />
      </div>

      {/* --- Main Dashboard Content Area --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- Section: Recent Appointments (Large Card) --- */}
        <Card className="lg:col-span-2 border-none shadow-md bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold tracking-tight">Recent Appointments</CardTitle>
              <CardDescription>List of your latest service bookings</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="hidden sm:flex items-center gap-2">
              <Link to="/appointments">
                View All <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 px-0 sm:px-6">
            {recentAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                   <CalendarDays className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No recent appointments found</p>
                <Button variant="link" asChild className="mt-2 text-primary">
                  <Link to="/appointments">Create your first appointment</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {recentAppointments.map((apt, idx) => (
                  <React.Fragment key={apt.id}>
                    <div className="group flex items-center justify-between p-4 rounded-xl hover:bg-accent/50 transition-all cursor-default">
                      <div className="flex items-center gap-4">
                        {/* Avatar / Icon Placeholder */}
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {apt.customerName?.charAt(0) || apt.customer?.fullName?.charAt(0) || 'C'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold group-hover:text-primary transition-colors">
                            {apt.customerName || apt.customer?.fullName || 'Walk-in Customer'}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              {apt.appointmentDate ? format(new Date(apt.appointmentDate), 'MMM d, yyyy') : 'Date TBD'}
                            </span>
                            <span>•</span>
                            <span>{apt.appointmentTime || 'Pending Time'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <StatusBadge status={apt.status || 'PENDING'} className="hidden sm:flex" />
                        <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                           <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {idx < recentAppointments.length - 1 && <Separator className="opacity-50" />}
                  </React.Fragment>
                ))}
              </div>
            )}
          </CardContent>
          
          {/* Mobile-only view all button */}
          <div className="p-4 pt-0 sm:hidden">
             <Button variant="outline" className="w-full" asChild>
                <Link to="/appointments">View All Appointments</Link>
             </Button>
          </div>
        </Card>

        {/* --- Section: Quick Actions & Hub (Side Card) --- */}
        <div className="space-y-6">
          <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2">
              {[
                { label: 'Register Customer', path: '/customers', icon: Users, desc: 'Add new client' },
                { label: 'Book Appointment', path: '/appointments', icon: Plus, desc: 'Schedule service' },
                { label: 'Service Tracking', path: '/service-tracking', icon: Activity, desc: 'Track a progress' },
                { label: 'Generate Invoice', path: '/invoices', icon: FileText, desc: 'Bill a customer' },
              ].map(action => (
                <Link
                  key={action.path}
                  to={action.path}
                  className="flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/[0.03] active:scale-[0.98] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:rotate-6 transition-all duration-300">
                    <action.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{action.label}</span>
                    <span className="text-[11px] text-muted-foreground">{action.desc}</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* --- Section: Appointment Status Overview / Insights --- */}
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg border-none overflow-hidden relative">
            <CardContent className="p-6">
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-wider opacity-80">Service Overview</span>
                  </div>

                  {/* Main insight stat */}
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-black">{stats.appointments}</span>
                    <span className="text-sm opacity-80">total appointments</span>
                  </div>

                  {/* Status breakdown bars */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Pending / Confirmed
                      </span>
                      <span className="font-bold">{appointmentStatusBreakdown.pending}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-300 rounded-full transition-all duration-700"
                        style={{ width: `${stats.appointments > 0 ? (appointmentStatusBreakdown.pending / stats.appointments) * 100 : 0}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5" />
                        In Progress
                      </span>
                      <span className="font-bold">{appointmentStatusBreakdown.inProgress}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-300 rounded-full transition-all duration-700"
                        style={{ width: `${stats.appointments > 0 ? (appointmentStatusBreakdown.inProgress / stats.appointments) * 100 : 0}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed
                      </span>
                      <span className="font-bold">{appointmentStatusBreakdown.completed}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-300 rounded-full transition-all duration-700"
                        style={{ width: `${stats.appointments > 0 ? (appointmentStatusBreakdown.completed / stats.appointments) * 100 : 0}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Cancelled
                      </span>
                      <span className="font-bold">{appointmentStatusBreakdown.cancelled}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-300 rounded-full transition-all duration-700"
                        style={{ width: `${stats.appointments > 0 ? (appointmentStatusBreakdown.cancelled / stats.appointments) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Revenue info */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/20">
                    <DollarSign className="w-4 h-4 opacity-80" />
                    <span className="text-xs opacity-80">Total Revenue:</span>
                    <span className="text-sm font-bold">
                      ₱{totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
               </div>
               {/* Decorative Background Pattern */}
               <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Activity className="w-24 h-24" />
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}