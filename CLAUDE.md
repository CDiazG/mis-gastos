# Cuentas Claras — cómo trabajamos

App web de gastos personales (multiusuario) hecha a partir del Excel de Loreto, la hermana de Carlos.
Carlos es el administrador. Se habla **siempre en español**, de tú, sin tecnicismos.

- Web publicada: https://cdiazg.github.io/mis-gastos/ (GitHub Pages, se despliega con GitHub Actions al subir a `main`).
- Firebase: proyecto `mis-gastos-66394` (Authentication + Firestore). Correo del administrador: carlosdiazgui@gmail.com.

## Publicar: solo cuando Carlos diga «publica»

- Todo se trabaja y se sube en la rama **`siguiente-version`** (subirla no publica nada).
- Al decir «publica»:
  `git checkout main && git pull --ff-only && git merge --ff-only siguiente-version && git push`,
  luego vigilar el despliegue con `gh run watch` y volver a `siguiente-version`.
- Nunca subir a `main` sin «publica». Al acabar cada cambio: commit y push a `siguiente-version`.
- Si cambia `firestore.rules`, darle a Carlos **las reglas completas** con `CORREO_DEL_ADMINISTRADOR` sustituido por su correo
  (en el repo se queda el marcador).

## Versiones

- `python3 herramientas/nueva-version.py X.Y.Z "novedad 1|novedad 2"` sube la versión (VERSION, CAMBIOS, version.json y los `?v=` de index.html).
- Las novedades separadas por `|` hay que partirlas en elementos del array de `CAMBIOS` en `js/version.js` (el script las deja en uno).
- Textos de novedades: para el usuario, sin jerga.

## Pruebas

- `fuser -k 8765/tcp; NODE_PATH=$(npm root -g) node tests/run.js [filtro]` (Playwright, 4 en paralelo, Firebase simulado en `tests/simulador`).
- Mientras se trabaja, pasar solo las del archivo afectado (`node tests/run.js uso`); la batería completa una vez antes del commit.
- Hay una prueba que recorre toda la guía de Rufo en móvil y ordenador y falla si el recuadro se tapa o se corta: si cambia la navegación, mirarla.
- Capturas solo cuando cambia algo visual importante (gastan mucho). Scripts de captura: Playwright con `tests/lib.js` (`nuevoContexto`, `crearAdminYEntrar`).

## Reglas que no se rompen

- **Nunca subir extractos reales** (nombres, IBAN, tarjetas). Las pruebas usan extractos inventados de `tests/extractos.js`.
- A los usuarios que ya usan la app **no se les cambia su configuración** (categorías, porcentajes, diezmo): las novedades de configuración son solo para cuentas nuevas; si hay que migrar algo, con una migración en `js/estado.js` (`S.mig`) que no toque sus datos sin avisar.
- El chat es **«con el administrador»**, nunca «con Carlos».
- Privacidad, siempre con sinceridad: el extracto se lee en el dispositivo; el administrador, como dueño de la base de datos, técnicamente podría ver los datos desde la consola de Firebase (está explicado en Ayuda → Privacidad).
- Respetar el interruptor «Animaciones» (clase `sinanim`) y `prefers-reduced-motion`.

## Estructura

- JS sin compilar, scripts clásicos con ámbito global, cargados en orden en `index.html` con `?v=VERSION`.
- Estado del usuario en `S` (`js/estado.js`), cálculos en `js/reglas.js` (`stats`, presupuesto en % o €, ahorro = lo que sobra, traspasos, saldos), categorías y reglas de serie en `js/categorias.js`.
- Navegación en `js/navegacion.js`: pestañas, barra inferior del móvil, apartados de Ajustes/Ayuda/Perfil (`data-ap`), pestañas internas del Histórico, botón atrás (historial), calendario de meses.
- Rufo (el zorro) y la guía en `js/ayuda.js` (`mascota(px, pose)`), chat en `js/chat.js`.
- Estilos en `css/estilos.css` con variables por paleta y modo oscuro.
