#!/usr/bin/env python3
"""Genera sitio/index.html a partir de plantilla.html + productos.json.

Carga mensual de productos (Plan Catálogo):
  1. Editá herramientas/productos.json (alta, baja, variantes, "agotado": true).
  2. Poné la foto en sitio/img/productos/<img>.webp (800 px máx., calidad 80).
  3. Corré: python3 herramientas/build.py
  4. Subí la carpeta sitio/ a Netlify.

Todo el texto pasa por html.escape: nunca se inserta HTML crudo desde el JSON.
"""
import html
import json
import pathlib
import re
import unicodedata

RAIZ = pathlib.Path(__file__).resolve().parent
SITIO = RAIZ.parent / "sitio"
DOMINIO = "https://prodigio-materiales.netlify.app"  # [COMPLETAR: URL definitiva de la demo]

e = lambda s: html.escape(str(s), quote=True)


def normal(s):
    s = unicodedata.normalize("NFD", s)
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower()


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", normal(s)).strip("-")


def icono(nombre, clase="ico"):
    return f'<svg class="{clase}" aria-hidden="true"><use href="#{nombre}"/></svg>'


def tarjeta(p, rubros):
    r = rubros[p["rubro"]]
    marcas = p.get("marcas", [])
    variantes = p.get("variantes", [])
    agotado = p.get("agotado", False)
    buscar = normal(" ".join([p["nombre"], " ".join(marcas), r["nombre"], p.get("desc", ""), " ".join(variantes)]))
    pid = e(p["id"])

    if p.get("img"):
        foto = (f'<img src="img/productos/{e(p["img"])}.webp" alt="{e(p["nombre"])}'
                f'{(" " + e(marcas[0])) if marcas and marcas[0].lower() not in p["nombre"].lower() else ""}" '
                f'width="400" height="300" loading="lazy" decoding="async">')
    else:
        foto = f'<span class="prod__ph">{icono(r["icono"], "ico ico--xl")}<span>Foto a confirmar</span></span>'

    marca_txt = f'<p class="prod__marca">{e(" · ".join(marcas))}</p>' if marcas else ""
    sello = f'<span class="sello">{e(p["sello"])}</span>' if p.get("sello") else ""

    if variantes:
        opciones = "".join(f'<option value="{i}">{e(v)}</option>' for i, v in enumerate(variantes))
        selector = (f'<label class="prod__var"><span class="vh">Presentación de {e(p["nombre"])}</span>'
                    f'<select name="var-{pid}">{opciones}</select></label>')
    else:
        selector = ""

    # Calculadora por superficie (opcional): "calculo": {"unidad", "unidades", "rinde": [m² por unidad, uno por variante], "desperdicio": %}
    c = p.get("calculo")
    calc = ""
    if c and not agotado:
        rinde = [float(x) for x in c["rinde"]]
        assert all(x > 0 for x in rinde) and (len(rinde) == 1 or len(rinde) == len(variantes)), p["id"]
        desp = int(c.get("desperdicio", 10))
        r0 = f'{rinde[0]:g}'.replace(".", ",")
        calc = (
            f'<details class="calc" data-rinde="{e("|".join(f"{x:g}" for x in rinde))}" data-desp="{desp}" '
            f'data-unidad="{e(c["unidad"])}" data-unidades="{e(c["unidades"])}">'
            f'<summary>{icono("i-regla")}Calcular por m²</summary>'
            f'<div class="calc__cuerpo">'
            f'<label class="calc__campo" for="calc-{pid}">m² a cubrir</label>'
            f'<input class="calc__m2" id="calc-{pid}" type="text" inputmode="decimal" maxlength="7" placeholder="Ej.: 24" autocomplete="off">'
            f'<p class="calc__res" aria-live="polite" data-base="Rinde aprox. {r0} m² por {e(c["unidad"])}. Sumamos {desp} % por cortes y solapes.">'
            f'Rinde aprox. {r0} m² por {e(c["unidad"])}. Sumamos {desp} % por cortes y solapes.</p>'
            f'</div></details>'
        )

    if agotado:
        accion = '<p class="prod__agotado">Sin stock por ahora</p>'
    else:
        accion = (
            f'<div class="prod__fila">'
            f'<div class="cant" role="group" aria-label="Cantidad de {e(p["nombre"])}">'
            f'<button type="button" class="cant__btn" data-paso="-1" aria-label="Restar uno">{icono("i-menos")}</button>'
            f'<input class="cant__num" type="number" inputmode="numeric" min="1" max="999" value="1" aria-label="Cantidad">'
            f'<button type="button" class="cant__btn" data-paso="1" aria-label="Sumar uno">{icono("i-mas")}</button>'
            f'</div>'
            f'<button type="button" class="btn btn--agregar">{icono("i-carrito")}<span>Agregar</span></button>'
            f'</div>'
        )

    return (
        f'<article class="prod{" prod--agotado" if agotado else ""}" id="p-{pid}" data-id="{pid}" '
        f'data-rubro="{e(p["rubro"])}" data-marcas="{e(" ".join(slug(m) for m in marcas))}" '
        f'data-nombre="{e(p["nombre"])}" data-buscar="{e(buscar)}">'
        f'<div class="prod__img">{foto}</div>'
        f'<div class="prod__info">{marca_txt}<h3 class="prod__nombre">{e(p["nombre"])}</h3>'
        f'<p class="prod__desc">{e(p.get("desc", ""))}</p>'
        f'<p class="prod__precio">{sello}<span>Precio: consultar</span></p></div>'
        f'<div class="prod__accion">{selector}{calc}{accion}</div>'
        f'</article>'
    )


