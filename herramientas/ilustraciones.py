#!/usr/bin/env python3
"""Genera las ilustraciones del catálogo de demostración (WebP 800x600, sin metadatos).

Dibujos vectoriales propios (sin fotos de terceros), renderizados con Chromium.
Uso: python3 herramientas/ilustraciones.py
"""
import asyncio
import io
import pathlib

from PIL import Image
from playwright.async_api import async_playwright

SALIDA = pathlib.Path(__file__).resolve().parent.parent / "sitio" / "img"

FONDOS = {  # tinte suave por rubro
    "obra-gruesa": "#E9ECF2", "impermeabilizacion": "#E6EDF6", "agua-cloaca": "#E3EEF7",
    "desagues": "#E7ECF3", "agua-fria-caliente": "#F3EBE6", "gas": "#F5EFE1",
    "pluviales": "#E4ECF5", "incendio": "#F4E8E6", "tanques-bombas": "#E3EEF5", "bano": "#ECEFF4",
}


def tubo(c, luz, osc, hueco=True, ang=-16, alto=50, ribs=0):
    rx = alto * 0.22
    y = 150 - alto / 2
    ribs_svg = "".join(f'<line x1="{80 + i * (260 / ribs):.0f}" y1="{y:.0f}" x2="{80 + i * (260 / ribs):.0f}" y2="{y + alto:.0f}" stroke="{osc}" stroke-width="4" opacity=".55"/>' for i in range(1, ribs)) if ribs else ""
    core = f'<ellipse cx="340" cy="150" rx="{rx * .62:.1f}" ry="{alto * .34:.1f}" fill="{osc}"/>' if hueco else ""
    return (f'<g transform="rotate({ang} 200 150)">'
            f'<ellipse cx="60" cy="150" rx="{rx:.1f}" ry="{alto / 2:.1f}" fill="{osc}"/>'
            f'<rect x="60" y="{y:.0f}" width="280" height="{alto}" fill="{c}"/>{ribs_svg}'
            f'<rect x="60" y="{y + alto * .12:.0f}" width="280" height="{alto * .16:.0f}" fill="#fff" opacity=".35"/>'
            f'<ellipse cx="340" cy="150" rx="{rx:.1f}" ry="{alto / 2:.1f}" fill="{luz}"/>{core}</g>')


def bolsa(c, banda, osc):
    return (f'<path d="M118 78 Q200 64 282 78 L296 238 Q200 258 104 238 Z" fill="{c}"/>'
            f'<path d="M118 78 Q200 64 282 78 L284 92 Q200 80 116 92 Z" fill="{osc}"/>'
            f'<rect x="108" y="128" width="184" height="62" fill="{banda}"/>'
            f'<rect x="128" y="146" width="96" height="10" rx="5" fill="#fff" opacity=".9"/>'
            f'<rect x="128" y="164" width="60" height="8" rx="4" fill="#fff" opacity=".6"/>'
            f'<path d="M150 80 L146 236" stroke="#fff" stroke-width="8" opacity=".18"/>')


def rollo(c, banda, osc, alu=False):
    cuerpo = tubo(c, "#c9ced8" if alu else "#3a3f4a", osc, hueco=False, ang=-12, alto=96)
    return (cuerpo + '<g transform="rotate(-12 200 150)">'
            f'<rect x="150" y="102" width="110" height="96" fill="{banda}"/>'
            f'<rect x="166" y="132" width="78" height="12" rx="6" fill="#fff" opacity=".9"/>'
            f'<ellipse cx="340" cy="150" rx="9" ry="16" fill="#222"/></g>')


def balde(c, tapa, banda):
    return (f'<path d="M150 82 Q200 30 250 82" fill="none" stroke="#8a8f99" stroke-width="5"/>'
            f'<path d="M138 96 L262 96 L250 248 L150 248 Z" fill="{c}"/>'
            f'<rect x="128" y="80" width="144" height="24" rx="7" fill="{tapa}"/>'
            f'<path d="M142 140 L258 140 L253 200 L147 200 Z" fill="{banda}"/>'
            f'<rect x="164" y="158" width="72" height="11" rx="5" fill="#fff" opacity=".9"/>'
            f'<rect x="164" y="176" width="44" height="8" rx="4" fill="#fff" opacity=".6"/>'
            f'<rect x="150" y="110" width="8" height="128" fill="#fff" opacity=".25"/>')


