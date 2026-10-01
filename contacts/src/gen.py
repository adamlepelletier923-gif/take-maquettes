"""Écrit artboards.html : les écrans des maquettes « contacts et invitation ».

Chaque écran est un <article class="ab"> de 402 × 874 pt, aux cotes de l'app
(jetons de design-tokens.ts, AppButton, EmptyState, FriendGrid, gabarit de
l'onboarding). Les visages sont de vrais avatars découpés dans une capture du
build 185 (185/img/r10-5.jpg). shoot.mjs les rend ensuite en 2×, en clair et en
sombre.
"""

import re
from pathlib import Path

HERE = Path(__file__).parent
ICONS = Path('/Users/adamjld/orca/workspaces/Take/profil-planete-brume/node_modules/@phosphor-icons/core/assets/regular')


def icon(name: str, size: int, cls: str = '') -> str:
    svg = (ICONS / f'{name}.svg').read_text()
    svg = re.sub(r'<svg ', f'<svg class="i {cls}" width="{size}" height="{size}" ', svg, count=1)
    return svg


def av(name: str, size: int, ring: bool = False) -> str:
    style = f'width:{size}px;height:{size}px'
    return f'<img class="av{" ring" if ring else ""}" src="av/{name}.png" style="{style}" alt="">'


def initials(text: str, size: int = 44) -> str:
    return f'<span class="ini" style="width:{size}px;height:{size}px">{text}</span>'


STATUS = (
    '<div class="sb"><span class="time">16:23</span><span class="island"></span>'
    '<span class="sbr"><svg width="18" height="13" viewBox="0 0 18 13"><path fill="currentColor" d="M9 2.6c2.4 0 4.6.9 6.3 2.5l1.3-1.3A10.7 10.7 0 0 0 9 .8 10.7 10.7 0 0 0 1.4 3.8l1.3 1.3A8.9 8.9 0 0 1 9 2.6Zm0 3.6c1.5 0 2.9.6 4 1.6l1.3-1.3A7.3 7.3 0 0 0 9 4.4c-2 0-3.9.8-5.3 2.1l1.3 1.3c1.1-1 2.5-1.6 4-1.6Zm0 3.6c.6 0 1.2.2 1.6.6L9 12 7.4 10.4c.4-.4 1-.6 1.6-.6Z"/></svg>'
    '<span class="bat"><i></i></span></span></div>'
)
HOME = '<div class="home"></div>'


def dots(total: int, on: int) -> str:
    return '<div class="dots">' + ''.join(
        f'<i class="dot{" on" if n == on else ""}"></i>' for n in range(total)
    ) + '</div>'


def screen(sid: str, body: str, extra_class: str = '') -> str:
    return f'<article class="ab {extra_class}" id="{sid}">{STATUS}{body}{HOME}</article>'


def ob(body: str, total: int = 4, on: int = 1) -> str:
    """Le gabarit des étapes de l'onboarding (onboarding.tsx : px-8, points, contenu, bouton)."""
    return f'<div class="ob">{dots(total, on)}{body}</div>'


def later(label: str = 'Plus tard') -> str:
    return f'<div class="later">{label}</div>'


def btn(label: str, kind: str = 'primary', ico: str = '', size: str = '') -> str:
    return f'<div class="btn {kind} {size}">{ico}{label}</div>'


FRIENDS = [
    ('maya', 'Maya Patel', '@maya_patel'),
    ('leo', 'Léo Martin', '@leo_martin'),
    ('sofia', 'Sofia Rossi', '@sofia_rossi'),
]
INVITE = [('CD', 'Camille Durand'), ('HM', 'Hugo Moreau'), ('LB', 'Lina Benali'), ('P', 'Papa')]


def friend_row(slug: str, name: str, handle: str, action: str) -> str:
    return (
        f'<div class="row">{av(slug, 44)}<div class="rt"><b>{name}</b><span>{handle}</span></div>'
        f'{action}</div>'
    )


def invite_row(ini: str, name: str, action: str, note: str = 'Dans tes contacts') -> str:
    return (
        f'<div class="row">{initials(ini)}<div class="rt"><b>{name}</b><span>{note}</span></div>'
        f'{action}</div>'
    )


