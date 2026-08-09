# Pendientes de Task Engine V2

Este documento registra únicamente trabajo todavía no implementado, no verificado o deliberadamente postergado.
Los puntos terminados se documentan en las PR correspondientes, en `docs/decisions/DECISIONS.md` cuando fijan una decisión estable y en el historial de Git.

Última actualización: 9 de agosto de 2026.

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

### Fecha de inicio y períodos

- **Estado:** Pendiente; es el siguiente bloque funcional después del cierre de accesibilidad y limpieza de interfaz.
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

### Finalización asistida de proyectos

- **Estado:** Pendiente.
- Cuando se complete la última subtarea pendiente de una tarea que funciona como proyecto, preguntar si el usuario desea completar también la tarea padre.
- Aplicar el comportamiento en cualquier nivel jerárquico: si al completar una subtarea quedan completadas absolutamente todas las subtareas directas y descendientes relevantes de su padre, ofrecer completar ese padre.
- El diálogo debe permitir completar la tarea padre o conservarla en estado pendiente si el usuario prevé agregar nuevas subtareas posteriormente.
- No completar automáticamente el proyecto sin confirmación explícita del usuario.
- Definir cuidadosamente el encadenamiento cuando la finalización de un proyecto hijo deje también sin pendientes a un proyecto superior, evitando diálogos inesperados o cascadas ambiguas.
- Implementar este comportamiento en una PR separada de las correcciones de detección/navegación de proyectos.

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