def espiral(c, osc, vueltas=6):
    s = "".join(f'<ellipse cx="200" cy="160" rx="{130 - k * 14}" ry="{78 - k * 8}" fill="none" stroke="{c if k % 2 == 0 else osc}" stroke-width="12"/>' for k in range(vueltas))
    return s + f'<path d="M330 160 Q350 120 360 90" fill="none" stroke="{c}" stroke-width="12" stroke-linecap="round"/>'


def valvula(c, osc):
    return (f'<rect x="70" y="160" width="40" height="80" rx="6" fill="{osc}"/><rect x="290" y="160" width="40" height="80" rx="6" fill="{osc}"/>'
            f'<rect x="100" y="178" width="200" height="44" fill="{c}"/>'
            f'<path d="M160 222 L160 120 Q160 100 180 100 L220 100 Q240 100 240 120 L240 222 Z" fill="{c}"/>'
            f'<rect x="192" y="58" width="16" height="44" fill="#555b66"/><rect x="150" y="48" width="100" height="16" rx="8" fill="{osc}"/>'
            f'<rect x="170" y="112" width="10" height="100" fill="#fff" opacity=".3"/>')


def medidor():
    return ('<circle cx="200" cy="150" r="104" fill="#2b2f38"/><circle cx="200" cy="150" r="84" fill="#f4f6fa"/>'
            '<rect x="150" y="104" width="100" height="26" rx="4" fill="#fff" stroke="#2b2f38" stroke-width="3"/>'
            + "".join(f'<rect x="{156 + i * 18}" y="109" width="14" height="16" fill="#e8ecf3"/>' for i in range(5))
            + "".join(f'<circle cx="{x}" cy="{y}" r="15" fill="#fff" stroke="#c33" stroke-width="3"/><path d="M{x} {y} L{x + 7} {y - 9}" stroke="#c33" stroke-width="3"/>' for x, y in [(160, 175), (200, 195), (240, 175)])
            + '<rect x="96" y="232" width="208" height="20" rx="6" fill="#2b2f38"/>')


def accesorios(c, osc):
    return (f'<path d="M80 200 L170 200 Q200 200 200 170 L200 90" fill="none" stroke="{c}" stroke-width="40" stroke-linejoin="round"/>'
            f'<rect x="60" y="178" width="26" height="44" rx="4" fill="{osc}"/><rect x="178" y="70" width="44" height="26" rx="4" fill="{osc}"/>'
            f'<path d="M240 200 L360 200 M300 200 L300 120" stroke="{c}" stroke-width="40"/>'
            f'<rect x="226" y="178" width="22" height="44" rx="4" fill="{osc}"/><rect x="352" y="178" width="22" height="44" rx="4" fill="{osc}"/><rect x="278" y="104" width="44" height="22" rx="4" fill="{osc}"/>')


def canaleta(c, osc, bajada=False):
    if bajada:
        return (tubo(c, "#f7f8fb", osc, ang=-70, alto=58)
                + f'<path d="M262 64 Q290 64 300 88" fill="none" stroke="{c}" stroke-width="26"/>')
    return (f'<g transform="rotate(-10 200 150)"><path d="M50 120 L350 120 L350 140 Q350 200 300 200 L100 200 Q50 200 50 140 Z" fill="{c}"/>'
            f'<path d="M50 120 L350 120 L350 132 Q350 186 300 186 L100 186 Q50 186 50 132 Z" fill="{osc}" opacity=".35"/>'
            f'<rect x="50" y="114" width="300" height="10" rx="5" fill="#fff"/></g>')


def matafuego(grande=False):
    if grande:
        return ('<rect x="140" y="70" width="120" height="170" rx="40" fill="#c8312b"/><rect x="156" y="84" width="14" height="140" fill="#fff" opacity=".25"/>'
                '<rect x="150" y="140" width="100" height="44" fill="#f2f2f2"/><circle cx="150" cy="250" r="26" fill="#2b2f38"/><circle cx="270" cy="250" r="26" fill="#2b2f38"/>'
                '<rect x="185" y="46" width="30" height="28" fill="#555b66"/><path d="M215 56 Q320 40 320 160" fill="none" stroke="#2b2f38" stroke-width="10"/>')
    return ('<rect x="168" y="96" width="64" height="160" rx="28" fill="#c8312b"/><rect x="178" y="108" width="10" height="136" fill="#fff" opacity=".28"/>'
            '<rect x="172" y="150" width="56" height="44" fill="#f2f2f2"/><rect x="188" y="70" width="24" height="30" fill="#555b66"/>'
            '<path d="M200 74 L250 60" stroke="#2b2f38" stroke-width="8"/><path d="M212 84 Q270 110 252 240" fill="none" stroke="#2b2f38" stroke-width="8"/>')