# ─── Écran 1 : à la création du compte ───────────────────────────────────────

S1 = []

S1.append(screen('e1-0', ob(
    '<div class="title mb16">Comment tu t’appelles ?</div>'
    '<div class="field"><span class="flabel">Prénom</span><span class="fval">Gon<i class="caret"></i></span></div>'
    '<div class="grow"></div>' + btn('C’est moi'),
    total=3, on=0,
)))

S1.append(screen('e1-1', ob(
    '<div class="center grow">'
    f'<div class="gcircle">{icon("address-book", 40)}</div>'
    '<div class="title tc">Retrouve tes amis</div>'
    '<div class="sub tc w300">Take regarde qui, dans tes contacts, est déjà là. Tu choisis ensuite qui ajouter.</div>'
    '</div>' + btn('Autoriser les contacts') + later()
)))

S1.append(screen('e1-2', ob(
    '<div class="center grow">'
    '<div class="stack">' + ''.join(av(n, 56, ring=True) for n in ['maya', 'ava', 'emma', 'sofia', 'leo']) + '</div>'
    '<div class="title tc">Tes amis sont peut-être déjà sur Take</div>'
    '<div class="reasons">'
    f'<div class="reason">{icon("magnifying-glass", 20)}<span>On cherche seulement qui a déjà Take.</span></div>'
    f'<div class="reason">{icon("lock", 20)}<span>On ne garde pas ton carnet d’adresses.</span></div>'
    f'<div class="reason">{icon("gear", 20)}<span>Tu peux changer d’avis dans Réglages.</span></div>'
    '</div></div>' + btn('Autoriser les contacts') + later()
)))

S1.append(screen('e1-3', ob(
    '<div class="title">Qui est déjà là ?</div>'
    '<div class="sub mt8">Autorise tes contacts pour voir lesquels de tes amis ont Take.</div>'
    '<div class="peek">'
    '<div class="label">Déjà sur Take</div>'
    + ''.join(
        f'<div class="row blur">{av(n, 44)}<div class="rt"><b>{nm}</b><span>{h}</span></div>{btn("Ajouter", "primary", size="compact")}</div>'
        for n, nm, h in FRIENDS
    )
    + f'<div class="peeklock">{icon("lock", 22)}<span>Caché jusqu’à ton accord</span></div>'
    '</div><div class="grow"></div>' + btn('Voir mes amis') + later()
)))

S1.append(screen('e1-4', ob(
    '<div class="title">Retrouve tes amis</div>'
    '<div class="sub mt8">iOS va te demander ce que tu partages. Les deux marchent.</div>'
    '<div class="opts">'
    f'<div class="opt on"><div class="opth"><b>Tous mes contacts</b><span class="pill">Conseillé</span></div><span>On te montre tous tes amis déjà sur Take.</span></div>'
    f'<div class="opt"><div class="opth"><b>Seulement certains</b></div><span>Tu choisis les contacts un par un dans iOS.</span></div>'
    '</div><div class="grow"></div>' + btn('Continuer') + later()
)))

S1.append(screen('e1-5',
    '<div class="ob dim">' + dots(4, 0) +
    '<div class="title mb16">Comment tu t’appelles ?</div>'
    '<div class="field"><span class="flabel">Prénom</span><span class="fval">Gon</span></div></div>'
    '<div class="scrim"></div>'
    '<div class="sheet"><i class="grab"></i>'
    f'<div class="center"><div class="gcircle sm">{icon("users-three", 32)}</div>'
    '<div class="stitle tc">Une dernière chose</div>'
    '<div class="sub tc w300">Autorise tes contacts pour retrouver tout de suite tes amis sur Take.</div></div>'
    + btn('Autoriser les contacts') + later() + '</div>'
))

S1.append(screen('e1-6', ob(
    '<div class="center grow">'
    f'<div class="big">{av("leo", 96)}</div>'
    '<div class="title tc">Léo t’attend sur Take</div>'
    '<div class="sub tc w300">C’est lui qui t’a invité. Ajoute-le, et regarde qui d’autre est déjà là.</div>'
    '</div>' + btn('Ajouter Léo et voir mes contacts') + later()
)))

