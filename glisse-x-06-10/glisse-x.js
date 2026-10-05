// Le moteur des 5 maquettes « façon X » : des calques découpés dans les vraies
// captures, déplacés image par image. Profil : un seul en-tête au-dessus des pages
// (ProfilePager). Accueil : la barre « Takes Amis À proximité » au-dessus des fils.
(function () {
  var TOP = 54, FOLD = 388, TABS = 48, W = 402, BAR = 48
  var WORDS = ['Takes', 'Questions', 'Jeu']

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }
  function lerp(a, b, k) { return a + (b - a) * k }
  function easeOut(k) { k = clamp(k, 0, 1); return 1 - Math.pow(1 - k, 3) }
  function easeInOut(k) { k = clamp(k, 0, 1); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2 }

  // Glissé lent au doigt, puis le glissé de la vidéo de X : 33 % en 500 ms, puis lâché.
  var SLOW = { start: 700, drag: 2000, reach: .62, settle: 340 }
  var FAST = { start: 700, drag: 500, reach: .33, settle: 180 }
  var REST = 1800
  // temps depuis le début du glissé où p atteint 0,5
  function halfTime(s, ease) {
    for (var t = 0; t <= s.drag; t += 2) { if (s.reach * ease(t / s.drag) >= .5) return t }
    for (var u = 0; u <= s.settle; u += 2) { if (lerp(s.reach, 1, easeOut(u / s.settle)) >= .5) return s.drag + u }
    return s.drag
  }
  var halfSlow = halfTime(SLOW, easeInOut), halfFast = halfTime(FAST, function (k) { return k })
  function passTime(s) { return s.start + s.drag + s.settle + REST }
  var LOOP = passTime(SLOW) + passTime(FAST)

  function gesture(t) {
    var s = SLOW, label = 'Glissé lent'
    if (t >= passTime(SLOW)) { t -= passTime(SLOW); s = FAST; label = 'Glissé au rythme de X' }
    var c = { label: label, sinceStart: t - s.start, sinceRelease: -1, sinceRest: -1, p: 0, finger: null }
    if (t < s.start) { c.finger = t > s.start - 350 ? { k: 0, o: 1 } : null; return c }
    t -= s.start
    // l'instant où les pages passent la moitié du chemin (pour « à mi-chemin »)
    var half = s === SLOW ? halfSlow : halfFast
    if (t >= half) c.halfAt = half
    if (t < s.drag) {
      var k = s === SLOW ? easeInOut(t / s.drag) : t / s.drag
      c.p = s.reach * k; c.finger = { k: c.p, o: 1 }; return c
    }
    t -= s.drag
    c.sinceRelease = t
    if (t < s.settle) {
      c.p = lerp(s.reach, 1, easeOut(t / s.settle))
      c.finger = { k: s.reach + .1 * t / s.settle, o: 1 - t / s.settle }; return c
    }
    c.p = 1; c.sinceRest = t - s.settle; return c
  }

  // k : où en est la descente du haut, de 0 (caché ou replié) à 1 (posé).
  var DIRS = {
    debut: function (c) { return { k: c.sinceStart >= 0 ? easeOut(c.sinceStart / 175) : 0 } },
    doigt: function (c) { return { k: c.p } },
    lacher: function (c) { return { k: c.sinceRelease >= 0 ? easeOut(c.sinceRelease / 250) : 0 } },
    lent: function (c) { return { k: c.sinceStart >= 0 ? easeOut(c.sinceStart / 350) : 0 } },
    milieu: function (c) {
      if (c.halfAt === undefined) return { k: 0 }
      return { k: easeOut((c.sinceStart - c.halfAt) / 175) }
    },
  }

  function el(tag, cls, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e }

  function buildProfile(phone) {
    var pages = el('div', 'pages', phone)
    var takes = el('div', 'pg', pages), q = el('div', 'pg', pages)
    var takesRows = el('div', 'rows takes', takes)
    var qRows = el('div', 'rows questions', q)
    var clip = el('div', 'clip', phone)
    var hdr = el('div', 'hdr', clip)
    var head = el('div', 'head', hdr)
    var row = el('div', 'tabs', hdr)
    var band = el('div', 'band', row)
    var words = WORDS.map(function (w, i) { var s = el('span', 'w', row); s.textContent = w; s.style.left = (16 + 123.3 * i) + 'px'; return s })
    var ul = el('i', 'ul', row)
    el('div', 'status', phone)
    el('div', 'bar', phone)
    var finger = el('div', 'finger', phone)
    return { takes: takes, q: q, takesRows: takesRows, qRows: qRows, hdr: hdr, head: head, band: band, words: words, ul: ul, finger: finger }
  }

  function buildHome(phone) {
    var pages = el('div', 'pages', phone)
    var takes = el('div', 'pg', pages), amis = el('div', 'pg', pages)
    var takesRows = el('div', 'rows h-takes', takes)
    var amisRows = el('div', 'rows h-amis', amis)
    var bar = el('div', 'hbar', phone)
    el('div', 'status h', phone)
    el('div', 'dock', phone)
    var finger = el('div', 'finger', phone)
    return { takes: takes, amis: amis, takesRows: takesRows, amisRows: amisRows, hbar: bar, finger: finger }
  }

  function placeFinger(v, c) {
    if (c.finger) {
      v.finger.style.opacity = c.finger.o
      v.finger.style.transform = 'translate(' + (330 - c.finger.k * 300) + 'px,560px)'
    } else v.finger.style.opacity = 0
  }

  function drawProfile(v, c, dir) {
    var rise, band = 1, solid = true, push = 0
    if (dir === 'now') {
      // Aujourd'hui : sharedLift(bar, [388, 0]), sans fond, la bande s'efface au premier point.
      rise = lerp(FOLD, 0, c.p); band = clamp(rise - (FOLD - 1), 0, 1); solid = false
    } else {
      var s = DIRS[dir](c)
      rise = FOLD * (1 - s.k)
      if (s.push) push = FOLD - rise
    }
    v.takes.style.transform = 'translateX(' + (-c.p * W) + 'px)'
    v.q.style.transform = 'translateX(' + ((1 - c.p) * W) + 'px)'
    v.takesRows.style.top = (TOP + TABS + push) + 'px'
    v.qRows.style.top = (TOP + FOLD + TABS) + 'px'
    v.hdr.style.transform = 'translateY(' + (-rise) + 'px)'
    v.head.className = 'head ' + (solid ? 'solid' : 'nu')
    v.band.style.opacity = band
    var x = 16 + 61.6 + 123.3 * clamp(c.p, 0, 1)
    v.ul.style.transform = 'translateX(' + (x - 22) + 'px)'
    v.words.forEach(function (w, i) { w.style.color = Math.abs(c.p - i) < .5 ? 'var(--t-ink)' : 'var(--t-soft)' })
    placeFinger(v, c)
  }

  function drawHome(v, c, dir) {
    var y = -BAR, o = 1, push = 0
    if (dir === 'now') {
      // Aujourd'hui : cachée pendant le glissé, puis showChromeOf (opacité, 220 ms, 10 pt).
      var f = c.sinceRelease >= 150 ? easeOut((c.sinceRelease - 150) / 220) : 0
      o = f; y = f > 0 ? -10 * (1 - f) : -BAR
    } else {
      var s = DIRS[dir](c)
      y = -BAR * (1 - s.k)
      if (s.push) push = BAR * s.k
    }
    v.takes.style.transform = 'translateX(' + (-c.p * W) + 'px)'
    v.amis.style.transform = 'translateX(' + ((1 - c.p) * W) + 'px)'
    v.takesRows.style.top = (TOP + push) + 'px'
    v.hbar.style.transform = 'translateY(' + y + 'px)'
    v.hbar.style.opacity = o
    placeFinger(v, c)
  }

  var phones = []
  function setup() {
    document.querySelectorAll('.phone[data-dir]').forEach(function (phone) {
      var home = phone.dataset.scene === 'accueil'
      var v = home ? buildHome(phone) : buildProfile(phone)
      v.home = home; v.phone = phone; v.base = phone.dataset.dir; v.dir = phone.dataset.dir; v.visible = false; v.offset = 0
      phones.push(v)
    })
    document.querySelectorAll('figure').forEach(function (card) {
      card.querySelectorAll('[data-show]').forEach(function (b) {
        b.addEventListener('click', function () {
          card.querySelectorAll('[data-show]').forEach(function (x) { x.classList.toggle('on', x === b) })
          phones.forEach(function (v) {
            if (!card.contains(v.phone)) return
            v.dir = b.dataset.show === 'now' ? 'now' : v.base
            v.offset = performance.now()
          })
        })
      })
    })
    var m = /[?&]t=(\d+)/.exec(location.search)
    if (m) { window.glisseFreeze(+m[1]); return }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { phones.forEach(function (v) { if (v.phone === e.target) v.visible = e.isIntersecting }) })
      }, { rootMargin: '200px' })
      phones.forEach(function (v) { io.observe(v.phone) })
    } else phones.forEach(function (v) { v.visible = true })
    requestAnimationFrame(tick)
  }

  function draw(v, c) { (v.home ? drawHome : drawProfile)(v, c, v.dir) }

  function tick(now) {
    phones.forEach(function (v) {
      if (!v.visible) return
      var c = gesture((now - v.offset) % LOOP)
      draw(v, c)
      var lab = v.phone.closest('.duo') && v.phone.closest('.duo').querySelector('.now-label')
      if (lab && lab.textContent !== c.label) lab.textContent = c.label
    })
    requestAnimationFrame(tick)
  }

  window.glisseFreeze = function (ms) { phones.forEach(function (v) { draw(v, gesture(ms % LOOP)) }) }
  // Les instants du glissé rapide, pour la comparaison avec X : début du glissé à FAST.start.
  window.glisseFastStart = passTime(SLOW) + FAST.start

  function fit() {
    var w = Math.min(402, document.documentElement.clientWidth - 32)
    document.documentElement.style.setProperty('--k', (w / 402).toFixed(4))
  }
  window.addEventListener('resize', fit)
  fit()
  document.addEventListener('DOMContentLoaded', setup)
})()
