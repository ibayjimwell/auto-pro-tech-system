import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/shared/PageContainer';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Car, Trash2 } from 'lucide-react';
import { vehiclesApi } from '@/services/api';
import { notify } from '@/lib/notify';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const data = await vehiclesApi.list();
      setVehicles(Array.isArray(data) ? data : []);
    } catch { setVehicles([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    try {
      await vehiclesApi.delete(id);
      notify.success('Vehicle deleted');
      load();
    } catch (err) {
      notify.error(err.message || 'Error');
    }
  };

  const filtered = vehicles.filter(v =>
    (v.plateNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.make || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.model || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer title="Vehicles" subtitle="All registered vehicles">
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by plate, make, or model..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={Car} title="No vehicles found" description="Vehicles are added through customer profiles" />
      ) : (
        <>
        {/* Mobile card view */}
        <div className="space-y-3 md:hidden">
          {filtered.map(v => (
            <Card key={v.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{v.plateNumber}</p>
                  <p className="text-sm text-muted-foreground">{v.year} {v.make} {v.model}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
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
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Make</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-semibold">{v.plateNumber}</TableCell>
                    <TableCell>{v.make}</TableCell>
                    <TableCell>{v.model}</TableCell>
                    <TableCell>{v.year}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </>
      )}
    </PageContainer>
  );
}