S1.append(screen('e1-a',
    '<div class="ob dim">' + dots(4, 1) +
    '<div class="center grow">'
    f'<div class="gcircle">{icon("address-book", 40)}</div>'
    '<div class="title tc">Retrouve tes amis</div></div></div>'
    '<div class="scrim"></div>'
    '<div class="alert"><b>« Take » souhaite accéder à vos contacts</b>'
    '<span>Take s’en sert pour te montrer qui, parmi tes contacts, est déjà sur l’app.</span>'
    '<div class="abtns"><i>Ne pas autoriser</i><i class="bold">Continuer</i></div></div>'
))

S1.append(screen('e1-b',
    '<div class="hdr"><span class="back">' + icon('caret-left', 20) + '</span><b>Amis</b></div>'
    '<div class="pad">'
    f'<div class="search">{icon("magnifying-glass", 18)}<span>Rechercher</span></div>'
    '<div class="nudge">'
    f'<div class="nudgei">{icon("address-book", 22)}</div>'
    '<div class="rt"><b>Retrouve tes amis</b><span>Autorise les contacts dans Réglages.</span></div>'
    + btn('Réglages', 'primary', size='compact') + '</div>'
    + ''.join(friend_row(n, nm, h, f'<span class="more">{icon("dots-three", 20)}</span>') for n, nm, h in FRIENDS[:2])
    + '</div>'
))

# ─── Écran 2 : après le premier vote ─────────────────────────────────────────

S2 = []

S2.append(screen('e2-0', ob(
    '<div class="center grow">'
    f'<div class="gcircle">{icon("users-three", 40)}</div>'
    '<div class="title tc">Invite tes proches</div>'
    '<div class="sub tc w300">Take, c’est mieux avec eux. Envoie-leur un lien pour qu’ils te rejoignent.</div>'
    '</div>' + btn('Inviter mes proches', ico=icon('paper-plane-tilt', 18)) + later(),
    total=3, on=2,
)))

S2.append(screen('e2-1', ob(
    '<div class="title">Tes amis sur Take</div>'
    '<div class="secth"><span class="label">Déjà sur Take · 3</span><span class="link">Tout ajouter</span></div>'
    + ''.join(friend_row(n, nm, h, btn('Ajouter', 'primary', size='compact')) for n, nm, h in FRIENDS)
    + '<div class="secth"><span class="label">À inviter</span></div>'
    + ''.join(invite_row(i, nm, btn('Inviter', 'muted', size='compact')) for i, nm in INVITE[:3])
    + '<div class="grow"></div>' + btn('Continuer') + later(),
    total=4, on=3,
)))

S2.append(screen('e2-2', ob(
    '<div class="title">3 amis sont déjà sur Take</div>'
    '<div class="sub mt8">Ils sont cochés. Touche un visage pour le retirer.</div>'
    '<div class="grid">'
    + ''.join(
        f'<div class="cell"><span class="face sel">{av(n, 48)}<i class="chk">{icon("check", 12)}</i></span><span class="cn">{nm.split()[0]}</span></div>'
        for n, nm, _ in FRIENDS
    )
    + '</div><div class="grow"></div>'
    + btn('Ajouter les 3')
    + f'<div class="linkrow">{icon("link", 18)}<span>Inviter d’autres amis par un lien</span></div>',
    total=4, on=3,
)))

S2.append(screen('e2-3', ob(
    '<div class="counter">1 sur 3</div>'
    '<div class="card1">'
    f'{av("leo", 96)}'
    '<div class="title tc">Léo est sur Take</div>'
    '<div class="sub tc">Dans tes contacts : Léo M.</div>'
    '<div class="pair">' + btn('Passer', 'muted') + btn('Ajouter', 'primary') + '</div>'
    '</div><div class="ghostcard"></div><div class="grow"></div>' + later('Passer tout'),
    total=4, on=3,
)))

