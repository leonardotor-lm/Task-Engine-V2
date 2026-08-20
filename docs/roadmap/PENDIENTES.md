# Pendientes de Task Engine V2

Este documento es la fuente de verdad del trabajo todavía no implementado, no verificado o deliberadamente postergado. Las funciones terminadas se registran en `docs/roadmap/ROADMAP.md`, en las decisiones estables y en el historial de Git.

Última auditoría integral: 19 de agosto de 2026.

## Regla de lectura

Antes de reconstruir una lista de pendientes desde conversaciones, notas históricas o memoria, debe consultarse primero este documento y contrastarse con `docs/roadmap/ROADMAP.md` y las PR fusionadas. Una capacidad incluida en **Capacidades auditadas y cerradas** no vuelve al backlog salvo que exista un defecto concreto, una regresión reproducible o una nueva mejora expresamente aprobada.

## Estados

- **Pendiente:** trabajo acordado, todavía no iniciado.
- **En desarrollo:** existe una rama o PR activa.
- **Pendiente de verificación:** implementación fusionada cuyo comportamiento operativo todavía debe validarse.
- **Postergado:** trabajo válido, pero fuera de la etapa actual.
- **Propuesta:** mejora identificada que aún requiere una decisión antes de entrar al backlog.

## Prioridad actual

### 1. Temas visuales intercambiables

