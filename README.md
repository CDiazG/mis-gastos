# Mis gastos

Programa web para llevar los gastos personales: importa extractos en PDF (EVO y Revolut), clasifica los movimientos por categorías, apunta gastos en efectivo, compara con el presupuesto y exporta a Excel.

Cada persona entra con su correo y su contraseña y solo ve sus datos (Firebase Authentication + Firestore). Los PDF del banco se leen en el navegador y no se suben a ningún sitio; solo se guardan los movimientos.

## Puesta en marcha

1. **Firebase** (proyecto nuevo): activar *Authentication → Correo electrónico/contraseña*, crear *Firestore Database* y registrar una app web.
2. Pegar el bloque `firebaseConfig` en `js/config.js` (campo `firebase`).
3. Publicar las reglas de `firestore.rules` en *Firestore → Reglas*, poniendo el correo del administrador.
4. *Authentication → Configuración → Dominios autorizados*: añadir `cdiazg.github.io`.
5. **GitHub Pages**: *Settings → Pages → Deploy from a branch → main / (root)*.
6. El administrador abre la web, escribe su correo y una contraseña y pulsa «Crear cuenta de administrador». Tras verificar el correo, ya puede entrar y dar de alta usuarios en la pestaña *Usuarios*.

## Publicar una versión nueva

Las versiones siguen el formato `mayor.menor.parche` (por ejemplo, 2.1.0 para una mejora y 2.1.1 para un arreglo pequeño).

1. Cambiar `VERSION` y añadir la entrada en `CAMBIOS` dentro de `index.html`.
2. Poner el mismo número en `version.json`.
3. Subir los cambios a `main`. Quien tenga el programa abierto verá el aviso «Hay una versión nueva»; al abrirlo de nuevo ya carga la última.

## Créditos

Lectura de PDF con [PDF.js](https://mozilla.github.io/pdf.js/) (Apache 2.0, ver `lib/LICENSE-pdfjs.txt`).
