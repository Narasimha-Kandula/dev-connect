'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Key, Webhook, BookOpen } from 'lucide-react';

export default function DevelopersPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight"><Code size={24} className="mr-2 inline" /> Developer Hub</h1>
        <p className="mt-2 text-sm text-muted-foreground">Integrate DevConnect into your workflows.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/developers/api-keys">
          <Card className="cursor-pointer transition-shadow hover:shadow-md h-full">
            <CardContent className="pt-6 text-center">
              <Key size={28} className="mx-auto mb-3 text-primary" />
              <p className="font-semibold">API Keys</p>
              <p className="mt-1 text-xs text-muted-foreground">Generate and manage tokens</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/developers/webhooks">
          <Card className="cursor-pointer transition-shadow hover:shadow-md h-full">
            <CardContent className="pt-6 text-center">
              <Webhook size={28} className="mx-auto mb-3 text-accent" />
              <p className="font-semibold">Webhooks</p>
              <p className="mt-1 text-xs text-muted-foreground">Real-time event integrations</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/developers/api-docs">
          <Card className="cursor-pointer transition-shadow hover:shadow-md h-full">
            <CardContent className="pt-6 text-center">
              <BookOpen size={28} className="mx-auto mb-3 text-success" />
              <p className="font-semibold">API Docs</p>
              <p className="mt-1 text-xs text-muted-foreground">Endpoints and examples</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/usage">
          <Card className="cursor-pointer transition-shadow hover:shadow-md h-full">
            <CardContent className="pt-6 text-center">
              <Code size={28} className="mx-auto mb-3 text-warning" />
              <p className="font-semibold">Usage</p>
              <p className="mt-1 text-xs text-muted-foreground">Rate limits and quotas</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="font-semibold">API Overview</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The DevConnect API enables you to programmatically access profiles, matches, messages, and projects.
            All endpoints require authentication via Bearer token in the Authorization header.
          </p>
          <div className="mt-4 rounded-lg bg-muted p-4 font-mono text-xs">
            <p className="text-success">$ curl -H &quot;Authorization: Bearer YOUR_API_KEY&quot; \</p>
            <p className="text-success">&nbsp;&nbsp;https://api.devconnect.dev/api/v1/users/me</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
