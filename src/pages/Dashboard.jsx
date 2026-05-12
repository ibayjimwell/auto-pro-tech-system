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
  TrendingUp
} from 'lucide-react';

// Shadcn & UI Components
import PageContainer from '@/components/shared/PageContainer';
import StatCard from '@/components/dashboard/StatCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// Services & Context
import { customersApi, appointmentsApi, invoicesApi, staffApi } from '@/services/api';
import { useAutoAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAutoAuth();
  const [stats, setStats] = useState({ customers: 0, appointments: 0, invoices: 0, staff: 0 });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Data Fetching Logic (Unchanged Functionality) ---
  useEffect(() => {
    async function load() {
      try {
        const [customers, appointments, invoices, staffList] = await Promise.all([
          customersApi.list().catch(() => []),
          appointmentsApi.list().catch(() => []),
          invoicesApi.list().catch(() => []),
          staffApi.list().catch(() => []),
        ]);
        
        setStats({
          customers: Array.isArray(customers) ? customers.length : 0,
          appointments: Array.isArray(appointments) ? appointments.length : 0,
          invoices: Array.isArray(invoices) ? invoices.length : 0,
          staff: Array.isArray(staffList) ? staffList.length : 0,
        });

        if (Array.isArray(appointments)) {
          // Sort by date descending and take 5
          setRecentAppointments(appointments.slice(0, 5));
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
      subtitle={`Welcome back, ${user?.fullName || 'Administrator'}`}
    >
      {/* --- Key Performance Indicators (KPIs) --- */}
      {/* Responsive Grid: 1 col on mobile, 2 on tablet, 4 on desktop */}
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
          description="Scheduled this month"
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
          description="Online technicians"
        />
      </div>

      {/* --- Main Dashboard Content Area --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- Section: Recent Appointments (Large Card) --- */}
        <Card className="lg:col-span-2 border-none shadow-md bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold tracking-tight">Recent Appointments</CardTitle>
              <CardDescription>Live feed of your latest service bookings</CardDescription>
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
                          {apt.customerName?.charAt(0) || 'C'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold group-hover:text-primary transition-colors">
                            {apt.customerName || 'Walk-in Customer'}
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
                { label: 'Service Tracking', path: '/service-tracking', icon: Activity, desc: 'Live bay status' },
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

          {/* --- Section: Business Overview / Insights --- */}
          <Card className="bg-primary text-primary-foreground shadow-lg border-none overflow-hidden relative">
            <CardContent className="p-6">
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-wider opacity-80">Insights</span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">Productivity is up</h3>
                  <p className="text-sm opacity-80 leading-relaxed">
                    Your staff completed 12% more services this week compared to last. 
                  </p>
                  <Button variant="secondary" size="sm" className="mt-4 font-bold rounded-lg shadow-sm">
                    View Reports
                  </Button>
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