'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Globe, Briefcase } from 'lucide-react';
import { api } from '@/lib/api';
import type { DiscoverFilters } from '@/lib/discover-types';

interface FilterPanelProps {
  filters: DiscoverFilters;
  onChange: (filters: DiscoverFilters) => void;
  onApply: () => void;
  token: string | null;
}

export function FilterPanel({ filters, onChange, onApply, token }: FilterPanelProps) {
  const [skillSearch, setSkillSearch] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState<{ id: string; name: string }[]>([]);
  const skillTimeout = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (skillTimeout.current) clearTimeout(skillTimeout.current);
    };
  }, []);

  const handleSkillSearch = useCallback((query: string) => {
    setSkillSearch(query);
    if (skillTimeout.current) clearTimeout(skillTimeout.current);
    if (query.length < 1) { setSkillSuggestions([]); return; }
    skillTimeout.current = setTimeout(async () => {
      try {
        const data = await api.get<{ id: string; name: string }[]>(`/skills?search=${encodeURIComponent(query)}`, token ?? undefined);
        setSkillSuggestions(Array.isArray(data) ? data : []);
      } catch { setSkillSuggestions([]); }
    }, 200);
  }, [token]);

  const addSkill = useCallback((name: string) => {
    onChange({ ...filters, skills: [...filters.skills, name] });
    setSkillSearch('');
    setSkillSuggestions([]);
  }, [filters, onChange]);

  const removeSkill = useCallback((name: string) => {
    onChange({ ...filters, skills: filters.skills.filter((s) => s !== name) });
  }, [filters, onChange]);

  const updateFilter = useCallback(<K extends keyof DiscoverFilters>(key: K, value: DiscoverFilters[K]) => {
    onChange({ ...filters, [key]: value });
  }, [filters, onChange]);

  const clearAll = useCallback(() => {
    onChange({ skills: [], location: '', experience: '', remote: false, available: false });
    setSkillSearch('');
    setSkillSuggestions([]);
  }, [onChange]);

  return (
    <Card className="mb-6">
      <CardContent className="space-y-3 pt-6">
        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {(filters.skills ?? []).map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {s}
              <button onClick={() => removeSkill(s)} className="hover:text-destructive"><XCircle size={14} /></button>
            </span>
          ))}
          <div className="relative">
            <input
              placeholder="Add skill…"
              value={skillSearch}
              onChange={(e) => handleSkillSearch(e.target.value)}
              className="min-w-[120px] rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {skillSuggestions.length > 0 && (
              <div className="absolute z-30 mt-1 w-full rounded-lg border border-border bg-card shadow-xl max-h-40 overflow-y-auto">
                {skillSuggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => addSkill(s.name)}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted/30 transition-colors"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Location + Experience */}
        <div className="flex flex-wrap gap-3">
          <input
            placeholder="Location"
            value={filters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
            className="flex-1 min-w-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={filters.experience}
            onChange={(e) => updateFilter('experience', e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Any level</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
          </select>
        </div>

        {/* Checkboxes */}
        <div className="flex flex-wrap gap-3 items-center">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={filters.remote}
              onChange={(e) => updateFilter('remote', e.target.checked)}
              className="rounded border-input"
            />
            <Globe size={14} className="text-muted-foreground" /> Remote only
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={filters.available}
              onChange={(e) => updateFilter('available', e.target.checked)}
              className="rounded border-input"
            />
            <Briefcase size={14} className="text-muted-foreground" /> Available for hire
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" onClick={onApply}>Apply Filters</Button>
          <Button size="sm" variant="ghost" onClick={clearAll}>Clear All</Button>
        </div>
      </CardContent>
    </Card>
  );
}