S2.append(screen('e2-4', ob(
    '<div class="title">Demande-leur leur avis</div>'
    '<div class="sub mt8">Envoie ton premier take à tes contacts : ils votent, puis te rejoignent.</div>'
    '<div class="take">'
    '<div class="tq">Un dimanche lent, c’est le meilleur dimanche ?</div>'
    '<div class="bar on"><span>Oui</span><b>68 %</b><i style="width:68%"></i></div>'
    '<div class="bar"><span>Non</span><b>32 %</b><i style="width:32%"></i></div>'
    '<div class="tmeta">Ton vote : Oui</div>'
    '</div>'
    '<div class="chips">' + ''.join(f'<span class="chip">{initials(i, 22)}{nm.split()[0]}</span>' for i, nm in INVITE[:3]) + '<span class="chip add">+</span></div>'
    '<div class="grow"></div>' + btn('Envoyer à 3 contacts', ico=icon('paper-plane-tilt', 18)) + later(),
    total=4, on=3,
)))

S2.append(screen('e2-5',
    '<div class="bgtake dim"><div class="cat">Culture</div>'
    f'<div class="byline">{av("maya", 32)}<b>Maya Patel</b><span>· il y a 2 h</span></div>'
    '<div class="bq">Un dimanche lent, c’est le meilleur dimanche ?</div>'
    '<div class="bar on wide"><span>Oui</span><b>68 %</b><i style="width:68%"></i></div>'
    '<div class="bar wide"><span>Non</span><b>32 %</b><i style="width:32%"></i></div></div>'
    '<div class="scrim light"></div>'
    '<div class="sheet"><i class="grab"></i><div class="stitle">3 amis sont déjà là</div>'
    + ''.join(friend_row(n, nm, h, btn('Ajouter', 'primary', size='compact')) for n, nm, h in FRIENDS)
    + btn('Tout ajouter') + later('Inviter d’autres amis') + '</div>'
))

S2.append(screen('e2-6', ob(
    '<div class="title">Invite par message</div>'
    '<div class="sub mt8">Choisis qui reçoit ton invitation.</div>'
    '<div class="bubble">Rejoins-moi sur Take, on vote sur tout et n’importe quoi 😄 take.cc/i/gon</div>'
    + ''.join(
        invite_row(i, nm, f'<span class="tick{" on" if k < 2 else ""}">{icon("check", 14) if k < 2 else ""}</span>')
        for k, (i, nm) in enumerate(INVITE)
    )
    + '<div class="grow"></div>' + btn('Envoyer à 2 contacts', ico=icon('chat-circle', 18)) + later(),
    total=4, on=3,
)))

S2.append(screen('e2-a', ob(
    '<div class="title">Invite tes proches</div>'
    '<div class="center grow">'
    f'<div class="ecircle">{icon("address-book", 28)}</div>'
    '<div class="sub tc w300">Autorise les contacts pour voir qui est déjà sur Take.</div>'
    + btn('Autoriser dans Réglages', 'muted', size='inline') +
    '</div>' + btn('Partager le lien d’invitation', ico=icon('link', 18)) + later(),
    total=4, on=3,
)))

S2.append(screen('e2-b', ob(
    '<div class="title">Invite tes proches</div>'
    '<div class="center grow">'
    f'<div class="ecircle">{icon("users-three", 28)}</div>'
    '<div class="sub tc w300">Aucun de tes contacts n’est encore sur Take. Sois le premier à les inviter.</div>'
    '</div>'
    '<div class="secth"><span class="label">À inviter</span></div>'
    + ''.join(invite_row(i, nm, btn('Inviter', 'muted', size='compact')) for i, nm in INVITE[:3])
    + btn('Inviter par message', ico=icon('chat-circle', 18)) + later(),
    total=4, on=3,
)))

CSS = (HERE / 'artboards.css').read_text()
html = (
    '<!doctype html><html lang="fr" data-theme="light"><head><meta charset="utf-8">'
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">'
    f'<style>{CSS}</style></head><body>'
    + ''.join(S1) + ''.join(S2)
    + '</body></html>'
)
(HERE / 'artboards.html').write_text(html)
print(len(S1) + len(S2), 'écrans')
