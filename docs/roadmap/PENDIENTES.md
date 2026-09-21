# Pendientes de Task Engine V2

Este documento es la **fuente de verdad del backlog vigente** de Task Engine. Debe contener únicamente trabajo todavía no implementado, no verificado o deliberadamente postergado.

Última actualización: **21 de septiembre de 2026**.

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

## Otros pendientes confirmados

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
- Recuperación automática después del trabajo offline — PR #454 / #453: implementada y verificada.
- «Qué hago ahora» — PR #455 y #456 / #449: implementado y verificado.
- Reglas configurables de revisión — PR #457 / #448: implementadas y verificadas.
- Sincronización incremental y estabilización — PR #458, #468 y #469: **implementadas, desplegadas y verificadas durante varios días de uso real en escritorio y Android**. Los errores y reintentos se redujeron de forma muy significativa; no requieren nuevo desarrollo salvo regresión reproducible.
- Captura rápida PWA en Android — PR #460 y #461 / #446: implementada y verificada.
- Entrada local de tareas en lenguaje natural — PR #466 y #467 / #447: implementada y verificada sin asistencia de IA.
- Orden por vencimiento teniendo en cuenta la hora — #355: implementado y cubierto por pruebas; conserva vencidas primero y ordena las tareas de hoy con hora antes de las que no tienen hora.
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

- **PR #347 — Tema Retrofuturo** y **PR #396 — Tema Matrix:** ramas visuales abiertas. No tratarlas como prioridad funcional salvo decisión expresa de retomarlas o cerrarlas.

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
