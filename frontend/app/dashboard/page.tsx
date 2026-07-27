import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold">Welcome back 👋</h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening in your network.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Profile completeness</p>
            <p className="mt-2 text-3xl font-bold text-primary">72%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active matches</p>
            <p className="mt-2 text-3xl font-bold text-match">5</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Open invitations</p>
            <p className="mt-2 text-3xl font-bold text-accent">2</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/discover"><Button>Discover Developers</Button></Link>
        <Link href="/projects/create"><Button variant="secondary">Create Project</Button></Link>
        <Link href="/chat"><Button variant="secondary">Messages</Button></Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Matches</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No matches yet — head to Discover to find your next collaborator.
        </CardContent>
      </Card>
    </div>
  );
}
