import type { LandingPageTemplate } from '@/types/schema';
import { STORAGE_KEY } from './constants/storage';
import { ApiRoutes, apiSitePath } from './constants/routes';
import { SiteStatus } from './constants/status';

export interface Site {
  id: string;
  name: string;
  templateId: string;
  slug?: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  data: LandingPageTemplate;
}


// ── localStorage (primary write target) ──────────────────────────────────────

export function getSites(): Site[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSites(sites: Site[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
}

export function getSiteById(id: string): Site | undefined {
  return getSites().find(s => s.id === id);
}

export function isSiteNameUnique(name: string, excludeId?: string): boolean {
  return !getSites().some(
    s => s.name.trim().toLowerCase() === name.trim().toLowerCase() && s.id !== excludeId,
  );
}

export function createSite(name: string, templateId: string, data: LandingPageTemplate): Site {
  const sites = getSites();
  const newSite: Site = {
    id: `site_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    templateId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    published: false,
    data,
  };
  saveSites([...sites, newSite]);
  void apiSync(ApiRoutes.Sites, 'POST', { id: newSite.id, name, templateId, data });
  return newSite;
}

export function updateSite(id: string, updates: Partial<Omit<Site, 'id' | 'createdAt'>>): Site | null {
  const sites = getSites();
  const idx = sites.findIndex(s => s.id === id);
  if (idx === -1) return null;
  const updated: Site = { ...sites[idx], ...updates, updatedAt: new Date().toISOString() };
  sites[idx] = updated;
  saveSites(sites);
  void apiSync(apiSitePath(id), 'PUT', {
    name: updated.name,
    data: updated.data,
    published: updated.published,
  });
  return updated;
}

export function deleteSite(id: string): void {
  saveSites(getSites().filter(s => s.id !== id));
  void apiSync(apiSitePath(id), 'DELETE');
}

// ── API sync (background, fire-and-forget) ────────────────────────────────────

async function apiSync(path: string, method: string, body?: unknown): Promise<void> {
  try {
    await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // localStorage is the safety net — silently ignore network failures
  }
}

// ── DB row → Site (used by pages that load from API first) ───────────────────

export function dbRowToSite(row: Record<string, unknown>): Site {
  return {
    id: row.id as string,
    name: row.name as string,
    templateId: row.template_id as string,
    slug: row.slug as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    published: row.status === SiteStatus.Published,
    data: row.data as LandingPageTemplate,
  };
}
