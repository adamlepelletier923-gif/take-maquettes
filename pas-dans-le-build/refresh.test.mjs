import { expect, test } from 'bun:test'
import { escape, flagDefaults, flagState, mobileFiles, proposal, render } from './refresh.mjs'

test('runtime object capabilities and nested capabilities are active', () => {
  expect(flagState({ capability: 'videoMedia' }, { videoMedia: { maxBytes: 100 } }, {})).toBe('on')
  expect(flagState({ capability: 'socialSignIn.apple' }, { socialSignIn: { apple: true } }, {})).toBe('on')
  expect(flagState({ capability: 'tipsEnabled' }, { tipsEnabled: false }, {})).toBe('off')
})

test('configuration alone cannot prove an internal runtime setting', () => {
  expect(flagState({ capability: null }, {}, { api: false })).toBe('unconfirmed-off')
  expect(flagState({ capability: 'pollSearch' }, {}, { api: true })).toBe('unannounced')
})

test('the relevant worker determines configured state', () => {
  const values = { 'apps/api/wrangler.staging-api.jsonc': false, 'apps/api/wrangler.staging-jobs.jsonc': true }
  expect(flagState({ capability: 'feature', workerRoles: ['api'] }, {}, values)).toBe('off')
})

test('a new head discards the old blocking reason and old waiting person', () => {
  const known = { headSha: 'old', scope: 'mobile', userSummaryFr: 'Partage une photo.', exclusionReasonFr: 'Attend Apple.', waitingOn: ['Apple'] }
  const result = proposal({ number: 1, headSha: 'new', checks: [{ name: 'verify', status: 'completed', conclusion: 'success' }] }, known)
  expect(result.exclusionReasonFr).not.toContain('Apple')
  expect(result.waitingOn).toEqual([])
  expect(result.unreviewed).toBe(true)
})

test('draft proposals and incomplete descriptions remain visible', () => {
  const result = proposal({ number: 1, isDraft: true, headSha: 'new', checks: [] })
  expect(result.isDraft).toBe(true)
  expect(result.unreviewed).toBe(true)
  expect(result.userSummaryFr).toContain('décrite')
  expect(mobileFiles([{ filename: 'apps/mobile/src/example.tsx' }])).toBe(true)
})

test('unrecognized default syntax stops generation', () => {
  expect(flagDefaults(' FEATURE_ENABLED: envBoolean.default(false),')).toEqual({ FEATURE_ENABLED: false })
  expect(() => flagDefaults(' FEATURE_ENABLED: someNewParser(false),')).toThrow('déclaration')
})

test('HTML escapes content and keeps proposal numbers inside small references', () => {
  const pr = { number: 3617, url: 'https://github.com/example/pull/3617', headSha: 'a'.repeat(40), scope: 'mobile',
    userSummaryFr: '<script>unsafe</script>', exclusionReasonFr: 'Attend l’accord.', waitingOn: [],
    group: 'Équipe', check: { label: 'Contrôles réussis' }, unreviewed: false }
  const html = render({ prs: [pr], flags: [], extra: [], notes: [], observedAt: '2026-10-03T08:00:00Z',
    sourceMainSha: 'a'.repeat(40), totalOpen: 1, inventory: [], stagingFiles: [] })
  expect(html).toContain('&lt;script&gt;unsafe&lt;/script&gt;')
  expect(html).not.toContain('<script>unsafe')
  expect(html.match(/<small><a[^>]+>PR 3617<\/a>/)).not.toBeNull()
  expect(escape('"&<>')).toBe('&quot;&amp;&lt;&gt;')
})
