import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/shared/PageContainer';
import StatCard from '@/components/dashboard/StatCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Users, Car, CalendarDays, FileText, UserCog, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/shared/StatusBadge';
import { customersApi, appointmentsApi, invoicesApi, staffApi } from '@/services/api';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAutoAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAutoAuth();
  const [stats, setStats] = useState({ customers: 0, appointments: 0, invoices: 0, staff: 0 });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

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
          setRecentAppointments(appointments.slice(0, 5));
        }
      } catch {
        // API not available – use zero stats
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <PageContainer title="Dashboard" subtitle={`Welcome back, ${user?.fullName}`}>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Customers" value={stats.customers} icon={Users} color="primary" />
        <StatCard title="Appointments" value={stats.appointments} icon={CalendarDays} color="secondary" />
        <StatCard title="Invoices" value={stats.invoices} icon={FileText} color="accent" />
        <StatCard title="Staff" value={stats.staff} icon={UserCog} color="destructive" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-base">Recent Appointments</CardTitle>
              <Link to="/appointments" className="text-xs text-primary font-semibold hover:underline">View All</Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No appointments yet</p>
            ) : (
              <div className="space-y-3">
                {recentAppointments.map(apt => (
                  <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-semibold">{apt.customerName || 'Customer'}</p>
                      <p className="text-xs text-muted-foreground">
                        {apt.appointmentDate ? format(new Date(apt.appointmentDate), 'MMM d, yyyy') : 'N/A'}
                        {apt.appointmentTime && ` at ${apt.appointmentTime}`}
                      </p>
                    </div>
                    <StatusBadge status={apt.status || 'PENDING'} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'New Customer', path: '/customers', icon: Users },
              { label: 'New Appointment', path: '/appointments', icon: CalendarDays },
              { label: 'Service Tracking', path: '/service-tracking', icon: Activity },
              { label: 'Invoices', path: '/invoices', icon: FileText },
            ].map(action => (
              <Link
                key={action.path}
                to={action.path}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <action.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}