/* PRODIGIO Materiales (proyecto conceptual de Tereré Estudio) — catálogo, filtros y pedido por WhatsApp
   Los mensajes de WhatsApp llegan a Tereré Estudio con el texto de la demo.
   Sin innerHTML, sin eval, sin handlers inline. Compatible con CSP script-src 'self'. */
"use strict";
(() => {
  const WA_NUMERO = "5493644328260";   // WhatsApp de Tereré Estudio (demo)
  const MSJ_DEMO = "Hola Tereré Estudio, vi la demo de PRODIGIO Materiales. Quiero una página como esta.";
  const CLAVE = "prodigio-pedido-v1";      // en el navegador solo se guarda id, variante y cantidad
  const MAX_CANT = 999;
  const MAX_ITEMS = 60;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const normal = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const waUrl = (texto) => `https://wa.me/${WA_NUMERO}?text=${encodeURIComponent(texto)}`;
  const svgUse = (id) => {
    const NS = "http://www.w3.org/2000/svg";
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("class", "ico");
    s.setAttribute("aria-hidden", "true");
    const u = document.createElementNS(NS, "use");
    u.setAttribute("href", "#" + id);
    s.appendChild(u);
    return s;
  };

  /* ---------- Enlaces de WhatsApp con mensaje prellenado ---------- */
  $$("[data-wa]").forEach((a) => { a.href = waUrl(a.dataset.wa === "DEMO" ? MSJ_DEMO : a.dataset.wa); });

  /* ---------- Header: menú y sombra ---------- */
  const header = $("#header");
  const nav = $("#nav");
  const btnMenu = $(".header__menu");
  const cerrarMenu = () => { nav.classList.remove("abierto"); btnMenu.setAttribute("aria-expanded", "false"); btnMenu.setAttribute("aria-label", "Abrir menú"); };
  btnMenu.addEventListener("click", () => {
    const abierto = nav.classList.toggle("abierto");
    btnMenu.setAttribute("aria-expanded", String(abierto));
    btnMenu.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
  });
  $$("a", nav).forEach((a) => a.addEventListener("click", cerrarMenu));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarMenu(); });
  const sombra = () => header.classList.toggle("con-sombra", window.scrollY > 8);
  window.addEventListener("scroll", sombra, { passive: true });
  sombra();

  /* ---------- Pasos: se destacan de a uno mientras están en pantalla ---------- */
  const pasos = $$(".paso");
  if (pasos.length && !reducido && "IntersectionObserver" in window) {
    let i = 0, timer = null;
    const marcar = () => { pasos.forEach((p, j) => p.classList.toggle("activo", j === i)); i = (i + 1) % pasos.length; };
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !timer) { marcar(); timer = setInterval(marcar, 2300); }
      else if (!en.isIntersecting && timer) { clearInterval(timer); timer = null; }
    }, { threshold: 0.4 }).observe($(".pasos__lista"));
  } else if (pasos[0]) {
    pasos[0].classList.add("activo");
  }

  /* ---------- Catálogo: filtros ---------- */
  const tarjetas = $$(".prod");
  const productos = new Map(tarjetas.map((t) => [t.dataset.id, t]));
  const buscar = $("#buscar");
  const selMarca = $("#marca");
  const chips = $$(".chip");
  const resultado = $("#resultado");
  const vacio = $("#vacio");
  const filtros = $(".filtros");
  const estado = { rubro: "todos", marca: "", q: "" };

  const aplicar = () => {
    const palabras = normal(estado.q).split(/\s+/).filter(Boolean);
    let n = 0;
    tarjetas.forEach((t) => {
      const ok = (estado.rubro === "todos" || t.dataset.rubro === estado.rubro)
        && (!estado.marca || t.dataset.marcas.split(" ").includes(estado.marca))
        && palabras.every((p) => t.dataset.buscar.includes(p));
      t.hidden = !ok;
      if (ok) n++;
    });
    resultado.textContent = n === 1 ? "1 producto" : `${n} productos`;
    vacio.hidden = n > 0;
    chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.rubro === estado.rubro)));
  };
  const irAlCatalogo = () => $("#catalogo").scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "start" });

  let espera;
  buscar.addEventListener("input", () => {
    clearTimeout(espera);
    espera = setTimeout(() => { estado.q = buscar.value.slice(0, 60); aplicar(); }, 120);
  });
  selMarca.addEventListener("change", () => { estado.marca = selMarca.value; aplicar(); });
  chips.forEach((c) => c.addEventListener("click", () => {
    estado.rubro = c.dataset.rubro;
    aplicar();
    c.scrollIntoView({ behavior: reducido ? "auto" : "smooth", inline: "center", block: "nearest" });
  }));
  $$("[data-ir-rubro]").forEach((b) => b.addEventListener("click", () => {
    estado.rubro = b.dataset.irRubro; estado.marca = ""; estado.q = "";
    selMarca.value = ""; buscar.value = "";
    aplicar(); irAlCatalogo();
  }));
  $$("[data-marca]").forEach((b) => b.addEventListener("click", () => {
    estado.rubro = "todos"; estado.q = ""; buscar.value = "";
    estado.marca = b.dataset.marca; selMarca.value = b.dataset.marca;
    aplicar(); irAlCatalogo();
  }));
  $("#limpiar").addEventListener("click", () => {
    estado.rubro = "todos"; estado.marca = ""; estado.q = "";
    selMarca.value = ""; buscar.value = "";
    aplicar();
  });
  if ("IntersectionObserver" in window) {
    const centinela = document.createElement("div");
    filtros.before(centinela);
    new IntersectionObserver(([en]) => filtros.classList.toggle("pegado", !en.isIntersecting && en.boundingClientRect.top < 0))
      .observe(centinela);
  }

  /* ---------- Cantidades ---------- */
  const leerCant = (input) => {
    const v = parseInt(input.value, 10);
    return Number.isFinite(v) ? Math.min(Math.max(v, 1), MAX_CANT) : 1;
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".prod .cant__btn");
    if (!b) return;
    const input = b.parentElement.querySelector(".cant__num");
    input.value = String(Math.min(Math.max(leerCant(input) + Number(b.dataset.paso), 1), MAX_CANT));
  });
  $$(".prod .cant__num").forEach((i) => i.addEventListener("change", () => { i.value = String(leerCant(i)); }));

  /* ---------- Calculadora por m² (carga la cantidad sola) ---------- */
  const MAX_M2 = 100000;
  const fmtM2 = (n) => n.toLocaleString("es-AR", { maximumFractionDigits: 1 });
  const leerM2 = (tarjeta) => {
    const inp = tarjeta.querySelector(".calc__m2");
    if (!inp) return null;
    const n = parseFloat(inp.value.replace(/\./g, "").replace(",", ".").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n > 0 && n <= 10000 ? Math.round(n * 10) / 10 : null;
  };
  const calcular = (tarjeta) => {
    const det = tarjeta.querySelector(".calc");
    if (!det) return;
    const res = det.querySelector(".calc__res");
    const m2 = leerM2(tarjeta);
    if (m2 === null) { res.textContent = res.dataset.base; res.classList.remove("ok"); return; }
    const rinde = det.dataset.rinde.split("|").map(Number);
    const sel = tarjeta.querySelector("select");
    const r = rinde[Math.min(sel ? sel.selectedIndex : 0, rinde.length - 1)];
    const desp = Number(det.dataset.desp) || 0;
    const n = Math.min(Math.max(Math.ceil(m2 * (1 + desp / 100) / r - 1e-9), 1), MAX_CANT);
    tarjeta.querySelector(".cant__num").value = String(n);
    res.replaceChildren();
    const fuerte = document.createElement("strong");
    fuerte.textContent = `${n} ${n === 1 ? det.dataset.unidad : det.dataset.unidades}`;
    res.append("Necesitás aprox. ", fuerte, ` para ${fmtM2(m2)} m² (con ${desp} % extra). Ya lo cargamos en la cantidad.`);
    res.classList.add("ok");
  };
  $$(".calc__m2").forEach((inp) => inp.addEventListener("input", () => calcular(inp.closest(".prod"))));
  $$(".prod select").forEach((sel) => sel.addEventListener("change", () => { const t = sel.closest(".prod"); if (leerM2(t) !== null) calcular(t); }));

  /* ---------- Calculadora de obra: configuración y cálculo ---------- */
  let OBRAS = [], OBRAS_DEMO = false;
  try { const cfg = JSON.parse($("#obras-datos").textContent); OBRAS = cfg.lista || []; OBRAS_DEMO = !!cfg.demo; } catch (_) { OBRAS = []; }
  const obraPorId = new Map(OBRAS.map((o) => [o.id, o]));
  const fmtNum = (n) => n.toLocaleString("es-AR", { maximumFractionDigits: 1 });
  const leerNum = (txt) => {
    const n = parseFloat(String(txt).replace(/\./g, "").replace(",", ".").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
  };
  const materialesDe = (o, op) => (o.opciones ? o.opciones[Math.min(Math.max(op, 0), o.opciones.length - 1)].materiales : o.materiales);
  // Devuelve null si las medidas no son válidas
  const calcularObra = (o, op, d) => {
    const [a, b, c] = d;
    if (!(a > 0 && a <= 1000 && b > 0 && b <= 1000)) return null;
    const desc = o.aberturas && c > 0 ? c : 0;
    const area = Math.round((a * b - desc) * 100) / 100;
    if (!(area > 0)) return null;
    const desp = 1 + (Number(o.desperdicio) || 0) / 100;
    const mats = materialesDe(o, op).map((m) => {
      const bruto = area * m.por_m2 * desp;
      const cant = m.decimales ? Math.ceil(bruto * 10 - 1e-9) / 10 : Math.max(Math.ceil(bruto - 1e-9), 1);
      return { nombre: m.nombre, cant, unidad: cant === 1 ? m.unidad : m.plural_unidad };
    });
    return { area, desc, mats, sistema: o.opciones ? o.opciones[Math.min(Math.max(op, 0), o.opciones.length - 1)].nombre : "" };
  };
  const lineasObra = (o, r, d, sangria) => [
    `Obra: ${o.nombre}${r.sistema ? " (" + r.sistema + ")" : ""} — ${fmtNum(r.area)} m² (${fmtNum(d[0])} × ${fmtNum(d[1])} m${r.desc ? ` menos ${fmtNum(r.desc)} m² de aberturas` : ""})`,
    ...r.mats.map((m) => `${sangria}– ${m.nombre}: ${fmtNum(m.cant)} ${m.unidad}`)
  ];

  /* ---------- Pedido (carrito) ---------- */
  let pedido = [];   // [{ id, v, q, m2? }]
  const cargar = () => {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE) || "[]");
      if (!Array.isArray(datos)) return [];
      return datos.filter((x) => x && (productos.has(String(x.id)) || (x.obra && obraPorId.has(String(x.obra))))).slice(0, MAX_ITEMS).map((x) => {
        if (x.obra) {
          const o = obraPorId.get(String(x.obra));
          const d = Array.isArray(x.d) ? x.d.slice(0, 3).map(Number) : [];
          const op = o.opciones && Number.isInteger(x.o) && x.o >= 0 && x.o < o.opciones.length ? x.o : 0;
          const dd = [d[0], d[1], d[2] > 0 ? d[2] : 0];
          return calcularObra(o, op, dd) ? { obra: o.id, o: op, d: dd } : null;
        }
        const sel = productos.get(String(x.id)).querySelector("select");
        const nVar = sel ? sel.options.length : 0;
        const v = Number.isInteger(x.v) && x.v >= 0 && x.v < nVar ? x.v : (nVar ? 0 : -1);
        const q = Number.isInteger(x.q) ? Math.min(Math.max(x.q, 1), MAX_CANT) : 1;
        const m2 = typeof x.m2 === "number" && x.m2 > 0 && x.m2 <= MAX_M2 ? Math.round(x.m2 * 10) / 10 : undefined;
        return m2 ? { id: String(x.id), v, q, m2 } : { id: String(x.id), v, q };
      });
    } catch (_) { return []; }
  };
  const cargarLimpio = () => cargar().filter(Boolean);
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(pedido)); } catch (_) { /* sin almacenamiento: el pedido vive en la sesión */ } };
  const datosItem = (it) => {
    const t = productos.get(it.id);
    const sel = t.querySelector("select");
    const variante = sel && it.v >= 0 ? sel.options[it.v].textContent : "";
    const m2 = it.m2 ? `para ${fmtM2(it.m2)} m²` : "";
    return { nombre: t.dataset.nombre, variante, m2, detalle: [variante, m2].filter(Boolean).join(" · ") };
  };

  const contadores = $$("[data-contador]");
  const barra = $("#barra-pedido");
  const lista = $("#pedido-lista");
  const form = $("#pedido-form");
  const pedidoVacio = $("#pedido-vacio");
  const btnPedido = $(".header__pedido");

  const render = () => {
    const total = pedido.length;
    contadores.forEach((c) => { c.textContent = String(total); if (c.classList.contains("badge")) c.hidden = total === 0; });
    $("#barra-pedido [data-unidad]").textContent = total === 1 ? "producto" : "productos";
    btnPedido.setAttribute("aria-label", `Ver tu pedido, ${total} ${total === 1 ? "producto" : "productos"}`);
    barra.hidden = total === 0;
    document.body.classList.toggle("con-barra", total > 0);
    pedidoVacio.hidden = total > 0;
    form.hidden = total === 0;

    lista.replaceChildren();
    pedido.forEach((it, idx) => {
      if (it.obra) {
        const o = obraPorId.get(it.obra);
        const r = calcularObra(o, it.o, it.d);
        const li = document.createElement("li");
        li.className = "pedido__obra";
        const txt = document.createElement("div");
        const tit = document.createElement("p");
        tit.className = "pedido__item-nombre";
        tit.textContent = `Obra: ${o.nombre}`;
        const sub = document.createElement("span");
        sub.className = "pedido__item-var";
        sub.textContent = `${fmtNum(r.area)} m²${r.sistema ? " · " + r.sistema : ""} · materiales estimados`;
        tit.appendChild(sub);
        const ul = document.createElement("ul");
        ul.className = "pedido__mats";
        r.mats.forEach((m) => { const l = document.createElement("li"); l.textContent = `${m.nombre}: ${fmtNum(m.cant)} ${m.unidad}`; ul.appendChild(l); });
        txt.append(tit, ul);
        const quitar = document.createElement("button");
        quitar.type = "button"; quitar.className = "quitar"; quitar.setAttribute("aria-label", `Quitar la obra ${o.nombre}`); quitar.appendChild(svgUse("i-quitar"));
        quitar.addEventListener("click", () => { pedido.splice(idx, 1); guardar(); render(); });
        li.append(txt, quitar);
        lista.appendChild(li);
        return;
      }
      const { nombre, detalle } = datosItem(it);
      const li = document.createElement("li");
      const txt = document.createElement("p");
      txt.className = "pedido__item-nombre";
      txt.textContent = nombre;
      if (detalle) {
        const s = document.createElement("span");
        s.className = "pedido__item-var";
        s.textContent = detalle;
        txt.appendChild(s);
      }
      const cant = document.createElement("div");
      cant.className = "cant";
      cant.setAttribute("role", "group");
      cant.setAttribute("aria-label", `Cantidad de ${nombre}`);
      const menos = document.createElement("button");
      menos.type = "button"; menos.className = "cant__btn"; menos.setAttribute("aria-label", "Restar uno"); menos.appendChild(svgUse("i-menos"));
      const num = document.createElement("input");
      num.type = "number"; num.className = "cant__num"; num.min = "1"; num.max = String(MAX_CANT); num.inputMode = "numeric"; num.value = String(it.q); num.setAttribute("aria-label", "Cantidad");
      const mas = document.createElement("button");
      mas.type = "button"; mas.className = "cant__btn"; mas.setAttribute("aria-label", "Sumar uno"); mas.appendChild(svgUse("i-mas"));
      const cambiar = (q) => { pedido[idx].q = Math.min(Math.max(q, 1), MAX_CANT); num.value = String(pedido[idx].q); guardar(); };
      menos.addEventListener("click", () => cambiar(pedido[idx].q - 1));
      mas.addEventListener("click", () => cambiar(pedido[idx].q + 1));
      num.addEventListener("change", () => cambiar(leerCant(num)));
      cant.append(menos, num, mas);
      const quitar = document.createElement("button");
      quitar.type = "button"; quitar.className = "quitar"; quitar.setAttribute("aria-label", `Quitar ${nombre}`); quitar.appendChild(svgUse("i-quitar"));
      quitar.addEventListener("click", () => { pedido.splice(idx, 1); guardar(); render(); });
      li.append(txt, cant, quitar);
      lista.appendChild(li);
    });
    ubicarWa();
  };

  const agregar = (tarjeta, boton) => {
    const sel = tarjeta.querySelector("select");
    const v = sel ? sel.selectedIndex : -1;
    const q = leerCant(tarjeta.querySelector(".cant__num"));
    const m2 = leerM2(tarjeta);
    const existe = pedido.find((x) => !x.obra && x.id === tarjeta.dataset.id && x.v === v);
    if (existe) {
      existe.q = Math.min(existe.q + q, MAX_CANT);
      if (m2) existe.m2 = Math.min(Math.round(((existe.m2 || 0) + m2) * 10) / 10, MAX_M2);
    } else if (pedido.length < MAX_ITEMS) {
      pedido.push(m2 ? { id: tarjeta.dataset.id, v, q, m2 } : { id: tarjeta.dataset.id, v, q });
    }
    guardar(); render();
    tarjeta.querySelector(".cant__num").value = "1";
    const m2Input = tarjeta.querySelector(".calc__m2");
    if (m2Input) { m2Input.value = ""; calcular(tarjeta); }
    const etiqueta = boton.querySelector("span");
    boton.classList.add("ok");
    etiqueta.textContent = "Agregado";
    boton.querySelector("use").setAttribute("href", "#i-check");
    setTimeout(() => { boton.classList.remove("ok"); etiqueta.textContent = "Agregar"; boton.querySelector("use").setAttribute("href", "#i-carrito"); }, 1600);
    const badge = $(".badge");
    badge.classList.remove("pulso"); void badge.offsetWidth; badge.classList.add("pulso");
  };
  $$(".btn--agregar").forEach((b) => b.addEventListener("click", () => agregar(b.closest(".prod"), b)));

  /* ---------- Calculadora de obra: interfaz ---------- */
  const obraForm = $("#obra-form");
  if (obraForm && OBRAS.length) {
    const tipos = $$(".obra-tipo");
    const inA = $("#obra-a"), inB = $("#obra-b"), inC = $("#obra-c"), selOp = $("#obra-op");
    const lstObra = $("#obra-lista"), total = $("#obra-total"), btnSumar = $("#obra-sumar"), btnWa = $("#obra-wa"), okObra = $("#obra-ok");
    let actual = OBRAS[0];
    let ultimo = null;   // { o, d, r }

    const elegir = (o) => {
      actual = o;
      tipos.forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.obra === o.id)));
      $("#obra-detalle").textContent = o.detalle || "";
      $("#obra-a-label").textContent = o.medidas[0];
      $("#obra-b-label").textContent = o.medidas[1];
      $("#obra-c-campo").hidden = !o.aberturas;
      $("#obra-op-campo").hidden = !o.opciones;
      selOp.replaceChildren();
      (o.opciones || []).forEach((op, i) => { const opt = document.createElement("option"); opt.value = String(i); opt.textContent = op.nombre; selOp.appendChild(opt); });
      calcularUI();
    };
    const calcularUI = () => {
      okObra.hidden = true;
      const d = [leerNum(inA.value), leerNum(inB.value), actual.aberturas ? (leerNum(inC.value) || 0) : 0];
      const op = actual.opciones ? selOp.selectedIndex : 0;
      const r = calcularObra(actual, op, d);
      lstObra.replaceChildren();
      if (!r) {
        ultimo = null;
        total.textContent = inA.value || inB.value ? "Revisá las medidas: van en metros, por ejemplo 4,5." : "Completá las medidas para ver los materiales.";
        btnSumar.disabled = true;
        btnWa.setAttribute("aria-disabled", "true");
        btnWa.href = waUrl(MSJ_DEMO);
        return;
      }
      ultimo = { o: actual, op, d, r };
      total.replaceChildren();
      const b = document.createElement("strong");
      b.textContent = `${fmtNum(r.area)} m²`;
      total.append("Para ", b, ` necesitás aprox. (con ${Number(actual.desperdicio) || 0} % extra):`);
      r.mats.forEach((m) => {
        const li = document.createElement("li");
        const n = document.createElement("span"); n.textContent = m.nombre;
        const c = document.createElement("strong"); c.textContent = `${fmtNum(m.cant)} ${m.unidad}`;
        li.append(n, c);
        lstObra.appendChild(li);
      });
      btnSumar.disabled = false;
      btnWa.removeAttribute("aria-disabled");
      btnWa.href = waUrl(["Hola Tereré Estudio, probé la calculadora de obra de la demo PRODIGIO Materiales. Quiero una página como esta. Este fue el cálculo:", "", ...lineasObra(actual, r, d, "   "), "", "(Cálculo estimado en la web)"].join("\n"));
    };
    tipos.forEach((t) => t.addEventListener("click", () => elegir(obraPorId.get(t.dataset.obra))));
    [inA, inB, inC].forEach((i) => i.addEventListener("input", calcularUI));
    selOp.addEventListener("change", calcularUI);
    btnWa.addEventListener("click", (e) => { if (!ultimo) e.preventDefault(); });
    obraForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!ultimo || pedido.length >= MAX_ITEMS) return;
      pedido.push({ obra: ultimo.o.id, o: ultimo.op, d: ultimo.d });
      guardar(); render();
      okObra.hidden = false;
      const badge = $(".badge");
      badge.classList.remove("pulso"); void badge.offsetWidth; badge.classList.add("pulso");
    });
    if (OBRAS_DEMO) $("#obra-nota").textContent += " Valores de ejemplo de la demostración.";
    elegir(OBRAS[0]);
  }

  /* ---------- Hoja del pedido ---------- */
  const dialogo = $("#pedido");
  const abrir = () => {
    cerrarMenu();
    if (typeof dialogo.showModal === "function") dialogo.showModal(); else dialogo.setAttribute("open", "");
    document.documentElement.classList.add("sin-scroll");
  };
  const cerrar = () => { if (dialogo.open) dialogo.close(); };
  dialogo.addEventListener("close", () => document.documentElement.classList.remove("sin-scroll"));
  $$("[data-abrir-pedido]").forEach((b) => b.addEventListener("click", abrir));
  $$("[data-cerrar-pedido]").forEach((b) => b.addEventListener("click", cerrar));
  dialogo.addEventListener("click", (e) => { if (e.target === dialogo) cerrar(); });

  /* ---------- Enviar a WhatsApp ---------- */
  const error = $("#pedido-error");
  const nota = $("#pedido-nota");
  const limpiarTexto = (s, max) => s.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = limpiarTexto(form.nombre.value, 60);
    const localidad = limpiarTexto(form.localidad.value, 60);
    const comentario = limpiarTexto(form.comentario.value, 300);
    const entrega = form.entrega.value === "Retiro en el local" ? "Retiro en el local" : "Envío a obra";
    const faltan = [];
    form.nombre.setAttribute("aria-invalid", String(nombre.length < 2));
    form.localidad.setAttribute("aria-invalid", String(localidad.length < 2));
    if (nombre.length < 2) faltan.push("tu nombre");
    if (localidad.length < 2) faltan.push("tu localidad");
    if (!$("#f-acepto").checked) faltan.push("aceptar el uso de tus datos");
    if (!pedido.length) faltan.push("al menos un producto");
    if (faltan.length) {
      error.textContent = `Completá ${faltan.join(", ")}.`;
      error.hidden = false;
      (nombre.length < 2 ? form.nombre : localidad.length < 2 ? form.localidad : $("#f-acepto")).focus();
      return;
    }
    error.hidden = true;
    const bloquesObra = pedido.filter((it) => it.obra).map((it) => {
      const o = obraPorId.get(it.obra);
      return lineasObra(o, calcularObra(o, it.o, it.d), it.d, "   ");
    });
    const lineasProd = pedido.filter((it) => !it.obra).map((it) => {
      const { nombre: n, variante, m2 } = datosItem(it);
      return `• ${it.q} × ${n}${variante ? " — " + variante : ""}${m2 ? ` (${m2})` : ""}`;
    });
    const texto = [
      "Hola Tereré Estudio, probé la demo de PRODIGIO Materiales y armé este pedido de prueba. Quiero una página como esta.",
      "",
      ...lineasProd,
      ...bloquesObra.flatMap((b, i) => (i > 0 || lineasProd.length ? ["", ...b] : b)),
      "",
      `Nombre: ${nombre}`,
      `Localidad: ${localidad}`,
      `Entrega: ${entrega}`,
      ...(comentario ? [`Comentario: ${comentario}`] : []),
      "",
      pedido.some((it) => it.obra) ? "(Pedido de prueba; materiales de obra estimados)" : "(Pedido de prueba armado en la demo)"
    ].join("\n");
    const url = waUrl(texto);
    // Enlace real dentro del gesto del usuario (más confiable que window.open en celulares)
    const a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
    document.body.appendChild(a); a.click(); a.remove();
    $("#abrir-wa").href = url;
    nota.hidden = false;
  });
  $("#vaciar").addEventListener("click", () => {
    pedido = []; guardar(); render();
    nota.hidden = true; form.reset();
    cerrar();
  });

  /* ---------- WhatsApp flotante: oculto en el hero, se eleva sobre barra y firma ---------- */
  const flotante = $("#wa-flotante");
  const firma = $(".firma-te");
  let firmaVisible = 0;
  function ubicarWa() {
    const barraAlto = barra.hidden || getComputedStyle(barra).display === "none" ? 0 : barra.offsetHeight;
    flotante.style.setProperty("bottom", `${16 + barraAlto + firmaVisible}px`);
  }
  if ("IntersectionObserver" in window) {
    // Oculto mientras se ve el hero (ya tiene su botón), el catálogo (no tapa "Agregar") o el footer (no tapa textos)
    const tapan = new Set();
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => { if (en.isIntersecting) tapan.add(en.target); else tapan.delete(en.target); });
      flotante.classList.toggle("oculto", tapan.size > 0);
    }, { threshold: 0, rootMargin: "-25% 0px -25% 0px" });
    obs.observe($(".hero"));
    obs.observe($("#catalogo"));
    if ($("#calculadora")) obs.observe($("#calculadora"));
    obs.observe($(".footer"));
    const medirFirma = () => {
      const r = firma.getBoundingClientRect();
      const barraAlto = barra.hidden || getComputedStyle(barra).display === "none" ? 0 : barra.offsetHeight;
      const limite = window.innerHeight - barraAlto;
      firmaVisible = r.top < limite ? Math.min(limite - r.top, r.height) : 0;
      ubicarWa();
    };
    window.addEventListener("scroll", medirFirma, { passive: true });
    window.addEventListener("resize", medirFirma);
  }

  /* ---------- Inicio ---------- */
  pedido = cargarLimpio();
  render();
  aplicar();
})();
