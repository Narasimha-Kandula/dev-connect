import { Quote } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  quote: string;
  metric: string;
  metricLabel: string;
}

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="flex min-w-[280px] max-w-[280px] sm:min-w-[340px] sm:max-w-[340px] flex-col rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
      <Quote size={24} className="mb-3 text-primary/30" />
      <p className="flex-1 text-sm text-muted-foreground leading-relaxed">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
      <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {testimonial.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{testimonial.name}</p>
          <p className="truncate text-xs text-muted-foreground">{testimonial.role}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-primary">{testimonial.metric}</p>
          <p className="text-xs text-muted-foreground">{testimonial.metricLabel}</p>
        </div>
      </div>
    </div>
  );
}
