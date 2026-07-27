'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Switch between light and dark mode.</p>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <label className="flex items-center justify-between">
            Match notifications <input type="checkbox" defaultChecked />
          </label>
          <label className="flex items-center justify-between">
            Message notifications <input type="checkbox" defaultChecked />
          </label>
          <label className="flex items-center justify-between">
            Weekly digest email <input type="checkbox" />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">Password, two-factor authentication, and active sessions.</p>
        </CardContent>
      </Card>
    </div>
  );
}
