# Pendientes de Task Engine V2

Este documento registra únicamente trabajo todavía no implementado, no verificado o deliberadamente postergado.
Los puntos terminados se documentan en las PR correspondientes, en `docs/decisions/DECISIONS.md` cuando fijan una decisión estable y en el historial de Git.

Última actualización: 8 de agosto de 2026.

## Estados

- **Pendiente:** acordado, todavía no iniciado.
- **En desarrollo:** existe una rama o PR activa.
- **Postergado:** válido, pero fuera de la etapa actual.

## Principio de diseño de las vistas

- **Planificación:** Áreas, Proyectos y Objetivos muestran estructura, contexto, progreso y elementos que requieren revisión.
- **Ejecución:** Hoy y atrasadas, Próximas e Inbox priorizan acciones concretas y reducen ruido visual.
- Las funciones administrativas viven en editores o gestores específicos y no se duplican innecesariamente en las pantallas de seguimiento.
- La navegación jerárquica de Objetivos y Proyectos usa breadcrumbs como mecanismo principal.

## Prioridad actual

### Accesibilidad y limpieza final de interfaz

- **Estado:** Pendiente.
- Revisar navegación completa mediante teclado en escritorio y comportamiento equivalente en celular.
- Verificar orden de foco al abrir y cerrar editores, diálogos, popovers y gestores.
- Asegurar que `Escape` cierre únicamente la capa activa y devuelva el foco al control que la abrió cuando corresponda.
- Revisar `aria-label`, `aria-expanded`, `aria-current`, nombres accesibles y títulos de botones con sólo ícono.
- Comprobar que los controles interactivos tengan foco visible y áreas táctiles suficientes.
- Auditar contraste de texto, estados deshabilitados, indicadores de selección y estado de sincronización.
- Revisar estados vacíos y mensajes de error para que sean comprensibles sin depender sólo de color o posición.
- Probar anchos extremos de escritorio y celular para detectar desbordes, superposiciones y controles fuera del viewport.
- Auditar confirmaciones y diálogos restantes para eliminar cualquier dependencia innecesaria de ventanas nativas del navegador.
- Eliminar CSS, selectores, listeners o ramas de compatibilidad que hayan quedado obsoletos después de los rediseños recientes.
- Revisar inconsistencias visuales entre la lista principal, Objetivos, Proyectos, editores y gestores de Organización.
- Mantener la estética Flat 2.0 y el criterio de reducir ruido sin retirar capacidades.

### Referencia al elemento padre en subtareas

- **Estado:** Pendiente.
- Mostrar en el editor la leyenda **Subtarea de:** seguida por el título de la tarea o proyecto padre.
- Permitir abrir desde esa referencia el elemento padre aunque no esté visible por los filtros actuales.
- Mantener las acciones de mover o convertir en tarea principal dentro de Organización, sin duplicarlas junto a la referencia.

### Validación previa al eliminar elementos de Organización

- **Estado:** Pendiente de auditoría.
- Comprobar si un área, contexto o etiqueta está en uso antes de pedir confirmación de eliminación.
- Cuando la eliminación no sea válida, bloquearla y explicar el motivo antes de mostrar un diálogo destructivo.
- Confirmar durante la auditoría si alguna parte de este comportamiento ya quedó cubierta por cambios posteriores.

## Siguiente bloque funcional

### Fecha de inicio y períodos

- **Estado:** Postergado hasta terminar accesibilidad y limpieza.
- Incorporar una propiedad opcional `startDate` independiente de la fecha límite.
- Permitir fecha de inicio sin fecha límite; en ese caso la tarea pasa a estar disponible desde esa fecha pero no vence.
- Si existen inicio y vencimiento, exigir `startDate <= dueDate`.
- Habilitar fecha de inicio solamente en tareas no recurrentes.
- Impedir activar recurrencia mientras exista fecha de inicio y pedir que se quite primero, sin borrarla silenciosamente.
- Ocultar o deshabilitar el campo de inicio al editar una tarea recurrente.
- Antes de la fecha de inicio, mantener la tarea fuera de las listas de ejecución; desde el inicio, mostrarla como disponible hasta completarla o vencer.
- En calendario, representar la tarea en todos los días comprendidos entre inicio y vencimiento, incluidos ambos extremos.
- Mantener ocultas las tareas en espera aunque haya comenzado su período.
- Integrar el dato con dominio, persistencia local, Apps Script, sincronización, copias, editor, orden, filtros, búsqueda avanzada y pruebas.
- Incorporar criterios de búsqueda como `inicio`, `inicioAntes`, `inicioDespues` y `tieneInicio`; evaluar además `activaEn`.

## Prioridad futura

### Temas visuales

- **Estado:** Postergado.
- Preparar temas visuales intercambiables sin alterar el dominio.
- Mantener diferencias visuales claras entre área, contexto, etiqueta, prioridad y recurrencia.
- Preservar una interfaz compacta y sobria.

### Historial

- **Estado:** Postergado.
- Diseñar un historial útil de cambios y acciones una vez estabilizado el modelo funcional.
- Definir qué eventos merecen persistirse antes de agregar una interfaz de consulta.

### Estadísticas

- **Estado:** Postergado.
- Incorporar estadísticas sólo después de definir el historial y disponer de información suficiente y estable.

## Bloques cerrados recientemente

Estos puntos ya no son pendientes y se conservan aquí sólo como referencia breve de cierre:

- **Adjuntos:** base de Drive en PR #156; interfaz, eliminación y búsqueda en PR #157; integración con los editores actuales verificada posteriormente.
- **Objetivos y subobjetivos:** dominio, sincronización, asociaciones, vistas y búsqueda completados en varias etapas; planificación jerárquica y breadcrumbs consolidados en PR #171.
- **Editor de tareas:** rediseño de escritorio en PR #166 y adaptación móvil en PR #167.
- **Orden y filtros por vista:** persistencia y sincronización completadas en PR #163, #164 y #170.
- **Sincronización automática:** reconciliación y conservación del contexto estabilizadas en PR #165 y #170.
- **Navegación de proyectos:** breadcrumbs en PR #172 y restauración de filtros guardados de origen en PR #173.
- **Calendario, En espera, fecha/hora, selección múltiple, diálogos propios, selector de color y reorganización visual principal:** implementados y fusionados.

## Mantenimiento del registro

Antes de iniciar un nuevo bloque de trabajo:

1. revisar este documento;
2. elegir un único objetivo principal;
3. crear una rama específica;
4. implementar y probar;
5. actualizar este registro en la misma PR;
6. fusionar mediante **Squash and merge** sólo después de la validación correspondiente.
