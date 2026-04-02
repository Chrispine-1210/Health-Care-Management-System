import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrescriptionStatus } from '@/components/PrescriptionStatus';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Upload, CheckCircle } from 'lucide-react';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/prescriptions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setPrescriptions(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  if (loading) return <LoadingSpinner text="Loading prescriptions..." />;

  const pending = prescriptions.filter(p => p.status === 'pending');
  const approved = prescriptions.filter(p => p.status === 'approved');
  const dispensed = prescriptions.filter(p => p.status === 'dispensed');

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Prescriptions</h1>
        <Button className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Prescription
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({prescriptions.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="dispensed">Dispensed ({dispensed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid gap-4">
            {prescriptions.map(p => (
              <Card key={p.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base">Prescription #{p.id}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {p.prescriberName || 'Dr. Unknown'}
                    </p>
                  </div>
                  <PrescriptionStatus status={p.status || 'pending'} />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Medications:</strong> {p.medications?.length || 0}</p>
                    <p><strong>Issued:</strong> {new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <p className="text-muted-foreground">No pending prescriptions</p>
        </TabsContent>

        <TabsContent value="approved">
          <p className="text-muted-foreground">No approved prescriptions</p>
        </TabsContent>

        <TabsContent value="dispensed">
          <p className="text-muted-foreground">No dispensed prescriptions</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