- **Estado:** En desarrollo; seguimiento en issue #250.
- Es el primer trabajo pendiente y debe mantenerse por encima de cualquier mejora funcional nueva hasta cerrar o redefinir este bloque.
- La infraestructura de temas está implementada desde PR #251.
- La selección y persistencia de la preferencia están implementadas desde PR #252.
- Desde PR #257, el tema es deliberadamente **local por dispositivo** y no se sincroniza entre instalaciones; `sidebarTitle` sí continúa sincronizándose.
- Temas alternativos ya fusionados y disponibles: **Retro Dark** (#253–#254), **Oscuro** (#255), **Papel** (#258), **Alto contraste** (#260), **Azul tinta** (#261) y **Terminal 80** (#265).
- La PR #256 **Muestrario** continúa abierta en borrador y no debe considerarse una capacidad aprobada o terminada hasta que se revise expresamente.
- La PR #262 **Oliva** fue cerrada sin fusionar y queda descartada como variante actual.
- **Trabajo real restante:** migrar gradualmente los colores concretos que todavía no usan tokens semánticos y realizar una verificación final del conjunto de temas en escritorio, celular y PWA.
- No reabrir infraestructura, selector ni persistencia salvo que aparezca una regresión concreta.

## Backlog aprobado

### 2. Selección múltiple: limpiar fecha

- **Estado:** En desarrollo; PR #266.
- Incorporar una acción explícita para quitar la fecha de vencimiento de las tareas seleccionadas sin modificar sus demás propiedades.
- El alcance acordado es **vencimiento**: limpiar `dueDate` y la hora asociada `dueTime`; la fecha de inicio `startDate` no se modifica.
- La acción se integra al control de fecha de la selección múltiple y conserva el comportamiento actual para asignar una fecha y una hora nuevas.
- Una tarea recurrente no puede quedar sin vencimiento bajo el modelo actual. Si la selección contiene recurrencias, la acción debe impedir el cambio e informar el motivo en lugar de finalizar la recurrencia implícitamente.
- Mantener el mismo comportamiento seguro de las demás operaciones masivas y preservar jerarquía, asociaciones y demás propiedades.

### 3. Recurrencias: ciclo de vida único y reglas avanzadas

- **Estado:** Pendiente.
- Una recurrencia debe mantener **una sola ocurrencia activa por serie**: mientras la ocurrencia actual continúe pendiente no deben generarse nuevas tareas futuras de la misma serie.
- Al completar la ocurrencia activa, se calcula y habilita recién entonces la próxima ocurrencia según la regla configurada.
- Revisar el modelo y la generación actual para evitar acumulación de ocurrencias independientes y conservar historial, sincronización y compatibilidad con datos existentes.
- Exponer y completar las capacidades de intervalo ya compatibles con el dominio: **cada N días**, **cada N semanas** y **cada N meses**; por ejemplo, cada 3 días o cada 2 semanas.
- Permitir elegir **uno o varios días de la semana** para una recurrencia semanal, por ejemplo lunes y jueves.
- Incorporar reglas mensuales calendáricas avanzadas, al menos:
  - primer día hábil del mes;
  - N.º día hábil del mes, por ejemplo quinto día hábil;
  - evaluar también último día hábil y reglas equivalentes por día de semana si resultan coherentes con el editor final.
- Para la primera versión, **día hábil** significa lunes a viernes; los feriados no forman parte del alcance salvo decisión posterior.
- Diseñar el editor de recurrencia para ampliar opciones sin saturar la interfaz y mantener una representación comprensible de la regla elegida.

### 4. Búsqueda avanzada: resultados jerárquicos estrictos

- **Estado:** Pendiente.
- Una búsqueda avanzada debe mostrar como resultado únicamente las tareas que cumplen realmente los criterios.
- Un padre o proyecto que no cumple el criterio no debe aparecer sólo porque uno de sus descendientes sí coincide.
- Cuando una subtarea coincidente aparezca aislada, debe conservar una referencia visible a su padre o ruta jerárquica para ubicarla en contexto sin convertir a los ancestros en resultados falsos.
- Ejemplo: `contexto:calle` debe devolver tareas raíz y subtareas con ese contexto; una subtarea debe mostrar su referencia jerárquica aunque su padre no tenga `@calle`.
- Reutilizar, cuando sea posible, el mecanismo ya existente para mostrar la ruta de subtareas aisladas.

## Capacidades auditadas y cerradas

La auditoría del 19 de agosto de 2026 contrastó `PENDIENTES.md`, `ROADMAP.md`, documentos específicos y PRs fusionadas. Los siguientes bloques **no son pendientes**:

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
- **Integración con Notion:** conexión, tareas/proyectos, objetivos, actualización de metadatos, cola de reintentos, diagnóstico, aislamiento por instalación y revisión móvil están cerrados en #240–#248.

Estos bloques sólo deben volver a aparecer si se describe una regresión o una mejora nueva y concreta sobre la capacidad ya existente.

## Propuesta pendiente de decisión

### Diagnóstico general de errores de sincronización

- **Estado:** Propuesta.
- **Alcance:** sincronización principal con Google Apps Script / Google Sheets; no se refiere al diagnóstico de Notion, que ya está implementado.
- Mostrar una causa resumida y segura cuando falla la sincronización general.
- Distinguir, cuando sea posible, problemas de red, HTTP, autorización y respuesta inválida.
- Informar el último intento y ofrecer una acción explícita para reintentar.
- No exponer el token ni la URL completa del backend.

La aplicación ya conserva cambios locales, reanuda la sincronización al recuperar conectividad y dispone de diagnóstico específico para las actualizaciones pendientes de Notion. Esta propuesta sólo debe convertirse en pendiente aprobado si se decide que el diagnóstico general actual de Sheets necesita más detalle.

## Ideas que no integran el backlog

Las siguientes cuestiones fueron exploradas, pero no constituyen trabajo comprometido:

- notificaciones o recordatorios del sistema;
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
2. contrastar cualquier supuesto pendiente con `ROADMAP.md` y las PR fusionadas;
3. acordar un único objetivo principal;
4. crear una rama específica desde `main` actualizado;
5. implementar y probar;
6. actualizar este registro en la misma PR si cambia el estado del trabajo;
7. trasladar los puntos terminados al roadmap o al documento de referencia correspondiente;
8. fusionar sólo después de la validación y la aprobación explícita.
