# Fluvi

Fluvi es un programa web para llevar los gastos personales: importa extractos en PDF (EVO y Revolut), clasifica los movimientos por categorías, apunta gastos en efectivo, compara con el presupuesto y exporta a Excel.

Cada persona entra con su correo y su contraseña y solo ve sus datos (Firebase Authentication + Firestore). Los PDF del banco se leen en el navegador y no se suben a ningún sitio; solo se guardan los movimientos.

## Puesta en marcha

1. **Firebase** (proyecto nuevo): activar *Authentication → Correo electrónico/contraseña*, crear *Firestore Database* y registrar una app web.
2. Pegar el bloque `firebaseConfig` en `js/config.js` (campo `firebase`).
3. Publicar las reglas de `firestore.rules` en *Firestore → Reglas*, poniendo el correo del administrador.
4. *Authentication → Configuración → Dominios autorizados*: añadir `cdiazg.github.io`.
5. **GitHub Pages**: *Settings → Pages → Deploy from a branch → main / (root)*.
6. El administrador abre la web, escribe su correo y una contraseña y pulsa «Crear cuenta de administrador». Tras verificar el correo, ya puede entrar y dar de alta usuarios en la pestaña *Usuarios*.

## Cómo está organizado

- `index.html`: la estructura de las pantallas.
- `css/estilos.css`: el aspecto.
- `js/`: el programa, en archivos por partes (se cargan en el orden de `index.html`; `arranque.js` va el último).
  - `version.js`: número de versión y lista de cambios.
  - `pdf.js` e `importar.js`: lectura de extractos.
  - `estado.js`: guardado en Firebase y sincronización entre dispositivos.
  - `acceso.js` y `usuarios.js`: entrada, solicitudes de acceso y administración.
- `tests/`: pruebas automáticas con un Firebase simulado y extractos inventados.
- `herramientas/nueva-version.py`: sube el número de versión en todos los sitios.

## Pruebas automáticas

`npm install && npx playwright install chromium && npm test` las ejecuta en local. En GitHub se ejecutan solas con cada cambio (pestaña *Actions*); si alguna falla, la web no se actualiza y se guardan capturas de pantalla del fallo.

## Publicar una versión nueva

Las versiones siguen el formato `mayor.menor.parche` (por ejemplo, 2.7.0 para una mejora y 2.7.1 para un arreglo pequeño).

1. `python3 herramientas/nueva-version.py 2.7.0 "Qué cambia" "Otro cambio"`.
2. `npm test`.
3. Subir los cambios a `main`. Si las pruebas pasan, GitHub publica la web; quien tenga el programa abierto verá «Hay una versión nueva».

## Créditos

Lectura de PDF con [PDF.js](https://mozilla.github.io/pdf.js/) (Apache 2.0, ver `lib/LICENSE-pdfjs.txt`).
