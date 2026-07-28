'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Calendar, MapPin, Users, ExternalLink } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  type: string;
  participantCount: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ events: Event[] }>('/events', token)
      .then((d) => setEvents(d.events ?? []))
      .catch(() => {});
  }, [token]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight"><Calendar size={20} className="mr-2 inline" /> Events</h1>
      <p className="text-sm text-muted-foreground">Hackathons, meetups, and collaboration events.</p>

      {events.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No upcoming events. Check back later.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <Card key={e.id}>
            <CardContent className="pt-6">
              <span className="text-xs font-medium text-primary uppercase">{e.type}</span>
              <p className="mt-1 font-semibold">{e.title}</p>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{e.description}</p>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center gap-1"><Calendar size={12} /> {new Date(e.date).toLocaleDateString()}</p>
                <p className="flex items-center gap-1"><MapPin size={12} /> {e.location}</p>
                <p className="flex items-center gap-1"><Users size={12} /> {e.participantCount} participants</p>
              </div>
              <Button size="sm" className="mt-4 w-full">Register</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
