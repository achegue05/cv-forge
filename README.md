# CV Forge — diseñador de CV en formato Harvard

Editor web para crear, personalizar y descargar un CV en formato Harvard.

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
