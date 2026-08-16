# Pendientes de Task Engine V2

Este documento es la fuente de verdad del trabajo todavía no implementado, no verificado o deliberadamente postergado. Las funciones terminadas se registran en `docs/roadmap/ROADMAP.md`, en las decisiones estables y en el historial de Git.

Última actualización: 16 de agosto de 2026.

## Estados

- **Pendiente:** trabajo acordado, todavía no iniciado.
- **En desarrollo:** existe una rama o PR activa.
- **Pendiente de verificación:** implementación fusionada cuyo comportamiento operativo todavía debe validarse.
- **Postergado:** trabajo válido, pero fuera de la etapa actual.
- **Propuesta:** mejora identificada que aún requiere una decisión antes de entrar al backlog.

## Prioridad actual

### Heredar objetivos en la jerarquía de un proyecto

- **Estado:** Pendiente.
- **Dificultad prevista:** Media.
- Al asignar un objetivo a un proyecto, sumarlo a todas sus tareas descendientes sin eliminar otras asociaciones existentes.
- Hacer que cada nueva subtarea herede todos los objetivos de su padre.
- No retirar automáticamente de los descendientes un objetivo que se quite del proyecto hasta definir una regla segura para asociaciones agregadas manualmente.

## Backlog aprobado

El orden de esta sección combina gravedad, riesgo para los datos, frecuencia de uso y conveniencia para una interfaz minimalista. Dentro de cada etapa, los puntos deben abordarse en la secuencia indicada salvo que una investigación revele una dependencia nueva.

### Etapa 1 — Gestión de Objetivos y Proyectos

#### 1. Heredar objetivos en la jerarquía de un proyecto

- **Estado:** Pendiente.
- **Dificultad prevista:** Media.
- Al asignar un objetivo a un proyecto, sumarlo a todas sus tareas descendientes sin eliminar otras asociaciones existentes.
- Hacer que cada nueva subtarea herede todos los objetivos de su padre.
- No retirar automáticamente de los descendientes un objetivo que se quite del proyecto hasta definir una regla segura para asociaciones agregadas manualmente.

#### 2. Mostrar u ocultar completadas en Objetivos

- **Estado:** Pendiente.
- **Dificultad prevista:** Baja o media.
- Incorporar en la vista de objetivos el ícono de ojo ya utilizado por las demás vistas.
- Mantener el mismo significado, estado accesible y persistencia del control existente.

#### 3. Incorporar filtros rápidos y orden en Objetivos

- **Estado:** Pendiente.
- **Dificultad prevista:** Media.
- Reutilizar **Herramientas de la lista** para filtrar y ordenar las tareas de los proyectos asociados al objetivo.
- Evitar una nueva fila permanente de controles.
- Conservar las preferencias por objetivo si el contrato actual de persistencia por vista lo permite sin ambigüedades.

#### 4. Agregar un filtro rápido por Proyecto

- **Estado:** Pendiente.
- **Dificultad prevista:** Media.
- Permitir filtrar por un proyecto y todo su subárbol desde el panel existente de filtros rápidos.
- Usar un selector buscable y mostrar la ruta del proyecto cuando sea necesaria para distinguir nombres repetidos.

### Etapa 2 — Eficiencia avanzada sin ruido visual

#### 5. Incorporar un conjunto acotado de atajos de teclado

- **Estado:** Pendiente de definición funcional.
- **Dificultad prevista:** Baja o media.
- Definir con el usuario un conjunto pequeño antes de implementar.
- Ignorar atajos de acción mientras se escribe en campos editables.
- Evitar conflictos con el navegador y documentar los atajos sin mantener una ayuda permanente en pantalla.

#### 6. Permitir orden manual mediante arrastre

- **Estado:** Pendiente.
- **Dificultad prevista:** Media o alta.
- Habilitar el arrastre sólo cuando esté seleccionado **Orden manual** y únicamente entre tareas hermanas.
- Persistir el resultado en `manualOrder` y mantenerlo mediante sincronización.
- En celular, utilizar un tirador explícito para no interferir con el desplazamiento vertical ni con los gestos laterales.
- Definir el comportamiento ante filtros activos, subtareas contraídas y listas parciales antes de implementar.

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

También quedan descartados por decisión de alcance:

- renombrar **Descripción** como **Notas**: el campo local conserva su nombre para distinguirlo de las futuras notas vinculadas de Notion;
- un sistema local de notas múltiples: las notas extensas se resolverán mediante la futura integración con Notion;
- un botón general o permanente de deshacer: sólo se implementará una reversión contextual y temporal para acciones expresamente cubiertas.

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
