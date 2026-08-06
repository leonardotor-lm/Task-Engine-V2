# Arquitectura CSS

Este directorio agrupa estilos por área estable de la interfaz, no por PR ni por corrección puntual.

## Regla principal

Antes de crear un archivo CSS nuevo, debe comprobarse si el cambio pertenece a un archivo existente. Un archivo nuevo sólo se justifica cuando representa un componente o una zona funcional con responsabilidad propia y duradera.

## Archivos actuales

- `../styles.css`: hoja global heredada. Se dividirá de forma gradual, sin reescrituras masivas.
- `task-interface.css`: barra contextual de tareas, distribución de los grupos laterales relacionados y adaptación de la vista principal en celular.
- `task-editor-desktop.css`: estructura y jerarquía visual específicas del editor de tareas en escritorio. No contiene reglas para celular.
- `../attachments.css`: componente funcional de adjuntos.
- `../waiting.css`: presentación específica del estado En espera.

## Temas visuales

Los componentes deben consumir variables CSS semánticas, como `--color-surface`, `--color-border` o `--color-accent`, en lugar de repetir colores concretos. Los futuros temas deberán reemplazar esos valores sin modificar la estructura, la jerarquía ni el comportamiento de los componentes.

La extracción de las variables del tema predeterminado se hará de forma incremental. Esta consolidación no cambia valores visuales ni el orden de la cascada.

## Criterios de mantenimiento

1. Mantener juntos los estilos de escritorio y celular de un mismo componente cuando ambos pertenezcan a la misma etapa funcional. Un archivo limitado a una plataforma sólo se justifica cuando esa adaptación tiene arquitectura y evolución propias.
2. Evitar archivos de “parche” o de una sola PR.
3. Conservar el orden de las reglas cuando una hoja se consolida.
4. Incorporar pruebas cuando cambien rutas o archivos cargados por `index.html`.
5. No mover grandes bloques de `styles.css` sin una revisión visual específica.
