# Pendientes de Task Engine V2

Este documento es la fuente de verdad del trabajo todavía no implementado, no verificado o deliberadamente postergado. Las funciones terminadas se registran en `docs/roadmap/ROADMAP.md`, en las decisiones estables y en el historial de Git.

Última actualización: 24 de agosto de 2026.

## Regla de lectura

Antes de reconstruir una lista de pendientes desde conversaciones, notas históricas o memoria, debe consultarse primero este documento y contrastarse con `docs/roadmap/ROADMAP.md`, los issues vigentes y las PR fusionadas. Una capacidad incluida en **Capacidades auditadas y cerradas** no vuelve al backlog salvo que exista un defecto concreto, una regresión reproducible o una nueva mejora expresamente aprobada.

## Estados

- **Pendiente:** trabajo acordado, todavía no iniciado.
- **En desarrollo:** existe una rama o PR activa.
- **Pendiente de verificación:** implementación fusionada cuyo comportamiento operativo todavía debe validarse.
- **Postergado:** trabajo válido, pero fuera de la etapa actual.
- **Propuesta:** mejora identificada que aún requiere una decisión antes de entrar al backlog.

## Prioridad actual

La próxima mejora funcional aprobada es:

### Recordatorios móviles con Google Calendar — #343

- **Estado:** pendiente de implementación.
- Integración unidireccional desde Task Engine hacia un calendario independiente llamado **Task Engine — Recordatorios**.
- Un único recordatorio por tarea, que requiere fecha y hora de vencimiento.
- Anticipaciones disponibles: 5, 15 y 30 minutos; 1 hora; 1, 2, 5 y 10 días.
- Crear, actualizar o retirar el evento según el ciclo de vida de la tarea, sin importar cambios manuales realizados en Calendar.
- Mantener las escrituras locales independientes de fallos de Calendar mediante operaciones persistentes, reintentables e idempotentes.
- Usar la configuración de notificaciones de Google Calendar para que los avisos se emitan únicamente en el celular elegido.

El issue abierto de puesta en marcha separado del desarrollo es:

### Configurar Notion para el segundo usuario — #280

- **Estado:** pendiente operativo; no requiere desarrollar nuevamente la integración.
- Conectar la cuenta de Notion del segundo usuario.
- Seleccionar/configurar su base contenedora de notas.
- Verificar creación, apertura y desvinculación de notas.
- Verificar aislamiento respecto de la cuenta y las notas del primer usuario.
- Comprobar actualización de estado de las notas vinculadas.

## Backlog aprobado

- **#343 — Recordatorios móviles unidireccionales con Google Calendar.**

No hay otras mejoras funcionales aprobadas pendientes de implementación.

## Capacidades auditadas y cerradas

La auditoría iniciada el 19 de agosto de 2026 y actualizada el 24 de agosto contrastó `PENDIENTES.md`, `ROADMAP.md`, documentos específicos, issues y PRs fusionadas. Los siguientes bloques **no son pendientes**:

