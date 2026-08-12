# CV Forge — diseñador de CV en formato Harvard

Editor web para crear, personalizar y descargar un CV en formato Harvard. Corre entero en el navegador: no hay servidor, no hay cuentas y los datos nunca salen del equipo de quien lo usa.

Pensado para publicarse gratis en GitHub Pages y compartirse con un enlace.

---

## Qué incluye

**Editor de contenido**
- Encabezado con nombre, lista de datos de contacto y línea extra.
- Cuatro tipos de sección combinables:
  - **Entradas** — experiencia, educación, proyectos: título, columna derecha, subtítulos ilimitados, párrafo y viñetas.
  - **Filas etiqueta/valor** — habilidades, idiomas, herramientas.
  - **Lista** — certificaciones, publicaciones, premios.
  - **Párrafo** — perfil o resumen profesional.
- Reordenar, duplicar, ocultar y eliminar secciones y entradas.
- Formato en línea con `**negrita**` y `*cursiva*` en cualquier campo.

**Personalización** (bastante más de lo que permite FlowCV)
- Hoja Carta o A4 y los cuatro márgenes independientes, en milímetros.
- 14 tipografías, tamaño con precisión de 0.1 px, interlineado, espaciado entre letras, texto justificado o alineado a la izquierda.
- Encabezado: alineación, tamaño, grosor, mayúsculas, tracking y color del nombre; tamaño del contacto; separador configurable; línea inferior opcional.
- Títulos de sección: tamaño, grosor, mayúsculas, tracking, alineación, color, y línea con grosor, estilo y separaciones propias.
- Espaciados independientes entre secciones, entradas y viñetas; carácter de viñeta; sangría; ancho de etiquetas.
- Colores de texto, fondo, líneas, títulos y nombre.
- Secciones a una o dos columnas.
- 6 presets: Harvard clásico, Serif moderno, Sans limpio, Compacto, Editorial y Técnico/ATS.
- **Ajustar a 1 página**: reduce tipografía y espaciados hasta que el contenido quepa.

**Salida**
- PDF por el diálogo de impresión, con márgenes reales de `@page` y control de cortes de página.
- HTML independiente descargable.
- Archivo `.json` para guardar y retomar el CV después.
- Guardado automático en el navegador.

---

## Estructura de archivos

```
cv-forge/
├── index.html          ← página principal
├── assets/
│   ├── app.css         ← interfaz del editor
│   ├── cv.css          ← estilos del documento (también se incrusta al exportar)
│   └── app.js          ← toda la lógica
├── .nojekyll           ← evita que GitHub procese el sitio con Jekyll
├── LICENSE
└── README.md
```

Respeta esa estructura: `index.html` busca los archivos en `assets/`.

---

## Publicarlo en GitHub Pages

### Opción A — desde la web de GitHub (sin instalar nada)

**1. Crea el repositorio**

