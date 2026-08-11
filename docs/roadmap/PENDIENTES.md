# Pendientes de Task Engine V2

Este documento es la fuente de verdad del trabajo todavía no implementado, no verificado o deliberadamente postergado. Las funciones terminadas se registran en `docs/roadmap/ROADMAP.md`, en las decisiones estables y en el historial de Git.

Última actualización: 11 de agosto de 2026.

## Estados

- **Pendiente:** trabajo acordado, todavía no iniciado.
- **En desarrollo:** existe una rama o PR activa.
- **Pendiente de verificación:** implementación fusionada cuyo comportamiento operativo todavía debe validarse.
- **Postergado:** trabajo válido, pero fuera de la etapa actual.
- **Propuesta:** mejora identificada que aún requiere una decisión antes de entrar al backlog.

## Prioridad actual

### Verificación operativa final de la PWA

- **Estado:** Pendiente de verificación.
- **Implementación:** fusionada en la PR #194.
- Confirmar en la aplicación instalada que Atrás muestra el aviso antes de salir desde la vista raíz.
- Abrir y recargar la aplicación instalada sin conexión.
- Modificar una tarea sin conexión y comprobar que sincroniza al recuperar internet.
- Confirmar en una instalación nueva que los datos de ejemplo no generan un conflicto con la nube.
- Verificar que una nueva versión publicada sustituye correctamente la caché anterior.
- Comprobar el recorrido **Cómo instalar** en escritorio y celular cuando el navegador no entrega el diálogo nativo.

Este bloque es una validación posterior a la fusión. No implica reconstruir la PWA ni modificar su arquitectura salvo que alguna prueba revele un defecto reproducible.

## Propuesta pendiente de decisión

### Diagnóstico visible de errores de sincronización

- **Estado:** Propuesta.
- Mostrar una causa resumida y segura cuando falla la sincronización.
- Distinguir, cuando sea posible, problemas de red, HTTP, autorización y respuesta inválida.
- Informar el último intento y ofrecer una acción explícita para reintentar.
- No exponer el token ni la URL completa del backend.

El incidente observado durante la validación de la PWA justificó registrar esta posibilidad, pero no está aprobado todavía como próximo bloque de desarrollo.

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
- múltiples usuarios o una segunda instancia de la aplicación;
- criterio avanzado `tieneContexto`;
- una nueva reorganización general de la barra lateral.

Sólo deben incorporarse como pendientes después de definir su necesidad, alcance y prioridad.

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