def gabinete():
    return ('<rect x="110" y="50" width="180" height="210" rx="6" fill="#c8312b"/><rect x="126" y="66" width="148" height="178" fill="#e9eef5"/>'
            + "".join(f'<circle cx="190" cy="160" r="{r}" fill="none" stroke="#d9dde4" stroke-width="10"/>' for r in (62, 46, 30))
            + '<rect x="248" y="90" width="12" height="130" rx="6" fill="#c69a3b"/><rect x="126" y="66" width="148" height="178" fill="#fff" opacity=".18"/>')


def valvula_teatro():
    return ('<path d="M140 210 L140 150 Q140 120 170 120 L240 120" fill="none" stroke="#c8312b" stroke-width="46"/>'
            '<rect x="118" y="214" width="44" height="26" fill="#a2261f"/><rect x="236" y="96" width="30" height="48" fill="#c69a3b"/>'
            '<rect x="162" y="62" width="16" height="50" fill="#555b66"/><ellipse cx="170" cy="58" rx="46" ry="12" fill="#a2261f"/>')


def tanque():
    return ('<path d="M120 90 Q120 52 200 52 Q280 52 280 90 L280 240 Q280 262 200 262 Q120 262 120 240 Z" fill="#6f7682"/>'
            + "".join(f'<path d="M120 {y} Q200 {y + 16} 280 {y}" fill="none" stroke="#5a606b" stroke-width="5"/>' for y in (120, 170, 220))
            + '<ellipse cx="200" cy="56" rx="40" ry="10" fill="#5a606b"/><rect x="186" y="34" width="28" height="22" rx="4" fill="#5a606b"/>'
            '<rect x="138" y="80" width="12" height="160" fill="#fff" opacity=".2"/>')


def bomba(centrifuga=False):
    r = 64 if centrifuga else 50
    return ('<rect x="70" y="112" width="150" height="96" rx="14" fill="#2a5ca8"/>'
            + "".join(f'<rect x="{84 + i * 18}" y="112" width="8" height="96" fill="#214a88"/>' for i in range(7))
            + f'<circle cx="270" cy="160" r="{r}" fill="#2a5ca8"/><circle cx="270" cy="160" r="{r * .38:.0f}" fill="#d7dde6"/>'
            f'<rect x="{262}" y="{160 - r - 22}" width="16" height="28" fill="#c69a3b"/>'
            '<rect x="60" y="214" width="250" height="18" rx="4" fill="#214a88"/><rect x="80" y="122" width="130" height="12" fill="#fff" opacity=".22"/>')


def inodoro():
    return ('<rect x="230" y="60" width="70" height="120" rx="10" fill="#f7f8fb" stroke="#cfd5df" stroke-width="3"/>'
            '<path d="M100 150 L250 150 Q252 210 200 222 L196 252 L132 252 L128 222 Q100 210 100 150 Z" fill="#f7f8fb" stroke="#cfd5df" stroke-width="3"/>'
            '<rect x="94" y="140" width="164" height="16" rx="8" fill="#e5e9f0"/><rect x="250" y="76" width="34" height="8" rx="4" fill="#cfd5df"/>')


def local():
    return ('<rect x="40" y="70" width="320" height="200" fill="#e7e2d8"/><rect x="40" y="70" width="320" height="16" fill="#cfc8bb"/>'
            '<rect x="40" y="96" width="210" height="44" fill="#1D4E9E"/>'
            '<text x="62" y="128" font-family="TeX Gyre Heros Cn, Arial Narrow, sans-serif" font-weight="700" font-style="italic" font-size="30" fill="#fff">PRODIGIO</text>'
            '<rect x="56" y="156" width="88" height="114" fill="#9fc2e6"/><rect x="156" y="156" width="88" height="114" fill="#9fc2e6"/>'
            '<rect x="98" y="156" width="4" height="114" fill="#e7e2d8"/><rect x="198" y="156" width="4" height="114" fill="#e7e2d8"/>'
            '<rect x="268" y="150" width="76" height="120" fill="#16263F"/><rect x="274" y="156" width="64" height="114" fill="#2a3d5c"/>'
            '<rect x="262" y="96" width="88" height="40" fill="#F5A43A"/><rect x="20" y="268" width="360" height="12" fill="#b9b2a5"/>'
            '<rect x="60" y="164" width="30" height="60" fill="#fff" opacity=".35"/>')


