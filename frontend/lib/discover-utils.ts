import type { DiscoverFilters, DiscoverProfile } from './discover-types';
import { api } from '@/lib/api';

export function filtersToParams(filters: DiscoverFilters, sort: string): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.skills.length) params.set('skill', filters.skills.join(','));
  if (filters.location) params.set('location', filters.location);
  if (filters.experience) params.set('experienceLevel', filters.experience);
  if (filters.remote) params.set('remote', 'true');
  if (filters.available) params.set('available', 'true');
  if (sort === 'newest') params.set('sort', 'newest');
  params.set('hideSelf', 'true');
  return params;
}

export function filtersToUrl(filters: DiscoverFilters, sort: string): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.skills.length) params.set('skills', filters.skills.join(','));
  if (filters.location) params.set('location', filters.location);
  if (filters.experience) params.set('experience', filters.experience);
  if (filters.remote) params.set('remote', 'true');
  if (filters.available) params.set('available', 'true');
  if (sort !== 'best') params.set('sort', sort);
  return params;
}

export function parseFiltersFromSearchParams(params: URLSearchParams): DiscoverFilters {
  return {
    skills: params.get('skills')?.split(',').filter(Boolean) ?? [],
    location: params.get('location') ?? '',
    experience: params.get('experience') ?? '',
    remote: params.get('remote') === 'true',
    available: params.get('available') === 'true',
  };
}

export async function loadProfiles(
  filters: DiscoverFilters,
  sort: string,
  token: string | null,
  offset = 0,
): Promise<DiscoverProfile[]> {
  const params = filtersToParams(filters, sort);
  if (offset > 0) params.set('offset', String(offset));
  const qs = params.toString();
  const data = await api.get<DiscoverProfile[]>(`/discover${qs ? `?${qs}` : ''}`, token ?? undefined);
  return Array.isArray(data) ? data : [];
}

export async function loadRecentProfiles(token: string | null): Promise<DiscoverProfile[]> {
  try {
    const data = await api.get<DiscoverProfile[]>('/discover?sort=newest&limit=5', token ?? undefined);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function performSwipe(
  targetId: string,
  action: 'LIKE' | 'PASS' | 'SUPER_LIKE',
  token: string | null,
): Promise<{ matched: boolean; match?: { matchScore?: number } }> {
  return api.post<{ matched: boolean; match?: { matchScore?: number } }>(
    '/discover/swipe',
    { targetId, action },
    token ?? undefined,
  );
}

export async function performUndo(token: string | null): Promise<void> {
  await api.post('/discover/undo', undefined, token ?? undefined);
}
