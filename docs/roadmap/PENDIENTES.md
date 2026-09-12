# Pendientes de Task Engine V2

Este documento es la **fuente de verdad del backlog vigente** de Task Engine. Debe contener únicamente trabajo todavía no implementado, no verificado o deliberadamente postergado.

Última actualización: **10 de septiembre de 2026**.

## Regla obligatoria de lectura

Antes de responder qué queda pendiente, planificar trabajo o reconstruir un backlog:

1. leer este archivo;
2. contrastar cada punto con los issues abiertos y las PR activas/fusionadas;
3. si un issue está cerrado como completado o una PR ya fue fusionada y verificada, no presentarlo como pendiente;
4. si hay conflicto entre conversaciones, memoria y GitHub, **prevalece el estado actual del repositorio**;
5. no reconstruir pendientes únicamente desde memoria o conversaciones históricas;
6. actualizar este archivo en la misma PR que cierre, agregue o cambie sustancialmente un pendiente.

Las capacidades terminadas se documentan en `docs/roadmap/ROADMAP.md`, decisiones estables y el historial de Git.

## Estados

- **Pendiente:** trabajo acordado, todavía no iniciado.
- **En desarrollo:** existe una rama o PR activa.
- **Pendiente de verificación:** implementación realizada que necesita validación operativa.
- **Operativo:** no requiere desarrollo nuevo, pero falta configuración o puesta en marcha.
- **Evaluación:** mejora válida cuyo diseño técnico todavía debe decidirse.

## Mejoras funcionales aprobadas — 10/09/2026

### Recuperación automática después del trabajo offline — #453

- **Estado:** en desarrollo.
- Distinguir **Sin conexión** de los errores reales del servicio.
- Conservar los cambios locales pendientes y reintentar automáticamente al volver internet.
- Aplicar reintentos graduales si Apps Script todavía no está accesible al producirse el evento de reconexión.
- No cerrar editores ni formularios activos y no sobrescribir conflictos reales.
- Mantener la reconciliación, las acciones manuales y el modelo de datos existentes.

### Captura rápida PWA en Android — #446

- **Estado:** pendiente de verificación.
- Web Share Target y shortcuts para Nueva tarea, Inbox y Hoy implementados en la PWA.
- La captura abre un borrador normal en Inbox con título, notas y enlace precargados, sin guardar automáticamente.
- Verificar en Android real que Task Engine aparezca en Compartir y que los accesos rápidos funcionen desde el ícono instalado.
- Confirmar si Android actualiza el manifiesto existente o exige reinstalar la PWA para registrar estas capacidades.

### Entrada de tareas con lenguaje natural — #447

- **Estado:** pendiente.
- Permitir expresiones breves como `Pagar seguro del auto el viernes prioridad alta #trámites`.
- Interpretar únicamente metadatos suficientemente claros: fecha, hora, prioridad, etiquetas y organización simple.
- No inventar datos ausentes y mostrar el resultado interpretado cuando exista ambigüedad relevante.
- Mantener siempre disponible el editor tradicional.

### Reglas y automatizaciones — #448

- **Estado:** pendiente.
- Crear reglas simples y transparentes que ayuden a detectar tareas estancadas o mal procesadas.
- Casos iniciales: tareas sin fecha durante demasiado tiempo, posposiciones reiteradas, vencidas sin resolver y tareas fuera de Inbox que quedan sin fecha ni proyecto claro.
- Priorizar avisos/sugerencias antes que modificaciones automáticas.
- Cada regla debe poder configurarse o desactivarse.
- No realizar cambios silenciosos sobre las tareas.

### «Qué hago ahora» — #449

- **Estado:** pendiente.
- Ofrecer una selección breve, idealmente 3–5 tareas, como próximas acciones razonables.
- Considerar prioridad, vencimiento, atraso, inicio, contexto, área, etiquetas, proyecto/objetivo, posposiciones, En espera y recurrencia cuando corresponda.
- Explicar brevemente por qué se sugieren.
- No modificar tareas automáticamente.
- Debe ser una ayuda de decisión, no una nueva estructura obligatoria.

## Otros pendientes confirmados

### Orden por vencimiento teniendo en cuenta la hora — #355

- **Estado:** pendiente; prioridad media.
- Orden esperado: vencidas → hoy con hora en orden cronológico → hoy sin hora → resto según comportamiento vigente.

### Formato 24 h en selectores de hora — #356

- **Estado:** evaluación; prioridad baja.
- Auditar controles de hora y buscar una presentación consistente `00:00–23:59` en Android y escritorio.
- No reemplazar controles nativos salvo que sea necesario.

### Validar rotación móvil con borrador abierto — #388

- **Estado:** pendiente de verificación; prioridad baja.
- Probar en Android real vertical → horizontal → vertical con cambios sin guardar.
- Cerrar sin cambios de código si no aparece una regresión reproducible.

### Configurar Notion para el segundo usuario — #280

- **Estado:** operativo.
- Conectar su cuenta/base de Notion.
- Verificar creación, apertura y desvinculación de notas.
- Confirmar aislamiento respecto del primer usuario.

## Capacidades que no deben volver al backlog sin una regresión concreta

- Integración GPT ↔ Task Engine — PR #444: **reparada, desplegada y verificada con consultas reales**.
- Mantenimiento automático y respaldos en Google Drive — PR #451 / #445: **desplegado, activado y verificado con respaldo real el 10 de septiembre de 2026**.
- Recordatorios móviles unidireccionales con Google Calendar — #343: **completado y cerrado**.
- Adjuntos en Google Drive: terminado.
- Tareas En espera: terminado.
- Calendario: terminado.
- Objetivos y subobjetivos: implementación principal terminada.
- Proyectos y navegación jerárquica: terminados.
- Duplicación de subtareas conservando jerarquía: terminada.
- Filtros rápidos y orden de Objetivos: terminados.
- Orden manual por arrastre en escritorio y móvil: terminado.
- Aviso de completar y deshacer contextual: terminado.
- Cierre automático de barra lateral móvil: terminado.
- Sincronización y recuperación de conflictos: implementadas.
- Proyectos anclados y sincronización cross-device: implementados.
- PWA instalable y funcionamiento sin conexión: implementados y verificados.
- Historial de actividad: implementado.
- Estadísticas, incluidos períodos de 6 y 12 meses: implementadas.
- Integración general con Notion: terminada; #280 es sólo puesta en marcha del segundo usuario.
- Compactación segura y mantenimiento diario básico de la base: implementados en PR #423; #445 cubre la segunda etapa integral.

## PR abiertas que no constituyen por sí solas backlog funcional

- **PR #396 — Tema Matrix:** rama visual abierta. No tratarla como prioridad funcional salvo decisión expresa de retomarla o cerrarla.

## Principios de planificación

- Priorizar confiabilidad y reducción de carga cognitiva por encima de sumar funciones.
- Planificación: Áreas, Proyectos y Objetivos muestran estructura, contexto y progreso.
- Ejecución: Hoy y atrasadas, Próximas e Inbox priorizan acciones concretas y reducen ruido visual.
- Las funciones administrativas viven en editores o gestores específicos y no se duplican innecesariamente.
- Objetivos y Proyectos usan breadcrumbs como navegación jerárquica principal.

## Mantenimiento del registro

Cuando se inicia o termina trabajo:

1. revisar este documento y los issues/PR vigentes;
2. trabajar en una rama específica desde `main` actualizado;
3. implementar y probar;
4. actualizar este registro si cambia el estado del backlog;
5. mover lo terminado al roadmap o documentación estable cuando corresponda;
6. fusionar sólo después de la validación y autorización correspondiente.
