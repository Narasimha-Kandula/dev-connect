'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Copy } from 'lucide-react';

const ENDPOINTS = [
  { method: 'GET', path: '/api/v1/users/me', desc: 'Get current user profile' },
  { method: 'PUT', path: '/api/v1/profile', desc: 'Update profile' },
  { method: 'GET', path: '/api/v1/discovery/profiles', desc: 'Get discovery feed' },
  { method: 'POST', path: '/api/v1/discovery/swipe', desc: 'Swipe on a profile' },
  { method: 'GET', path: '/api/v1/matching/matches', desc: 'List matches' },
  { method: 'POST', path: '/api/v1/chat/messages', desc: 'Send a message' },
  { method: 'GET', path: '/api/v1/projects', desc: 'List projects' },
  { method: 'POST', path: '/api/v1/projects', desc: 'Create a project' },
];

export default function ApiDocsPage() {
  const [copied, setCopied] = useState('');

  function copyExample(path: string) {
    navigator.clipboard.writeText(`curl -H "Authorization: Bearer YOUR_API_KEY" https://api.devconnect.dev${path}`);
    setCopied(path);
    setTimeout(() => setCopied(''), 2000);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight"><BookOpen size={20} className="mr-2 inline" /> API Documentation</h1>
      <p className="text-sm text-muted-foreground">REST API endpoints for integrating with DevConnect.</p>

      <Card>
        <CardHeader><CardTitle>Authentication</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">All API requests require a Bearer token in the Authorization header:</p>
          <div className="rounded-lg bg-muted p-3 font-mono text-xs">
            <p>Authorization: Bearer YOUR_API_KEY</p>
          </div>
          <p className="text-muted-foreground">Generate API keys from the <a href="/developers/api-keys" className="text-foreground underline">API Keys</a> page.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Endpoints</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {ENDPOINTS.map((ep) => (
            <div key={ep.path} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold ${
                ep.method === 'GET' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
              }`}>{ep.method}</span>
              <code className="flex-1 text-xs">{ep.path}</code>
              <span className="hidden text-xs text-muted-foreground sm:inline">{ep.desc}</span>
              <button onClick={() => copyExample(ep.path)} className="shrink-0 text-muted-foreground hover:text-foreground">
                <Copy size={14} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {copied && (
        <Card className="border-success">
          <CardContent className="py-3 text-center text-sm text-success">Copied cURL example to clipboard!</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Rate Limiting</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>Standard rate limit: 100 requests per minute per API key.</p>
          <p>Enterprise rate limit: 1,000 requests per minute.</p>
          <p>Rate limit headers are included in all responses: <code className="text-xs">X-RateLimit-Limit</code>, <code className="text-xs">X-RateLimit-Remaining</code></p>
        </CardContent>
      </Card>
    </div>
  );
}
