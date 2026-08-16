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

### Incorporar un conjunto acotado de atajos de teclado

- **Estado:** En desarrollo.
- **Dificultad prevista:** Baja o media.
- Alcance definido: `N` abre **Nueva tarea**, `/` enfoca la búsqueda simple y `C` completa la tarea que tiene el foco.
- Los atajos de acción se ignoran mientras se escribe en `input`, `textarea`, `select` o contenido editable.
- No se interceptan combinaciones con Ctrl, Alt o Cmd/Meta para evitar conflictos con el navegador o el sistema.
- La navegación por flechas, Home/End, Enter/Espacio y jerarquía permanece separada y sin cambios.

## Backlog aprobado

El orden de esta sección combina gravedad, riesgo para los datos, frecuencia de uso y conveniencia para una interfaz minimalista. Dentro de cada etapa, los puntos deben abordarse en la secuencia indicada salvo que una investigación revele una dependencia nueva.

### Etapa 1 — Eficiencia avanzada sin ruido visual

#### 1. Incorporar un conjunto acotado de atajos de teclado

- **Estado:** En desarrollo.
- **Dificultad prevista:** Baja o media.
- `N`: abrir **Nueva tarea** cuando esa acción esté disponible en la vista actual.
- `/`: enfocar y seleccionar el contenido de la búsqueda simple cuando la vista disponga de ella.
- `C`: completar la tarea cuya fila tiene el foco, reutilizando el control de finalización existente.
- Ignorar los atajos dentro de campos editables y cuando intervienen Ctrl, Alt o Cmd/Meta.
- No agregar una ayuda permanente en pantalla ni modificar la navegación por teclado ya implementada.

#### 2. Permitir orden manual mediante arrastre

- **Estado:** Pendiente.
- **Dificultad prevista:** Media o alta.
- Habilitar el arrastre sólo cuando esté seleccionado **Orden manual** y únicamente entre tareas hermanas.
- Persistir el resultado en `manualOrder` y mantenerlo mediante sincronización.
- En celular, utilizar un tirador explícito para no interferir con el desplazamiento vertical ni con los gestos laterales.
- Definir el comportamiento ante filtros activos, subtareas contraídas y listas parciales antes de implementar.

### Etapa 2 — Notas externas vinculadas

#### 3. Integrar Notion como base externa de notas

- **Estado:** Pendiente aprobado; seguimiento en issue #212.
- **Dificultad prevista:** Media o alta, dividida en etapas independientes.
- Mantener Google Sheets como base principal de Task Engine.
- Cada usuario conecta su propia cuenta y espacio de trabajo de Notion mediante su instalación y Apps Script independientes.
- El token de Notion debe permanecer fuera del frontend y del repositorio.
- Permitir elegir una base contenedora específica de Notion para las notas de Task Engine.
- Las tareas y los objetivos/proyectos podrán crear, abrir y desvincular una página de Notion.
- Task Engine conservará solamente el identificador y la URL de la página vinculada; el contenido se editará exclusivamente en Notion.
- El campo local de la tarea conserva el nombre **Descripción**. El concepto **Notas** queda reservado para las páginas vinculadas de Notion.
- Reflejar en Notion el estado de la entidad vinculada —activa, finalizada, archivada o eliminada— sin borrar automáticamente la página.
- Dividir la implementación en conexión/configuración, vinculación de páginas, actualización de estados y pruebas de aislamiento entre usuarios.

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
- múltiples usuarios o una segunda instancia de la aplicación como función multiusuario compartida;
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