Entra a [github.com/new](https://github.com/new).

- *Repository name*: `cv-forge` (o el nombre que quieras; será parte de la URL).
- Visibilidad: **Public**. GitHub Pages gratuito necesita repositorio público.
- No marques «Add a README file»: ya hay uno en los archivos.
- Clic en **Create repository**.

**2. Sube los archivos**

En la página del repositorio recién creado, clic en **uploading an existing file**.

- Arrastra `index.html`, `README.md`, `LICENSE`, `.nojekyll` **y la carpeta `assets` completa**. Arrastrar la carpeta conserva la ruta `assets/app.js`; si tu navegador no permite arrastrar carpetas, sube primero los archivos sueltos y luego usa **Add file › Create new file**, escribe `assets/app.css` en el nombre (la barra crea la carpeta) y pega el contenido. Repite con `assets/cv.css` y `assets/app.js`.
- Abajo, en *Commit changes*, escribe `Primera versión` y clic en **Commit changes**.

Verifica que en la raíz aparezcan `index.html` y una carpeta `assets` con tres archivos dentro.

**3. Activa GitHub Pages**

- **Settings** (arriba a la derecha, en el repositorio) › en el menú lateral, **Pages**.
- En *Source*, elige **Deploy from a branch**.
- En *Branch*, elige `main` y carpeta `/ (root)`. Clic en **Save**.

**4. Espera y abre tu sitio**

Entre 1 y 3 minutos. Recarga la página de *Pages* y aparecerá el enlace:

```
https://TU-USUARIO.github.io/cv-forge/
```

Esa es la URL que compartes. Puedes seguir el avance del despliegue en la pestaña **Actions**.

### Opción B — desde la terminal con Git

```bash
# dentro de la carpeta cv-forge
git init
git add .
git commit -m "Primera versión"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/cv-forge.git
git push -u origin main
```

Luego activa Pages igual que en el paso 3 de la opción A.

### Si quieres que la URL sea `https://TU-USUARIO.github.io/` (sin sufijo)

Nombra el repositorio exactamente `TU-USUARIO.github.io`. El resto es idéntico.

### Dominio propio (opcional)

En **Settings › Pages › Custom domain** escribe tu dominio y guarda. Después, en tu proveedor de dominio crea un registro `CNAME` que apunte de `www` a `TU-USUARIO.github.io`. Deja marcada la casilla **Enforce HTTPS** cuando GitHub la habilite.

---

## Actualizar el sitio

**Desde la web**: abre el archivo en GitHub, clic en el lápiz, edita y haz *Commit changes*. Pages vuelve a desplegar solo.

**Desde la terminal**:

```bash
git add .
git commit -m "Ajustes de diseño"
git push
```

Si no ves los cambios, es la caché del navegador: recarga con `Ctrl + F5` (o `Cmd + Shift + R`).

---

## Probarlo en tu computadora antes de subirlo

Abrir `index.html` con doble clic funciona para casi todo, pero el navegador bloquea `fetch` en `file://` y la función **Descargar HTML** puede fallar. Para probarlo tal como se verá publicado, levanta un servidor local:

```bash
cd cv-forge
python3 -m http.server 8000
# abre http://localhost:8000
```

o, si tienes Node:

```bash
npx serve .
```

---

## Personalizar el proyecto antes de compartirlo

| Qué cambiar | Dónde |
|---|---|
| Título de la pestaña y descripción | `index.html`, etiquetas `<title>` y `<meta name="description">` |
| Nombre de la herramienta | `index.html`, bloque `.brand` |
| Colores de la interfaz | `assets/app.css`, variables de `:root` |
| CV de ejemplo que se carga al inicio | `assets/app.js`, función `EXAMPLE()` |
| Valores de diseño por defecto | `assets/app.js`, objeto `DEFAULT_DESIGN` |
| Presets | `assets/app.js`, arreglo `PRESETS` |
| Tipografías disponibles | `assets/app.js`, arreglo `FONTS`, más el `<link>` de Google Fonts en `index.html` |

Para añadir una tipografía: agrégala al `<link>` de Google Fonts en `index.html` y añade una pareja `['"Nombre", serif', "Nombre"]` a `FONTS`.

---

## Exportar el PDF con buen resultado

1. Botón **Descargar PDF** (o `Ctrl/Cmd + P`).
2. Destino: **Guardar como PDF**.
3. Márgenes: **Predeterminado** o **Ninguno**. Los márgenes reales ya vienen del diseño.
4. Desmarca **Encabezados y pies de página**.
5. Marca **Gráficos de fondo** solo si cambiaste el color de fondo de la hoja.

Chrome y Edge dan el resultado más fiel. En Firefox y Safari el corte de página puede variar un poco.

---

## Preguntas frecuentes

**¿Dónde se guardan los datos?**
En `localStorage`, dentro del navegador de cada persona. Nadie más los ve, ni tú como dueño del repositorio. Si alguien borra los datos de navegación, pierde el CV: por eso existe **Guardar archivo**.

**¿Funciona en el celular?**
Sí, el editor se adapta. Aun así, para maquetar y exportar el PDF conviene una pantalla grande.

**Subí todo pero se ve sin estilos.**
La carpeta `assets` no quedó en la raíz o los archivos se subieron sueltos. Comprueba que la ruta sea `assets/app.css` y no `app.css`.

**Pages dice 404.**
Casi siempre es que `index.html` no está en la raíz del repositorio, o que en *Settings › Pages* la carpeta elegida no es `/ (root)`. También puede ser que aún no termine el primer despliegue.

**Las tipografías se ven distintas al imprimir.**
Las de Google Fonts necesitan conexión. Sin internet, el navegador usa la de reserva. Times New Roman, Georgia, Arial y Verdana funcionan siempre porque están instaladas en el sistema.

**¿Pasa los filtros ATS?**
El diseño cumple lo importante: una sola columna, texto real, títulos estándar y tipografías comunes. Si el puesto te preocupa, usa el preset **Técnico / ATS**, mantén márgenes de 12 mm o más y no bajes el texto de 10 px.

---

## Licencia

MIT. Puedes usarlo, modificarlo y redistribuirlo, incluso con fines comerciales, conservando el aviso de licencia.
