import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, ArrowRight, Compass, Zap, Search } from 'lucide-react';

const HOTSPOTS = [
  {
    icon: Compass,
    title: 'Discover Feed',
    desc: 'AI-ranked developer profiles with skill tags, reputation score, and availability status.',
    x: '20%', y: '30%',
  },
  {
    icon: Zap,
    title: 'Instant Match',
    desc: 'Mutual interest triggers a match and opens a conversation channel automatically.',
    x: '50%', y: '55%',
  },
  {
    icon: Search,
    title: 'Smart Filters',
    desc: 'Filter by tech stack, location, experience level, and collaboration intent.',
    x: '75%', y: '40%',
  },
];

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          See How It Works in Real-Time.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
          Watch a 60-second walkthrough or explore the interactive demo below.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/20">
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
                <Play size={28} />
              </div>
              <p className="font-semibold">Product Walkthrough (60s)</p>
              <p className="text-sm text-muted-foreground">Hosted on privacy-friendly CDN</p>
            </div>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="mb-6 text-2xl font-bold">Interactive Dashboard Preview</h2>
        <Card className="relative overflow-hidden">
          <div className="relative h-[400px] bg-muted">
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Interactive mock area</p>
            </div>
            {HOTSPOTS.map((h) => (
              <div
                key={h.title}
                className="group absolute"
                style={{ left: h.x, top: h.y }}
              >
                <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-110">
                  <h.icon size={14} />
                </div>
                <div className="absolute left-10 top-0 hidden w-56 rounded-lg border border-border bg-background p-3 shadow-lg group-hover:block">
                  <p className="text-sm font-semibold">{h.title}</p>
                  <p className="text-xs text-muted-foreground">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="font-semibold">Use Case</p>
            <p className="text-sm text-muted-foreground">Find a React developer in under 5 minutes</p>
          </div>
          <Link href="/signup"><Button>Try It Now <ArrowRight size={16} className="ml-1" /></Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
