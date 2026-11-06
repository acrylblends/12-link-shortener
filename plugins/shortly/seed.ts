/** The workspace a new install starts with: eight links, three domains, referrer totals and five recent click events. */
import type { ClickEvent, Domain, ReferrerStat, ShortLink, ShortlyState } from './domain.ts'
import { stampOf } from './domain.ts'

function distribute(total: number): number[] {
  const weights = Array.from({ length: 30 }, (_, index) => 1 + index * 0.045)
  const sum = weights.reduce((carry, weight) => carry + weight, 0)
  const values = weights.map((weight) => Math.round((weight / sum) * total))
  const difference = total - values.reduce((carry, value) => carry + value, 0)
  values[values.length - 1] = (values[values.length - 1] ?? 0) + difference
  return values
}

interface LinkSeed {
  readonly slug: string
  readonly destinationUrl: string
  readonly title: string
  readonly tags: readonly string[]
  readonly clicks: number
  readonly views: number
  readonly hoursAgo: number
  readonly enabled?: boolean
  readonly expiresAt?: string
}

const LINKS: readonly LinkSeed[] = [
  { slug: 'autumn', destinationUrl: 'https://acme.studio/autumn-collection-2026', title: 'Autumn collection', tags: ['campaign', 'instagram'], clicks: 8421, views: 174_700, hoursAgo: 2 },
  { slug: 'pricing', destinationUrl: 'https://acme.studio/pricing', title: 'Pricing', tags: ['site'], clicks: 6108, views: 126_700, hoursAgo: 26 },
  { slug: 'webinar', destinationUrl: 'https://events.acme.studio/november-webinar', title: 'November webinar', tags: ['events'], clicks: 4920, views: 102_000, hoursAgo: 50 },
  { slug: 'guide', destinationUrl: 'https://acme.studio/resources/brand-guide.pdf', title: 'Brand guide', tags: ['resources'], clicks: 2814, views: 58_400, hoursAgo: 74 },
  { slug: 'partner', destinationUrl: 'https://acme.studio/partners', title: 'Partner programme', tags: ['partners'], clicks: 1203, views: 24_900, hoursAgo: 98 },
  { slug: 'launch', destinationUrl: 'https://acme.studio/launch-week', title: 'Launch week', tags: ['campaign'], clicks: 1900, views: 39_400, hoursAgo: 120 },
  { slug: 'jobs', destinationUrl: 'https://acme.studio/careers', title: 'Careers', tags: ['site'], clicks: 1605, views: 33_300, hoursAgo: 200 },
  { slug: 'newsletter', destinationUrl: 'https://acme.studio/newsletter', title: 'Newsletter', tags: ['email'], clicks: 1520, views: 31_500, hoursAgo: 300, enabled: false },
]

export function seed(now: Date, newId: (kind: string) => string): ShortlyState {
  const at = (hoursAgo: number): string => stampOf(new Date(now.getTime() - hoursAgo * 3_600_000))
  const domains: Domain[] = [
    { id: newId('domain'), hostname: 'go.acme.to', verified: true, default: true },
    { id: newId('domain'), hostname: 'acme.link', verified: true, default: false },
    { id: newId('domain'), hostname: 'short.acme.to', verified: false, default: false },
  ]
  const links: ShortLink[] = LINKS.map((item) => ({
    id: newId('link'),
    slug: item.slug,
    destinationUrl: item.destinationUrl,
    title: item.title,
    tags: [...item.tags],
    createdAt: at(item.hoursAgo),
    ...(item.expiresAt === undefined ? {} : { expiresAt: item.expiresAt }),
    enabled: item.enabled !== false,
    views: item.views,
    clicks: item.clicks,
    daily: distribute(item.clicks),
  }))
  const total = links.reduce((sum, link) => sum + link.clicks, 0)
  const referrers: ReferrerStat[] = [
    { source: 'instagram.com', clicks: Math.round(total * 0.31) },
    { source: 'google.com', clicks: Math.round(total * 0.24) },
    { source: 'direct / none', clicks: Math.round(total * 0.17) },
    { source: 'linkedin.com', clicks: Math.round(total * 0.12) },
    { source: 'other', clicks: total - Math.round(total * 0.31) - Math.round(total * 0.24) - Math.round(total * 0.17) - Math.round(total * 0.12) },
  ]
  const events: ClickEvent[] = [
    { id: newId('click'), linkId: links[0]?.id ?? '', at: at(1), referrer: 'instagram.com', country: 'DE', device: 'mobile' },
    { id: newId('click'), linkId: links[1]?.id ?? '', at: at(3), referrer: 'google.com', country: 'NL', device: 'desktop' },
    { id: newId('click'), linkId: links[2]?.id ?? '', at: at(8), referrer: 'linkedin.com', country: 'GB', device: 'desktop' },
    { id: newId('click'), linkId: links[3]?.id ?? '', at: at(20), referrer: 'direct / none', country: 'FR', device: 'tablet' },
    { id: newId('click'), linkId: links[4]?.id ?? '', at: at(30), referrer: 'google.com', country: 'ES', device: 'mobile' },
  ]
  return { version: 1, links, domains, referrers, events }
}
