# PRODIGIO Materiales — proyecto conceptual de Tereré Estudio

Demostración del **Plan Catálogo**: catálogo de materiales de construcción con buscador, rubros y marcas, carrito que arma el pedido por WhatsApp, calculadora por m² y calculadora de obra. **Marca, productos y datos son ficticios.** Los botones de WhatsApp llegan a Tereré Estudio con el texto "Quiero una página como esta".

- `sitio/`: la web. En Netlify: Base directory `sitio`, sin build command.
- `herramientas/`: `productos.json` (catálogo y estándares de obra de ejemplo), `plantilla.html`, `build.py` (genera `sitio/index.html`) e `ilustraciones.py` (dibujos de productos en WebP).

Regenerar: `python3 herramientas/ilustraciones.py` (si cambian los dibujos) y `python3 herramientas/build.py`.

El sitio tiene `noindex` (meta y cabecera `X-Robots-Tag`) hasta que se decida publicarlo en el portfolio.
