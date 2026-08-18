# Arquitectura CSS

Este directorio agrupa estilos por área estable de la interfaz, no por PR ni por corrección puntual.

## Regla principal

Antes de crear un archivo CSS nuevo, debe comprobarse si el cambio pertenece a un archivo existente. Un archivo nuevo sólo se justifica cuando representa un componente o una zona funcional con responsabilidad propia y duradera.

## Archivos actuales

- `../styles.css`: hoja global heredada. Se dividirá de forma gradual, sin reescrituras masivas.
- `attachments.css`: componente funcional de adjuntos.
- `waiting.css`: presentación específica del estado En espera.
- `task-interface.css`: barra contextual de tareas, distribución de los grupos laterales relacionados y adaptación de la vista principal en celular.
- `task-editor-desktop.css`: estructura y jerarquía visual específicas del editor de tareas en escritorio. No contiene reglas para celular.
- `task-editor-popovers.css`: contención y posicionamiento de los paneles flotantes del editor de escritorio para evitar desbordes del viewport.
- `task-editor-mobile.css`: distribución, jerarquía táctil y paneles secundarios del editor de tareas en celular. Está limitada a `max-width: 760px` y evoluciona de forma independiente de la geometría de escritorio.
- `themes/default.css`: capa explícita del tema predeterminado. Repite temporalmente los valores semánticos heredados de `styles.css` para permitir una migración gradual y sin cambios visuales.

## Temas visuales

Los componentes deben consumir variables CSS semánticas, como `--color-surface`, `--color-border` o `--color-accent`, en lugar de repetir colores concretos. Los temas reemplazan esos valores mediante `data-theme` en el elemento raíz, sin modificar la estructura, la jerarquía ni el comportamiento de los componentes.

El tema actual se declara como `data-theme="default"`. Mientras dure la migración, `styles.css` conserva los valores heredados como fallback y `themes/default.css` actúa como capa explícita del tema. Los nuevos temas deberán definir el mismo contrato de tokens y cargarse sin duplicar reglas de componentes.

La extracción de variables y la sustitución de colores concretos se hará de forma incremental. Esta consolidación no debe cambiar valores visuales ni el orden funcional de la cascada.

## Criterios de mantenimiento

1. Mantener juntos los estilos de escritorio y celular de un mismo componente cuando ambos pertenezcan a la misma etapa funcional. Un archivo limitado a una plataforma sólo se justifica cuando esa adaptación tiene arquitectura y evolución propias.
2. Evitar archivos de “parche” o de una sola PR.
3. Conservar el orden de las reglas cuando una hoja se consolida.
4. Incorporar pruebas cuando cambien rutas o archivos cargados por `index.html`.
5. No mover grandes bloques de `styles.css` sin una revisión visual específica.
6. Un tema nuevo debe redefinir tokens semánticos; no debe copiar selectores estructurales de los componentes.