def main():
    datos = json.loads((RAIZ / "productos.json").read_text(encoding="utf-8"))
    rubros = {r["id"]: r for r in datos["rubros"]}
    productos = datos["productos"]
    for p in productos:
        assert p["rubro"] in rubros, p["id"]
        if p.get("img"):
            assert (SITIO / "img/productos" / f'{p["img"]}.webp').exists(), p["img"]

    # Rubros (solo los que tienen productos), en el orden del JSON
    usados = [r for r in datos["rubros"] if any(p["rubro"] == r["id"] for p in productos)]
    chips = ['<button type="button" class="chip" data-rubro="todos" aria-pressed="true">Todo</button>']
    chips += [f'<button type="button" class="chip" data-rubro="{e(r["id"])}" aria-pressed="false">'
              f'{icono(r["icono"])}{e(r["nombre"])}</button>' for r in usados]

    marcas = sorted({m for p in productos for m in p.get("marcas", [])}, key=normal)
    opciones = ['<option value="">Marcas</option>'] + [
        f'<option value="{e(slug(m))}">{e(m)}</option>' for m in marcas]
    botones_marcas = "".join(
        f'<li><button type="button" class="marca" data-marca="{e(slug(m))}">{e(m)}</button></li>' for m in marcas)

    b = datos.get("banner")
    banner = ""
    if b:
        banner = (f'<aside class="banner" aria-label="Temporada">'
                  f'<div><p class="banner__tit">{e(b["titulo"])}</p><p>{e(b["texto"])}</p></div>'
                  f'<button type="button" class="btn btn--amarillo" data-ir-rubro="{e(b["rubro"])}">{e(b["boton"])}'
                  f'{icono("i-flecha")}</button></aside>')

    aviso = ('<p class="aviso-demo">Proyecto conceptual: marca, productos, marcas comerciales '
             'y rendimientos de ejemplo para la demostración.</p>') if datos.get("demo") else ""

    tarjetas = "\n".join(tarjeta(p, rubros) for p in productos)

    # Calculadora de obra: botones en el HTML + configuración como JSON de datos (no ejecutable)
    obras = datos.get("obras", {"lista": []})
    for o in obras["lista"]:
        mats = [m for op in o.get("opciones", []) for m in op["materiales"]] + o.get("materiales", [])
        assert mats and all(m["por_m2"] > 0 for m in mats), o["id"]
        assert len(o["medidas"]) == 2, o["id"]
    obras_chips = "".join(
        f'<button type="button" class="obra-tipo" data-obra="{e(o["id"])}" aria-pressed="{"true" if i == 0 else "false"}">'
        f'{icono(o["icono"])}<span>{e(o["corto"])}</span></button>' for i, o in enumerate(obras["lista"]))
    obras_json = json.dumps({"demo": obras.get("demo", False), "lista": obras["lista"]}, ensure_ascii=False).replace("</", "<\\/")

    lista = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Catálogo de demostración PRODIGIO Materiales",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "item": {
                "@type": "Product",
                "name": p["nombre"],
                "description": p.get("desc", ""),
                "category": rubros[p["rubro"]]["nombre"],
                **({"brand": {"@type": "Brand", "name": p["marcas"][0]}} if p.get("marcas") else {}),
                **({"image": f'{DOMINIO}/img/productos/{p["img"]}.webp'} if p.get("img") else {}),
                "url": f'{DOMINIO}/#p-{p["id"]}',
            }} for i, p in enumerate(productos)
        ],
    }
    jsonld = json.dumps(lista, ensure_ascii=False).replace("</", "<\\/")

    plantilla = (RAIZ / "plantilla.html").read_text(encoding="utf-8")
    reemplazos = {
        "{{CHIPS}}": "".join(chips),
        "{{MARCA_OPCIONES}}": "".join(opciones),
        "{{MARCAS_BOTONES}}": botones_marcas,
        "{{BANNER}}": banner,
        "{{AVISO_DEMO}}": aviso,
        "{{PRODUCTOS}}": tarjetas,
        "{{TOTAL}}": str(len(productos)),
        "{{JSONLD_PRODUCTOS}}": jsonld,
        "{{DOMINIO}}": DOMINIO,
        "{{OBRAS_CHIPS}}": obras_chips,
        "{{OBRAS_JSON}}": obras_json,
    }
    for k, v in reemplazos.items():
        assert k in plantilla, k
        plantilla = plantilla.replace(k, v)
    assert "{{" not in plantilla
    (SITIO / "index.html").write_text(plantilla, encoding="utf-8")
    print(f"index.html generado: {len(productos)} productos, {len(usados)} rubros, {len(marcas)} marcas")


if __name__ == "__main__":
    main()
