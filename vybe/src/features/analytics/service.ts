import 'server-only';
import { createHash } from 'node:crypto';
import { getDb } from '@/lib/db';
import { env } from '@/lib/env';

/**
 * Metric definitions (shown verbatim in the dashboard):
 *  - View: a unique visitor opening a published profile, counted at most once
 *    per profile per UTC day. Bots and the profile owner are excluded.
 *  - Click: a tracked activation of a link or button on the profile.
 *  - Click-through rate: clicks ÷ views over the same date range.
 *
 * Privacy: no IP addresses, cookies or fingerprints are stored. Unique views use
 * sha256(secret, day, ip, user-agent, profile) kept for two days only; events
 * store a coarse device class, referrer host and (when the host provides it)
 * a country code. Visitors sending Global Privacy Control / Do Not Track are
 * counted without referrer or country.
 */
export const METRIC_DEFINITIONS = {
  views: 'Unique visitors per profile per day. Bots and your own visits are not counted.',
  clicks: 'Times a visitor opened one of your links or buttons.',
  ctr: 'Clicks divided by views in the selected range.',
} as const;

const RETENTION_DAYS = 400;

export function visitorHash(input: { ip: string; userAgent: string; profileId: string; day: string }): string {
  return createHash('sha256').update(`${env.analyticsSalt}|${input.day}|${input.ip}|${input.userAgent}|${input.profileId}`).digest('hex').slice(0, 32);
}

export type TrackInput = {
  profileId: string;
  type: 'view' | 'click' | 'widget';
  targetId: string | null;
  referrerHost: string | null;
  device: string;
  country: string | null;
  ip: string;
  userAgent: string;
  viewerUserId: string | null;
  limitedTracking: boolean;
};

export async function recordEvent(input: TrackInput): Promise<'recorded' | 'duplicate' | 'ignored'> {
  const db = await getDb();
  const profile = await db.one<{ user_id: string }>('select user_id from profiles where id = $1 and is_published and suspended_at is null', [input.profileId]);
  if (!profile) return 'ignored';
  if (input.viewerUserId && input.viewerUserId === profile.user_id) return 'ignored';

  const referrer = input.limitedTracking ? null : input.referrerHost;
  const country = input.limitedTracking ? null : input.country;

  if (input.type === 'view') {
    const day = new Date().toISOString().slice(0, 10);
    const hash = visitorHash({ ip: input.ip, userAgent: input.userAgent, profileId: input.profileId, day });
    const recorded = await db.tx(async (q) => {
      const inserted = await q.query('insert into view_dedup (profile_id, visitor_hash, day) values ($1, $2, $3) on conflict do nothing returning 1', [input.profileId, hash, day]);
      if (!inserted.length) return false;
      await q.query('update profiles set view_count = view_count + 1 where id = $1', [input.profileId]);
      await q.query('insert into analytics_events (profile_id, type, referrer_host, device, country) values ($1, $2, $3, $4, $5)', [input.profileId, 'view', referrer, input.device, country]);
      return true;
    });
    if (Math.random() < 0.02) {
      await db.query(`delete from view_dedup where day < current_date - 2`);
      await db.query(`delete from analytics_events where created_at < now() - ($1 || ' days')::interval`, [String(RETENTION_DAYS)]);
    }
    return recorded ? 'recorded' : 'duplicate';
  }

  // Clicks must reference an item that is actually on the published page.
  if (!input.targetId) return 'ignored';
  const field = input.type === 'click' ? 'links' : 'widgets';
  const exists = await db.one(
    `select 1 from profiles where id = $1 and published_snapshot -> 'doc' -> '${field}' @> $2::jsonb`,
    [input.profileId, JSON.stringify([{ id: input.targetId }])],
  );
  if (!exists) return 'ignored';
  await db.query('insert into analytics_events (profile_id, type, target_id, referrer_host, device, country) values ($1, $2, $3, $4, $5, $6)', [
    input.profileId,
    input.type,
    input.targetId,
    referrer,
    input.device,
    country,
  ]);
  return 'recorded';
}

export type AnalyticsReport = {
  rangeDays: number;
  totals: { views: number; clicks: number; ctr: number | null; dailyAverage: number; allTimeViews: number };
  series: { day: string; views: number; clicks: number }[];
  topLinks: { id: string; clicks: number }[];
  topWidgets: { id: string; interactions: number }[];
  referrers: { host: string; views: number }[];
  devices: { device: string; views: number }[];
  countries: { country: string; views: number }[];
  hasCountryData: boolean;
};

export async function getAnalytics(profileId: string, rangeDays: number): Promise<AnalyticsReport> {
  const days = [7, 30, 90, 365].includes(rangeDays) ? rangeDays : 30;
  const db = await getDb();
  const since = `now() - ($2 || ' days')::interval`;
  const params = [profileId, String(days)];

  const [totals, series, topLinks, topWidgets, referrers, devices, countries, allTime] = await Promise.all([
    db.one<{ views: number; clicks: number }>(
      `select count(*) filter (where type = 'view')::int as views, count(*) filter (where type = 'click')::int as clicks
         from analytics_events where profile_id = $1 and created_at > ${since}`,
      params,
    ),
    db.query<{ day: string; views: number; clicks: number }>(
      `select to_char(d.day, 'YYYY-MM-DD') as day,
              coalesce(count(e.id) filter (where e.type = 'view'), 0)::int as views,
              coalesce(count(e.id) filter (where e.type = 'click'), 0)::int as clicks
         from generate_series((now() at time zone 'utc')::date - ($2::int - 1), (now() at time zone 'utc')::date, interval '1 day') as d(day)
         left join analytics_events e on e.profile_id = $1 and (e.created_at at time zone 'utc')::date = d.day::date
        group by d.day order by d.day`,
      params,
    ),
    db.query<{ id: string; clicks: number }>(
      `select target_id as id, count(*)::int as clicks from analytics_events
        where profile_id = $1 and type = 'click' and created_at > ${since} group by target_id order by clicks desc limit 10`,
      params,
    ),
    db.query<{ id: string; interactions: number }>(
      `select target_id as id, count(*)::int as interactions from analytics_events
        where profile_id = $1 and type = 'widget' and created_at > ${since} group by target_id order by interactions desc limit 10`,
      params,
    ),
    db.query<{ host: string; views: number }>(
      `select coalesce(referrer_host, 'Direct / unknown') as host, count(*)::int as views from analytics_events
        where profile_id = $1 and type = 'view' and created_at > ${since} group by 1 order by views desc limit 8`,
      params,
    ),
    db.query<{ device: string; views: number }>(
      `select device, count(*)::int as views from analytics_events
        where profile_id = $1 and type = 'view' and created_at > ${since} group by device order by views desc`,
      params,
    ),
    db.query<{ country: string; views: number }>(
      `select country, count(*)::int as views from analytics_events
        where profile_id = $1 and type = 'view' and country is not null and created_at > ${since} group by country order by views desc limit 10`,
      params,
    ),
    db.one<{ view_count: number }>('select view_count from profiles where id = $1', [profileId]),
  ]);

  const views = totals?.views ?? 0;
  const clicks = totals?.clicks ?? 0;
  return {
    rangeDays: days,
    totals: { views, clicks, ctr: views > 0 ? clicks / views : null, dailyAverage: views / days, allTimeViews: allTime?.view_count ?? 0 },
    series,
    topLinks,
    topWidgets,
    referrers,
    devices,
    countries,
    hasCountryData: countries.length > 0,
  };
}
