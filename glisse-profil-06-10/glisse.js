// Le moteur des maquettes : un téléphone de 402 x 874 pt fait de calques
// découpés dans les vraies captures, déplacés image par image comme le fait
// ProfilePager (un seul en-tête au-dessus des pages, translateY -headerRise).
(function () {
  var TOP = 54, FOLD = 388, TABS = 48, QMAX = 0, W = 402, COMPACT = 44
  var WORDS = ['Takes', 'Questions', 'Jeu']

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }
  function lerp(a, b, k) { return a + (b - a) * k }
  function easeOut(k) { k = clamp(k, 0, 1); return 1 - Math.pow(1 - k, 3) }
  function easeInOut(k) { k = clamp(k, 0, 1); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2 }

  // Un tour : glissé lent, repos, coupe, glissé rapide, repos.
  var SLOW = { start: 600, drag: 1900, reach: .62, settle: 340 }
  var FAST = { start: 600, drag: 170, reach: .38, settle: 270 }
  var REST = 2300
  function passTime(s) { return s.start + s.drag + s.settle + REST }
  var LOOP = passTime(SLOW) + passTime(FAST)

  function gesture(t) {
    var s = SLOW, label = 'Glissé lent'
    if (t >= passTime(SLOW)) { t -= passTime(SLOW); s = FAST; label = 'Glissé rapide' }
    var c = { label: label, sinceStart: t - s.start, sinceRelease: -1, sinceRest: -1, p: 0, finger: null }
    if (t < s.start) { c.phase = 'idle'; c.finger = t > s.start - 350 ? { k: 0, o: 1 } : null; return c }
    t -= s.start
    if (t < s.drag) {
      var k = s === SLOW ? easeInOut(t / s.drag) : t / s.drag
      c.phase = 'drag'; c.p = s.reach * k; c.finger = { k: c.p, o: 1 }; return c
    }
    t -= s.drag
    c.sinceRelease = t
    if (t < s.settle) {
      c.phase = 'settle'; c.p = lerp(s.reach, 1, easeOut(t / s.settle))
      c.finger = { k: s.reach + .1 * t / s.settle, o: 1 - t / s.settle }; return c
    }
    c.phase = 'rest'; c.p = 1; c.sinceRest = t - s.settle; return c
  }

  // Ce que fait chaque version : où est l'en-tête, s'il est plein, où attend Questions.
  var BASE = { rise: FOLD, band: 1, solid: true, qOff: QMAX, push: 0, parallax: 1, perPage: false, compact: 0, fill: false, pull: 0 }
  function mix(o) { var r = {}, k; for (k in BASE) r[k] = BASE[k]; for (k in o) r[k] = o[k]; return r }

  var DIRS = {
    // Aujourd'hui : sharedLift(bar, [388, 64]) et la bande qui s'efface au premier point.
    now: function (c) {
      var rise = lerp(FOLD, QMAX, c.p)
      return mix({ rise: rise, band: clamp(rise - (FOLD - 1), 0, 1), solid: false, qOff: QMAX })
    },
    x: function () { return mix({ qOff: FOLD }) },
    libre: function (c) {
      var pull = c.sinceRest > 600 ? easeInOut((c.sinceRest - 600) / 1000) : 0
      return mix({ qOff: FOLD, pull: pull })
    },
    rideau: function (c) {
      var k = c.sinceRest >= 0 ? easeOut(c.sinceRest / 300) : 0
      return mix({ rise: lerp(FOLD, QMAX, k), qOff: QMAX })
    },
    suit: function (c) { return mix({ rise: lerp(FOLD, QMAX, c.p), qOff: QMAX }) },
    pousse: function (c) { var rise = lerp(FOLD, QMAX, c.p); return mix({ rise: rise, qOff: QMAX, push: FOLD - rise }) },
    parpage: function () { return mix({ perPage: true, qOff: QMAX }) },
    compact: function () { return mix({ qOff: FOLD, compact: COMPACT }) },
    profondeur: function () { return mix({ qOff: FOLD, parallax: .3 }) },
    debut: function (c) {
      var k = c.sinceStart >= 0 ? easeOut(c.sinceStart / 200) : 0
      return mix({ rise: lerp(FOLD, QMAX, k), qOff: QMAX })
    },
    rempli: function () { return mix({ qOff: FOLD, fill: true }) },
  }

  function el(tag, cls, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e }

  function tabsRow(parent) {
    var row = el('div', 'tabs', parent)
    el('div', 'band', row)
    var words = WORDS.map(function (w, i) { var s = el('span', 'w', row); s.textContent = w; s.style.left = (16 + 123.3 * i) + 'px'; return s })
    var ul = el('i', 'ul', row)
    return { row: row, band: row.firstChild, words: words, ul: ul }
  }

  function headerBlock(parent) {
    var h = el('div', 'hdr', parent)
    var head = el('div', 'head', h)
    var t = tabsRow(h)
    return { root: h, head: head, tabs: t }
  }

  function build(phone) {
    phone.innerHTML = ''
    var pages = el('div', 'pages', phone)
    var takes = el('div', 'pg', pages), q = el('div', 'pg', pages)
    var takesRows = el('div', 'rows takes', takes)
    var qRows = el('div', 'rows questions', q)
    var qFill = el('div', 'fill', q)
    qFill.innerHTML = '<div class="ask">Demande à Ava…<b>Anonyme</b></div><div class="sug">Questions qu’on pose à tes amis</div>' +
      ['Ton meilleur concert de l’année ?', 'Le pire job que tu aies fait ?', 'Une ville où tu pourrais vivre ?'].map(function (s) { return '<div class="sq">' + s + '<em>Demander</em></div>' }).join('')
    var clip = el('div', 'clip', phone)
    var shared = headerBlock(clip)
    var takesHdr = headerBlock(el('div', 'clip', takes)), qHdr = headerBlock(el('div', 'clip', q))
    var compact = el('div', 'compact', phone)
    compact.innerHTML = '<span class="av"></span><span><b>Ava Martin</b><small>18 Takes</small></span>'
    el('div', 'status', phone)
    el('div', 'bar', phone)
    var finger = el('div', 'finger', phone)
    return { phone: phone, takes: takes, q: q, takesRows: takesRows, qRows: qRows, qFill: qFill, shared: shared, takesHdr: takesHdr, qHdr: qHdr, compact: compact, finger: finger }
  }

  function placeTabs(t, p) {
    var a = Math.floor(clamp(p, 0, 1.999)), k = clamp(p, 0, 2) - a
    var x0 = 16 + 123.3 * a + 61.6, x1 = 16 + 123.3 * Math.min(2, a + 1) + 61.6
    t.ul.style.transform = 'translateX(' + (lerp(x0, x1, k) - 22) + 'px)'
    t.words.forEach(function (w, i) { var on = 1 - clamp(Math.abs(p - i), 0, 1); w.style.color = on > .5 ? 'var(--t-ink)' : 'var(--t-soft)' })
  }

  function placeHeader(h, rise, s, p) {
    h.root.style.transform = 'translateY(' + (-rise + s.compact) + 'px)'
    h.head.className = 'head ' + (s.solid ? 'solid' : 'nu')
    h.tabs.band.style.opacity = s.band
    placeTabs(h.tabs, p)
  }

  function draw(v, s, c) {
    var pull = s.pull * (FOLD) // le doigt tire l'en-tête jusqu'en haut du profil
    var rise = s.rise - pull
    v.takes.style.transform = 'translateX(' + (-c.p * W * s.parallax) + 'px)'
    v.q.style.transform = 'translateX(' + ((1 - c.p) * W) + 'px)'
    v.q.style.boxShadow = s.parallax < 1 ? '-12px 0 24px rgba(0,0,0,' + (.12 * (1 - c.p)) + ')' : 'none'
    v.takesRows.style.top = (TOP + TABS + s.compact + s.push) + 'px'
    var qTop = TOP + FOLD + TABS - s.qOff + s.compact + pull
    v.qRows.style.top = qTop + 'px'
    v.qFill.style.top = (qTop + 300) + 'px'
    v.qFill.style.display = s.fill ? 'block' : 'none'
    v.shared.root.style.display = s.perPage ? 'none' : 'block'
    v.takesHdr.root.parentNode.style.display = s.perPage ? 'block' : 'none'
    v.qHdr.root.parentNode.style.display = s.perPage ? 'block' : 'none'
    if (s.perPage) {
      placeHeader(v.takesHdr, FOLD, s, 0)
      placeHeader(v.qHdr, QMAX, s, 1)
    } else placeHeader(v.shared, rise, s, c.p)
    v.compact.style.display = s.compact ? 'flex' : 'none'
    if (c.finger) {
      v.finger.style.opacity = c.finger.o
      v.finger.style.transform = 'translate(' + (330 - c.finger.k * 300) + 'px,' + 560 + 'px)'
    } else if (s.pull > 0 && s.pull < 1) {
      v.finger.style.opacity = 1
      v.finger.style.transform = 'translate(200px,' + (300 + pull) + 'px)'
    } else v.finger.style.opacity = 0
  }

  var phones = []
  function setup() {
    document.querySelectorAll('.phone[data-dir]').forEach(function (phone) {
      var v = build(phone)
      v.dir = phone.dataset.dir
      v.visible = false
      v.offset = 0
      phones.push(v)
      var card = phone.closest('figure')
      if (card) card.querySelectorAll('[data-show]').forEach(function (b) {
        b.addEventListener('click', function () {
          v.dir = b.dataset.show === 'now' ? 'now' : phone.dataset.dir
          card.querySelectorAll('[data-show]').forEach(function (x) { x.classList.toggle('on', x === b) })
          v.offset = performance.now()
        })
      })
    })
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { phones.forEach(function (v) { if (v.phone === e.target) v.visible = e.isIntersecting }) })
      }, { rootMargin: '200px' })
      phones.forEach(function (v) { io.observe(v.phone) })
    } else phones.forEach(function (v) { v.visible = true })
    var m = /[?&]t=(\d+)/.exec(location.search)
    if (m) { window.glisseFreeze(+m[1]); return }
    requestAnimationFrame(tick)
  }

  function tick(now) {
    phones.forEach(function (v) {
      if (!v.visible) return
      var c = gesture((now - v.offset) % LOOP)
      draw(v, DIRS[v.dir](c), c)
      var lab = v.phone.closest('figure') && v.phone.closest('figure').querySelector('.now-label')
      if (lab && lab.textContent !== c.label) lab.textContent = c.label
    })
    requestAnimationFrame(tick)
  }

  // Pour les captures de contrôle : ?t=<ms> fige chaque téléphone à cet instant.
  window.glisseFreeze = function (ms) {
    phones.forEach(function (v) { var c = gesture(ms % LOOP); draw(v, DIRS[v.dir](c), c) })
  }

  function fit() {
    var w = Math.min(402, document.documentElement.clientWidth - 32)
    document.documentElement.style.setProperty('--k', (w / 402).toFixed(4))
  }
  window.addEventListener('resize', fit)
  fit()
  document.addEventListener('DOMContentLoaded', setup)
})()
