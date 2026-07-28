'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const [period, setPeriod] = useState('30d');
  const [generated, setGenerated] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight"><FileText size={20} className="mr-2 inline" /> Reports</h1>
      <p className="text-sm text-muted-foreground">Generate and download platform reports.</p>

      <Card>
        <CardHeader><CardTitle>Generate Report</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Period</label>
            <div className="flex gap-2">
              {['7d', '30d', '90d', 'custom'].map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${period === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {p === 'custom' ? 'Custom' : p}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Report Type</label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                <option>User Activity</option>
                <option>Match Analytics</option>
                <option>Engagement Report</option>
                <option>Moderation Report</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Format</label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                <option>CSV</option>
                <option>PDF</option>
                <option>JSON</option>
              </select>
            </div>
          </div>
          <Button onClick={() => setGenerated(true)}><Calendar size={14} className="mr-1" /> Generate Report</Button>
        </CardContent>
      </Card>

      {generated && (
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-primary" />
              <div>
                <p className="text-sm font-medium">report_users_2026-07.pdf</p>
                <p className="text-xs text-muted-foreground">Generated just now · 2.4 MB</p>
              </div>
            </div>
            <Button variant="secondary" size="sm"><Download size={14} className="mr-1" /> Download</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