- **Temas visuales intercambiables:** infraestructura, selector, persistencia local y conjunto de temas implementados y revisados; issue #250 cerrado. La PR #256 **Muestrario** continúa abierta en borrador y no forma parte del conjunto aprobado actual. La PR #262 **Oliva** fue cerrada sin fusionar.
- **Agrupación visual de tareas:** resuelta en PR #316 / issue #315. Permite `Sin agrupar`, `Área`, `Contexto` y `Proyecto`, con persistencia local por vista, grupos `Sin…` y manejo jerárquico de subtareas al agrupar por contexto.
- **Asistencia con IA:** alcance paraguas de #281 auditado y cerrado el 24 de agosto. Incluye configuración opcional y segura, Gemini/Groq, consultas de sólo lectura, chat de sesión, propuestas y aplicación confirmada de prioridades, fechas, En espera y organización, conversión en proyectos/subtareas, revisión de calidad y conversión de texto libre en tareas (#284–#306, #311 y #313). Las API keys permanecen en propiedades de Apps Script y nunca se envían al navegador.
- **Integridad transaccional y sincronización:** auditoría cerrada mediante issues #318, #320, #323, #325, #327, #329, #331, #333, #335, #337 y #339, resueltos en las PR #319, #321, #324, #326, #328, #330, #332, #334, #336, #338 y #340. Las escrituras compuestas de tareas, objetivos, organización, IA, recurrencias, importaciones, preferencias y estado de sincronización restauran el estado previo ante fallos; los pushes de resultado incierto se reconcilian antes de sobrescribir la nube.
- **Selección múltiple: limpiar fecha:** resuelta en PR #266. La acción limpia `dueDate` y `dueTime`, conserva `startDate` y bloquea de forma segura selecciones que incluyan recurrencias.
- **Recurrencias: ciclo de vida único y reglas avanzadas:** resueltas en PR #267. Cada serie mantiene una sola ocurrencia activa; la siguiente se genera al completar la actual. Se conservan intervalos cada N días/semanas/meses y selección de varios días semanales, y se agregan reglas de primer a quinto y último día hábil mensual. Para esta versión, día hábil significa lunes a viernes sin feriados.
- **Búsqueda avanzada: resultados jerárquicos estrictos:** resuelta en PR #268. Sólo se muestran las tareas que cumplen directamente la expresión; una subtarea coincidente puede aparecer aislada manteniendo visible su ruta jerárquica sin convertir a sus ancestros en resultados.
- **Adjuntos en Google Drive:** terminado; PR #156–#157 y consolidación en editores #166–#167. `docs/roadmap/ADJUNTOS.md` lo registra como terminado.
- **Tareas En espera:** implementadas mediante `isWaiting`, con vista propia, reglas de visibilidad, edición y búsqueda avanzada. `docs/roadmap/EN_ESPERA.md` describe el comportamiento vigente.
- **Fecha de inicio y períodos:** PR #183–#186 y búsqueda `activaEn` en #193.
- **Calendario:** vista y detalle diario implementados; además representa períodos entre inicio y vencimiento (#186).
- **Objetivos y subobjetivos:** dominio, navegación, creación de tareas desde objetivos, breadcrumbs, visibilidad de completadas, herencia, filtros y orden están implementados (#171, #207, #214, #222–#224).
- **Proyectos:** vista global, identidad persistente, navegación jerárquica, progreso, alta desde proyecto y búsqueda avanzada están implementados (#172–#173, #188, #209, #215–#216, #225).
- **Duplicación de subtareas conservando jerarquía:** resuelta en PR #211.
- **Filtros rápidos y orden en Objetivos:** resueltos en PR #224.
- **Búsqueda avanzada por proyectos:** resuelta en PR #225.
- **Atajos de teclado de acción:** `Alt+N`, `Alt+B` y `Alt+C`, PR #227; la navegación por teclado general ya existía desde #177.
- **Orden manual por arrastre en escritorio y celular:** implementado y estabilizado en #228 y #231–#238.
- **Aviso de completar + deshacer contextual en escritorio y celular:** PR #217. No existe ni se desea un sistema general de deshacer.
- **Homogeneidad visual de diálogos, popovers y superficies transitorias:** consolidada en PR #220 y refinamientos posteriores.
- **Cierre automático de la barra lateral móvil al navegar:** corregido y verificado en PR #206.
- **Persistencia cross-device del título lateral personalizado:** implementada en PR #205; el tema visual, en cambio, es local por dispositivo por decisión de #257.
- **Sincronización y recuperación de conflictos:** reconciliación automática, continuidad de interacción, recuperación manual y estabilización del orden están implementadas (#165, #170, #178, #199, #202–#203, #213, #235).
- **PWA instalable y funcionamiento sin conexión:** implementados y verificados (#194, #200–#204).
- **Historial de actividad y estadísticas:** implementados (#189 y #191), incluidos períodos de 6 y 12 meses.
- **Integración con Notion:** conexión, tareas/proyectos, objetivos, actualización de metadatos, cola de reintentos, diagnóstico, aislamiento por instalación y revisión móvil están cerrados en #240–#248. El issue #280 es únicamente la configuración operativa de la segunda cuenta.
- **Señales y flujos de interacción de tareas:** PR #342. Incluye indicador de nota de Notion, selector de etiquetas estable al agregar y quitar, revisión o eliminación transaccional de etiquetas asociadas, cierre automático del aviso de tarea completada, ocultamiento de IA desactivada y nombre de aplicación compartido por barra lateral y encabezado.
- **Diagnóstico y rendimiento de la sincronización general:** PR #342. El error muestra un detalle seguro y una acción explícita de reintento; la aplicación reintenta al recuperar foco o visibilidad. Apps Script carga únicamente la revisión activa desde el final de la hoja en vez de transferir todo el historial acumulado.

Estos bloques sólo deben volver a aparecer si se describe una regresión o una mejora nueva y concreta sobre la capacidad ya existente.

## Propuestas pendientes de decisión

No hay actualmente propuestas documentadas que requieran una decisión.

## Ideas que no integran el backlog

Las siguientes cuestiones fueron exploradas, pero no constituyen trabajo comprometido:

- múltiples usuarios o una segunda instancia de la aplicación como función multiusuario compartida;
- criterio avanzado `tieneContexto`;
- una nueva reorganización general de la barra lateral;
- personalización adicional del encabezado móvil, salvo que se acuerde expresamente como mejora nueva.

Sólo deben incorporarse como pendientes después de definir su necesidad, alcance y prioridad.

También quedan descartados por decisión de alcance:

- renombrar **Descripción** como **Notas**: el campo local conserva su nombre para distinguirlo de las páginas de Notion;
- un sistema local de notas múltiples: las notas extensas se resuelven mediante páginas vinculadas de Notion;
- un botón general o permanente de deshacer: la aplicación usa reversión contextual y temporal en los flujos expresamente cubiertos.

## Principios de planificación

- **Planificación:** Áreas, Proyectos y Objetivos muestran estructura, contexto y progreso.
- **Ejecución:** Hoy y atrasadas, Próximas e Inbox priorizan acciones concretas y reducen ruido visual.
- Las funciones administrativas viven en editores o gestores específicos y no se duplican innecesariamente.
- Objetivos y Proyectos usan breadcrumbs como navegación jerárquica principal.

## Mantenimiento del registro

Antes de iniciar un bloque:

1. revisar este documento;
2. contrastar cualquier supuesto pendiente con `ROADMAP.md`, los issues vigentes y las PR fusionadas;
3. acordar un único objetivo principal;
4. crear una rama específica desde `main` actualizado;
5. implementar y probar;
6. actualizar este registro en la misma PR si cambia el estado del trabajo;
7. trasladar los puntos terminados al roadmap o al documento de referencia correspondiente;
8. fusionar sólo después de la validación y la aprobación explícita.