AZUL, AZUL_O = "#1D4E9E", "#163C7A"
ILUSTRACIONES = {
    "cemento-portland": ("obra-gruesa", bolsa("#a9adb6", AZUL, "#8b909a")),
    "cal-hidratada": ("obra-gruesa", bolsa("#ece8dc", "#3b7d4f", "#d4cfbf")),
    "adhesivo-ceramicos": ("obra-gruesa", bolsa("#f2f2f2", "#e38a2c", "#d9d9d9")),
    "revoque-fino": ("obra-gruesa", bolsa("#d8d2c4", "#6a4f9e", "#c2bba9")),
    "membrana-asfaltica": ("impermeabilizacion", rollo("#2b2f38", "#c8312b", "#1c1f26")),
    "membrana-aluminio": ("impermeabilizacion", rollo("#b9c0cb", "#c8312b", "#8e96a3", alu=True)),
    "membrana-liquida": ("impermeabilizacion", balde("#f4f6fa", "#e9edf3", AZUL)),
    "membrana-fibrada": ("impermeabilizacion", balde("#f2c84b", "#c8312b", "#5b3f8f")),
    "tubo-pvc-junta": ("agua-cloaca", tubo("#8d949f", "#b6bcc6", "#5e6570", alto=60)),
    "cano-polietileno": ("agua-cloaca", espiral("#2b2f38", "#3d72b8")),
    "valvula-esclusa": ("agua-cloaca", valvula("#2a5ca8", "#214a88")),
    "medidor-agua": ("agua-cloaca", medidor()),
    "cano-corrugado": ("agua-cloaca", tubo("#2b2f38", "#4a505c", "#16181d", alto=80, ribs=14)),
    "cano-desague": ("desagues", tubo("#d86a2b", "#f08a4b", "#9e4a1b")),
    "accesorios-desague": ("desagues", accesorios("#d86a2b", "#9e4a1b")),
    "tubo-termofusion": ("agua-fria-caliente", tubo("#9b3b2b", "#c45a46", "#6e281c", alto=40)),
    "accesorios-termofusion": ("agua-fria-caliente", accesorios("#9b3b2b", "#6e281c")),
    "tubo-gas": ("gas", tubo("#f2c33b", "#f7d86e", "#b88a14")),
    "tubo-gas-epoxi": ("gas", tubo("#e8b52c", "#8a8f99", "#5e6570", alto=44)),
    "canaleta-pvc": ("pluviales", canaleta("#f4f6fa", "#9aa3b0")),
    "bajada-pvc": ("pluviales", canaleta("#eef1f6", "#9aa3b0", bajada=True)),
    "matafuego": ("incendio", matafuego()),
    "matafuego-rodante": ("incendio", matafuego(grande=True)),
    "gabinete-incendio": ("incendio", gabinete()),
    "manguera-incendio": ("incendio", espiral("#efe9de", "#d8cfbf", 5)),
    "valvula-teatro": ("incendio", valvula_teatro()),
    "tanque-reserva": ("tanques-bombas", tanque()),
    "bomba-periferica": ("tanques-bombas", bomba()),
    "bomba-centrifuga": ("tanques-bombas", bomba(centrifuga=True)),
    "inodoro": ("bano", inodoro()),
    "local": ("obra-gruesa", local()),
}


def svg(rubro, dibujo):
    fondo = FONDOS[rubro]
    grilla = "".join(f'<path d="M{x} 0V300" stroke="#fff" stroke-width="1" opacity=".55"/>' for x in range(0, 400, 25))
    grilla += "".join(f'<path d="M0 {y}H400" stroke="#fff" stroke-width="1" opacity=".55"/>' for y in range(0, 300, 25))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="800" height="600">'
            f'<rect width="400" height="300" fill="{fondo}"/>{grilla}'
            f'<ellipse cx="200" cy="262" rx="150" ry="16" fill="#0E1A2E" opacity=".08"/>{dibujo}</svg>')


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        pg = await (await b.new_context(viewport={"width": 800, "height": 600})).new_page()
        for nombre, (rubro, dibujo) in ILUSTRACIONES.items():
            await pg.set_content(f'<html><body style="margin:0">{svg(rubro, dibujo)}</body></html>')
            png = await pg.locator("svg").screenshot()
            im = Image.open(io.BytesIO(png)).convert("RGB")
            destino = SALIDA / ("local.webp" if nombre == "local" else f"productos/{nombre}.webp")
            im.save(destino, "WEBP", quality=80, method=6)  # sin EXIF
        await b.close()
    print(f"{len(ILUSTRACIONES)} ilustraciones generadas")


if __name__ == "__main__":
    asyncio.run(main())
