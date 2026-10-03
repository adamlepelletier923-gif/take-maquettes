import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = dirname(fileURLToPath(import.meta.url))
const repository = 'TakeAppAIOrg/take-app'
const pageRepository = 'adamlepelletier923-gif/take-maquettes'
const pageUrl = 'https://adamlepelletier923-gif.github.io/take-maquettes/pas-dans-le-build/'

async function command(args, cwd = directory) {
  const process = Bun.spawn(args, { cwd, stdout: 'pipe', stderr: 'pipe' })
  const [stdout, stderr, exit] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ])
  if (exit !== 0) throw new Error(`${args[0]} a échoué : ${stderr.trim()}`)
  return stdout
}

async function github(path) {
  return JSON.parse(await command(['gh', 'api', path]))
}

async function pages(path) {
  const result = []
  for (let page = 1; ; page++) {
    const items = await github(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`)
    if (!Array.isArray(items)) throw new Error('Réponse paginée GitHub inattendue')
    result.push(...items)
    if (items.length < 100) return result
  }
}

async function source(path, sha) {
  const result = await github(`repos/${repository}/contents/${path}?ref=${sha}`)
  if (result.encoding !== 'base64' || typeof result.content !== 'string')
    throw new Error(`Source inaccessible : ${path}`)
  return Buffer.from(result.content, 'base64').toString('utf8')
}

async function checkRuns(sha) {
  const checks = []
  for (let page = 1; ; page++) {
    const result = await github(`repos/${repository}/commits/${sha}/check-runs?filter=latest&per_page=100&page=${page}`)
    if (!Array.isArray(result.check_runs)) throw new Error('Réponse des contrôles GitHub inattendue')
    checks.push(...result.check_runs)
    if (checks.length >= result.total_count) return checks
    if (!result.check_runs.length) throw new Error('Pagination des contrôles incomplète')
  }
}

export function flagDefaults(text) {
  const result = {}
  for (const match of text.matchAll(/^\s*([A-Z][A-Z0-9_]*_ENABLED):\s*envBoolean\.default\((true|false)\)/gm))
    result[match[1]] = match[2] === 'true'
  const declared = [...text.matchAll(/^\s*([A-Z][A-Z0-9_]*_ENABLED):/gm)].map((match) => match[1])
  if (declared.length !== Object.keys(result).length)
    throw new Error('Une déclaration de réglage a changé : relire son interprétation avant de publier')
  return result
}

export function mobileFiles(files) {
  return files.some(({ filename }) => /^(apps\/mobile\/|packages\/api-client\/)/.test(filename))
}

export function escape(text) {
  return String(text ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
}

function evidence(pr) {
  const status = pr.checks.find((check) => check.name === 'verify')
  if (!status) return { label: 'Contrôles non trouvés', state: 'unknown' }
  if (status.status !== 'completed') return { label: 'Contrôles en cours', state: 'pending' }
  if (status.conclusion !== 'success') return { label: 'Contrôles à corriger', state: 'failed' }
  return { label: 'Contrôles réussis', state: 'passed' }
}

export function proposal(pr, known) {
  const check = evidence(pr)
  const unchanged = known?.headSha === pr.headSha
  let reason = known?.exclusionReasonFr
  if (!unchanged || !reason) {
    reason = check.state === 'failed'
      ? 'Les contrôles ont échoué ; le changement n’est pas encore intégré.'
      : check.state === 'pending'
        ? 'Les contrôles sont encore en cours ; le changement n’est pas encore intégré.'
        : 'Le changement n’est pas encore intégré. Son motif de report reste à confirmer.'
  }
  return {
    number: pr.number, url: pr.url, headSha: pr.headSha, isDraft: pr.isDraft,
    scope: known?.scope ?? 'unreviewed',
    userSummaryFr: known?.userSummaryFr ?? 'Une nouvelle proposition pour l’app doit encore être décrite en français.',
    exclusionReasonFr: reason,
    waitingOn: unchanged ? known?.waitingOn ?? [] : [],
    unreviewed: !known || !unchanged,
    group: pr.author === '0xJord4n' ? 'Jordan' : pr.author?.includes('[bot]') ? 'Outil automatique' : 'Équipe',
    check,
  }
}

export function flagState(flag, capabilities, values) {
  const value = flag.capability?.split('.').reduce((object, key) => object?.[key], capabilities)
  const announced = flag.capability == null ? null : value != null && value !== false && value !== ''
  const relevant = flag.workerRoles?.length
    ? Object.entries(values).filter(([path]) => flag.workerRoles.some((role) => path.endsWith(`staging-${role}.jsonc`))).map(([, value]) => value)
    : Object.values(values)
  const configured = relevant.some((value) => value === true)
  if (announced === true) return 'on'
  if (announced === false) return configured ? 'unannounced' : 'off'
  return configured ? 'configured-on' : 'unconfirmed-off'
}

async function collect(catalog) {
  const ref = await github(`repos/${repository}/commits/main`)
  const sha = ref.sha
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error('Référence de version invalide')
  const raw = await pages(`repos/${repository}/pulls?state=open`)
  const prs = []
  for (const item of raw) {
    const files = await pages(`repos/${repository}/pulls/${item.number}/files`)
    const known = catalog.proposals[item.number]
    const sameKnownOutside = known?.scope === 'outside-mobile' && known.headSha === item.head.sha
    if (!mobileFiles(files) && sameKnownOutside) continue
    const relevant = mobileFiles(files) || (known && known.scope !== 'outside-mobile') ||
      files.some(({ filename }) => /^(apps\/api\/|packages\/|\.github\/)/.test(filename))
    if (!relevant) continue
    const runs = await checkRuns(item.head.sha)
    prs.push(proposal({
      number: item.number, url: item.html_url, author: item.user.login,
      headSha: item.head.sha, isDraft: item.draft,
      checks: runs.map(({ name, status, conclusion }) => ({ name, status, conclusion })),
    }, known))
  }
  const envText = await source('apps/api/src/env.ts', sha)
  const defaults = flagDefaults(envText)
  const entries = await github(`repos/${repository}/contents/apps/api?ref=${sha}`)
  const paths = entries.filter(({ name }) => /^wrangler\.staging-.*\.jsonc$/.test(name)).map(({ path }) => path)
  if (!paths.length) throw new Error('Aucun réglage staging trouvé')
  const roles = {}
  for (const path of paths) roles[path] = Bun.JSONC.parse(await source(path, sha)).vars ?? {}
  const config = JSON.parse(await command(['curl', '--fail', '--silent', '--show-error', '--max-time', '15', 'https://api-staging.take.cc/config']))
  if (config.success === false || !config.data?.capabilities)
    throw new Error('Le contrat de configuration a changé : aucun état supposé')
  const capabilities = config.data.capabilities
  const inventory = []
  for (const [name, fallback] of Object.entries(defaults)) {
    const known = catalog.flags[name]
    const values = Object.fromEntries(Object.entries(roles).map(([role, vars]) => {
      const raw = vars[name]
      if (raw != null && raw !== true && raw !== false && raw !== 'true' && raw !== 'false')
        throw new Error(`Valeur de réglage à relire : ${name}`)
      return [role, raw == null ? fallback : raw === true || raw === 'true']
    }))
    const state = flagState(known ?? {}, capabilities, values)
    inventory.push({ flag: name, default: fallback, values, capability: known?.capability ?? null, state: known ? state : 'unknown' })
  }
  const flags = inventory.filter(({ state }) => ['off', 'unannounced', 'unconfirmed-off', 'unknown'].includes(state))
    .map((item) => ({
      ...item, ...catalog.flags[item.flag],
      unreviewed: !catalog.flags[item.flag]?.titleFr,
      titleFr: catalog.flags[item.flag]?.titleFr ?? 'Un réglage doit encore être décrit',
      userEffectFr: catalog.flags[item.flag]?.userEffectFr ?? 'Son effet pour la personne qui utilise Take reste à préciser.',
      reasonFr: catalog.flags[item.flag]?.reasonFr ?? 'Non activé dans les fichiers actuels ; motif non documenté.',
    }))
  const extra = catalog.extraFlags.map((flag) => ({ ...flag,
    state: capabilities[flag.configKey] === true ? 'on' : capabilities[flag.configKey] === false ? 'off' : 'unknown',
  })).filter(({ state }) => state !== 'on')
  const mapped = new Set([...Object.values(catalog.flags).map(({ capability }) => capability), ...catalog.extraFlags.map(({ configKey }) => configKey)])
  for (const [key, value] of Object.entries(capabilities)) {
    if (value === false && !mapped.has(key)) extra.push({ configKey: key, state: 'off', unreviewed: true,
      titleFr: 'Un nouveau réglage public est éteint', userEffectFr: 'Son effet reste à décrire avant le lancement.',
      reasonFr: 'Le serveur l’annonce éteint ; son motif n’est pas encore documenté dans cette page.' })
  }
  return { observedAt: new Date().toISOString(), sourceMainSha: sha,
    totalOpen: raw.length, prs, flags, inventory,
    configCapabilities: Object.fromEntries(Object.entries(capabilities).map(([key, value]) => [key, value != null && value !== false])),
    extra, stagingFiles: paths,
    notes: catalog.notes.filter((note) => !note.capability || capabilities[note.capability] === true),
  }
}

function references(pr) {
  return `<details class="reference"><summary>Détail et référence</summary><small><a href="${escape(pr.url)}">PR ${pr.number}</a> · ${escape(pr.group)} · ${pr.isDraft ? 'Brouillon' : 'Prête à relire'} · ${escape(pr.check.label)} · ${escape(pr.headSha.slice(0, 12))}</small></details>`
}

function prCard(pr) {
  return `<article class="item"><p>${escape(pr.userSummaryFr)}</p><p class="reason">${escape(pr.exclusionReasonFr)}</p>${pr.unreviewed ? '<p class="notice">Mis à jour depuis la dernière relecture : à confirmer avant le lancement.</p>' : ''}${references(pr)}</article>`
}

function flagCard(flag) {
  const label = flag.state === 'unconfirmed-off' ? 'Éteint dans les fichiers ; état réel non observable ici.'
    : flag.state === 'unannounced' ? 'Prévu dans les fichiers, mais non annoncé par le serveur.'
      : flag.state === 'unknown' ? 'État non confirmé.' : 'Non disponible sur le serveur d’essai.'
  return `<article class="item"><p><strong>${escape(flag.titleFr)}</strong> — ${escape(flag.userEffectFr)}</p><p class="reason">${escape(flag.reasonFr)}</p><p class="state">${label}</p><details class="reference"><summary>Détail et sources</summary><small>${escape(flag.flag ?? flag.configKey)}${flag.capability ? ` · capacité ${escape(flag.capability)}` : ''} · <a href="https://api-staging.take.cc/config">État du serveur</a> · <a href="https://github.com/${repository}/blob/main/apps/api/src/env.ts">Réglages</a></small></details></article>`
}

function waitingGroup(owner) {
  if (/appareil|téléphone|client/.test(owner)) return 'Mesure sur appareil'
  if (/Adam/.test(owner)) return 'Adam ou Jordan'
  if (owner === 'Jordan') return 'Jordan'
  if (/chef/.test(owner)) return 'Chef f8'
  if (/accès.*base/.test(owner)) return 'Personne avec accès aux données'
  if (/correctif|Carapuce/.test(owner)) return 'Équipe'
  return 'Responsable à préciser'
}

export function render(data) {
  const normal = data.prs.filter(({ scope }) => !['mobile-tooling', 'mobile-api-already-present'].includes(scope))
  const tooling = data.prs.filter(({ scope }) => scope === 'mobile-tooling')
  const present = data.prs.filter(({ scope }) => scope === 'mobile-api-already-present')
  const visible = [...data.flags.filter(({ state, visibility }) => state !== 'unconfirmed-off' && visibility !== 'technical-only'), ...data.extra]
  const internal = data.flags.filter(({ state, visibility }) => state === 'unconfirmed-off' || visibility === 'technical-only')
  const waiting = new Map()
  for (const pr of data.prs) for (const owner of new Set(pr.waitingOn.map(waitingGroup))) {
    const list = waiting.get(owner) ?? []
    list.push(pr)
    waiting.set(owner, list)
  }
  for (const flag of [...data.flags, ...data.extra]) {
    if (!flag.waitingOn || /Aucun responsable|Aucune attente/.test(flag.waitingOn)) continue
    const owner = waitingGroup(flag.waitingOn)
    const list = waiting.get(owner) ?? []
    list.push({ flag })
    waiting.set(owner, list)
  }
  const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(new Date(data.observedAt))
  const uncertain = data.prs.filter(({ unreviewed }) => unreviewed).length + [...data.flags, ...data.extra].filter(({ unreviewed }) => unreviewed).length
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Ce qui n’est PAS dans le build — Take</title><link rel="stylesheet" href="style.css"></head>
<body><main><header><a class="back" href="../">Take · préparation du lancement</a><p class="eyebrow">À lire avant de lancer</p><h1>Ce qui n’est <em>PAS</em><br>dans le build</h1><p class="intro">Les changements encore ouverts, les fonctions éteintes et les étapes qui attendent quelqu’un.</p><p class="timestamp">Relevé le ${escape(date)} · heure de Séoul</p><p class="notice">Cette liste décrit la version préparée au moment du relevé. Rafraîchis-la juste avant le lancement : une fonction déjà codée peut encore être éteinte sur le serveur.</p>${uncertain ? `<p class="warning">${uncertain} point(s) ont changé ou restent à décrire : la liste doit être relue avant le lancement.</p>` : ''}<nav aria-label="Rubriques"><a href="#propositions">Changements ouverts</a><a href="#reglages">Réglages éteints</a><a href="#attentes">Ce qui attend</a></nav></header>
<section id="propositions"><div class="section-title"><span>01</span><h2>Les changements encore ouverts</h2></div><p class="section-intro">${normal.length} proposition(s) pour l’app restent ouvertes, brouillons compris. Elles ne sont pas encore intégrées à la version préparée.</p>${normal.map(prCard).join('\n')}${tooling.length ? `<details class="group"><summary>Les outils d’essai et de livraison (${tooling.length})</summary><p>Ils ne changent pas les écrans, mais leurs propositions restent ouvertes.</p>${tooling.map(prCard).join('\n')}</details>` : ''}${present.length ? `<details class="group"><summary>Anciennes demandes dont le bénéfice est déjà présent (${present.length})</summary>${present.map(prCard).join('\n')}</details>` : ''}</section>
<section id="reglages"><div class="section-title"><span>02</span><h2>Les réglages éteints sur le serveur d’essai</h2></div><p class="section-intro">L’état annoncé par le serveur passe avant les fichiers de préparation. Quand le motif est inconnu, il est écrit comme tel.</p>${visible.map(flagCard).join('\n')}<details class="group"><summary>À part : réglages techniques et états non confirmés (${internal.length})</summary><p>Chaque ligne précise ce qui est constaté et ce qui vient seulement des fichiers. Un état non confirmé n’est pas présenté comme une absence constatée dans l’app.</p>${internal.map(flagCard).join('\n')}</details></section>
<section id="attentes"><div class="section-title"><span>03</span><h2>Ce qui attend quelqu’un</h2></div>${[...waiting].map(([owner, prs]) => `<article class="item"><h3>${escape(owner)}</h3>${prs.map((pr) => pr.flag ? `<p><strong>${escape(pr.flag.titleFr)}</strong> — ${escape(pr.flag.waitingOn)}.</p>` : `<p>${escape(pr.userSummaryFr)} <span class="reason">${escape(pr.exclusionReasonFr)}</span></p>${references(pr)}`).join('\n')}</article>`).join('\n')}${data.notes.map(({ title, text }) => `<article class="item"><h3>${escape(title)}</h3><p>${escape(text)}</p></article>`).join('\n')}</section>
<footer><details><summary>Sources et rafraîchissement</summary><p><small>Version de référence : ${escape(data.sourceMainSha)}. ${data.totalOpen} propositions ouvertes ont été examinées. ${data.inventory.length} réglages *_ENABLED comparés à ${data.stagingFiles.length} fichiers staging. <a href="snapshot.json">Relevé des états</a> · <a href="README.md">Commande de rafraîchissement</a></small></p><pre><code>bun pas-dans-le-build/refresh.mjs --publish</code></pre></details><p>Un contrôle réussi prouve ce qui a été testé. Les essais sur appareil restent distincts.</p></footer></main></body></html>`
}

async function refresh() {
  const args = process.argv.slice(2)
  if (args.some((arg) => arg !== '--publish')) throw new Error('Usage : bun pas-dans-le-build/refresh.mjs [--publish]')
  const root = resolve(directory, '..')
  if (args.includes('--publish')) {
    const remote = (await command(['git', 'remote', 'get-url', 'origin'], root)).trim()
    if (!remote.includes(`${pageRepository}.git`)) throw new Error('Le dépôt de publication n’est pas take-maquettes')
    const branch = (await command(['git', 'branch', '--show-current'], root)).trim()
    if (branch !== 'main') throw new Error('La publication attend la branche main de take-maquettes')
    if ((await command(['git', 'status', '--porcelain'], root)).trim())
      throw new Error('Le dossier contient des modifications : les enregistrer avant de régénérer')
    await command(['git', 'pull', '--ff-only', 'origin', 'main'], root)
  }
  const catalog = JSON.parse(await readFile(join(directory, 'catalog.json'), 'utf8'))
  let data
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = await collect(catalog)
    const current = await github(`repos/${repository}/commits/main`)
    if (current.sha === candidate.sourceMainSha) { data = candidate; break }
    console.log('La version de référence a changé pendant le relevé ; nouvelle lecture.')
  }
  if (!data) throw new Error('La version change encore : relancer le relevé avant le build')
  await writeFile(join(directory, 'snapshot.json'), `${JSON.stringify(data, null, 2)}\n`)
  await writeFile(join(directory, 'index.html'), render(data))
  if (args.includes('--publish')) {
    await command(['git', 'add', 'pas-dans-le-build/index.html', 'pas-dans-le-build/snapshot.json'], root)
    if ((await command(['git', 'diff', '--cached', '--name-only'], root)).trim()) {
      await command(['git', 'commit', '-m', 'Refresh pre-build omissions report'], root)
      await command(['git', 'push', 'origin', 'main'], root)
    }
  }
  console.log(`${data.prs.length} propositions examinées pour l’app ; ${data.inventory.length} réglages comparés.`)
  console.log(args.includes('--publish') ? `Publication demandée : ${pageUrl}` : `Page régénérée : ${join(directory, 'index.html')}`)
}

if (import.meta.main) await refresh().catch((error) => { console.error(error.message); process.exitCode = 1 })
