# Pendientes de Task Engine V2

Este documento es la fuente de verdad del trabajo todavía no implementado, no verificado o deliberadamente postergado. Las funciones terminadas se registran en `docs/roadmap/ROADMAP.md`, en las decisiones estables y en el historial de Git.

Última actualización: 18 de agosto de 2026.

## Estados

- **Pendiente:** trabajo acordado, todavía no iniciado.
- **En desarrollo:** existe una rama o PR activa.
- **Pendiente de verificación:** implementación fusionada cuyo comportamiento operativo todavía debe validarse.
- **Postergado:** trabajo válido, pero fuera de la etapa actual.
- **Propuesta:** mejora identificada que aún requiere una decisión antes de entrar al backlog.

## Prioridad actual

No hay en este momento un bloque funcional aprobado y pendiente de implementación.

La integración de Notion, que era la prioridad anterior, quedó completada en las PR #240 a #247 y se registra como cerrada en `ROADMAP.md`.

Antes de iniciar una nueva función grande debe elegirse explícitamente una de las propuestas o ideas registradas más abajo, o incorporarse una necesidad nueva al backlog.

## Backlog aprobado

No hay pendientes funcionales aprobados activos.

Los bloques históricos que figuraron en este documento —adjuntos, tareas en espera, fecha de inicio, calendario, objetivos y proyectos, duplicación de jerarquías, filtros y orden, atajos, orden manual, recuperación de sincronización e integración de Notion— ya están implementados y no deben volver a tratarse como pendientes salvo que aparezca un defecto concreto.

## Propuesta pendiente de decisión

### Diagnóstico general de errores de sincronización

- **Estado:** Propuesta.
- **Alcance:** sincronización principal con Google Apps Script / Google Sheets; no se refiere al diagnóstico de Notion, que ya está implementado.
- Mostrar una causa resumida y segura cuando falla la sincronización general.
- Distinguir, cuando sea posible, problemas de red, HTTP, autorización y respuesta inválida.
- Informar el último intento y ofrecer una acción explícita para reintentar.
- No exponer el token ni la URL completa del backend.

La aplicación ya conserva cambios locales, reanuda la sincronización al recuperar conectividad y dispone de diagnóstico específico para las actualizaciones pendientes de Notion. Esta propuesta sólo debe convertirse en pendiente aprobado si se decide que el diagnóstico general actual de Sheets necesita más detalle.

## Trabajo postergado

### Temas visuales

- **Estado:** Postergado.
- Incorporar temas intercambiables sin alterar el dominio ni duplicar componentes.
- Mantener diferencias visuales claras entre área, contexto, etiqueta, prioridad y recurrencia.
- Preservar una interfaz compacta y sobria.
- Continuar usando variables CSS semánticas para no bloquear una implementación futura.

## Ideas que no integran el backlog

Las siguientes cuestiones fueron exploradas, pero no constituyen trabajo comprometido:

- notificaciones o recordatorios del sistema;
- múltiples usuarios o una segunda instancia de la aplicación como función multiusuario compartida;
- criterio avanzado `tieneContexto`;
- una nueva reorganización general de la barra lateral.

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
2. acordar un único objetivo principal;
3. crear una rama específica desde `main` actualizado;
4. implementar y probar;
5. actualizar este registro en la misma PR si cambia el estado del trabajo;
6. trasladar los puntos terminados al roadmap o al documento de referencia correspondiente;
7. fusionar sólo después de la validación y la aprobación explícita.
