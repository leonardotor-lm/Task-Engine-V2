# Pendientes de Task Engine V2

Este documento registra únicamente trabajo todavía no implementado, no verificado o deliberadamente postergado.
Los puntos terminados se documentan en las PR correspondientes, en `docs/decisions/DECISIONS.md` cuando fijan una decisión estable y en el historial de Git.

Última actualización: 10 de agosto de 2026.

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

### Estadísticas de proyectos y objetivos

- **Estado:** En desarrollo.
- Medir avance por tareas completadas sin convertirlo en un puntaje de productividad.
- Separar avance propio y acumulado en objetivos jerárquicos.
- Excluir elementos archivados o en Papelera y evitar el doble conteo.
- Mostrar pendientes, vencidas, pospuestas, ritmo reciente y último avance.
- Ofrecer períodos de 7, 30 y 90 días o todo el historial.

### Navegación y consistencia visual

- **Estado:** En desarrollo.
- Auditar escritorio y celular sin modificar funcionalidades.
- Mantener la planificación jerárquica en escritorio y una ejecución compacta en celular.
- Unificar la geometría de las acciones de encabezado en tareas, proyectos y objetivos.
- Evitar deformaciones de los breadcrumbs en jerarquías largas y conservar objetivos táctiles de 44 px.
- Mantener un orden explícito de la cascada entre los estilos generales, los editores y los espacios jerárquicos.

### Fecha de inicio y períodos

- **Estado:** Completado.
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
- Criterios de búsqueda incorporados: `inicio`, `inicioAntes`, `inicioDespues` y `tieneInicio`. `activaEn` queda como evaluación futura si surge una necesidad concreta.

## Prioridad futura

### Temas visuales

- **Estado:** Postergado.
- Preparar temas visuales intercambiables sin alterar el dominio.
- Mantener diferencias visuales claras entre área, contexto, etiqueta, prioridad y recurrencia.
- Preservar una interfaz compacta y sobria.

### Estadísticas

- **Estado:** Postergado.
- Incorporar estadísticas sólo después de definir el historial y disponer de información suficiente y estable.

## Bloques cerrados recientemente

Estos puntos ya no son pendientes y se conservan aquí sólo como referencia breve de cierre:

- **Historial de actividad:** registra acciones relevantes sobre tareas, resume las operaciones masivas, permite buscar y filtrar por categoría y se conserva en copias y sincronización. Los eventos técnicos de sincronización y la configuración administrativa quedan excluidos para evitar ruido.
- **Finalización asistida de proyectos:** al completar la última subtarea pendiente se ofrece completar el padre; la decisión siempre es explícita y no produce cascadas de diálogos en jerarquías anidadas.
- **Creación directa de subtareas:** PR #180 abre el editor completo desde Proyectos, conserva la herencia y las reglas de dominio y descarta borradores cancelados sin persistir tareas fantasma.
- **Accesibilidad y limpieza final:** foco, cierre de overlays, estados accesibles y navegación por teclado quedaron cubiertos en PR #175, #176 y #177; la pasada final verificó contraste, diálogos propios, adaptación a viewports extremos y áreas táctiles móviles de 44 px.
- **Persistencia de filtros y preferencias por vista:** el contrato de persistencia completo a través de Sheets y Apps Script quedó corregido y probado en PR #178, incluyendo compatibilidad con revisiones históricas y datos opcionales.
- **Detección y navegación de proyectos:** PR #179 unificó el criterio de descendencia visible para evitar proyectos falsos producidos por subtareas archivadas o en Papelera.
- **Adjuntos:** base de Drive en PR #156; interfaz, eliminación y búsqueda en PR #157; integración con los editores actuales verificada posteriormente.
- **Objetivos y subobjetivos:** dominio, sincronización, asociaciones, vistas y búsqueda completados en varias etapas; planificación jerárquica y breadcrumbs consolidados en PR #171.
- **Editor de tareas:** rediseño de escritorio en PR #166 y adaptación móvil en PR #167.
- **Orden y filtros por vista:** implementación original en PR #163, #164 y #170; persistencia backend completada posteriormente en PR #178.
- **Sincronización automática:** reconciliación y conservación del contexto estabilizadas en PR #165 y #170.
- **Navegación de proyectos:** breadcrumbs en PR #172 y restauración de filtros guardados de origen en PR #173.
- **Accesibilidad funcional:** cierre/foco de overlays en PR #175, estados ARIA en PR #176 y navegación por teclado en PR #177.
- **Referencia al padre de subtareas:** el editor muestra `Subtarea de:` y permite abrir el elemento padre aunque no esté en la lista filtrada actual.
- **Validación destructiva de Organización:** áreas, contextos y etiquetas en uso se bloquean antes de pedir confirmación de eliminación.
- **Calendario, En espera, fecha/hora, selección múltiple, diálogos propios, selector de color y reorganización visual principal:** implementados y fusionados.

## Mantenimiento del registro

Antes de iniciar un nuevo bloque de trabajo:

1. revisar este documento;
2. elegir un único objetivo principal;
3. crear una rama específica;
4. implementar y probar;
5. actualizar este registro en la misma PR;
6. fusionar mediante **Squash and merge** sólo después de la validación correspondiente.
