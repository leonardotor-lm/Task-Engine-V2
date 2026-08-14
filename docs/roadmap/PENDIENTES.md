# Pendientes de Task Engine V2

Este documento es la fuente de verdad del trabajo todavía no implementado, no verificado o deliberadamente postergado. Las funciones terminadas se registran en `docs/roadmap/ROADMAP.md`, en las decisiones estables y en el historial de Git.

Última actualización: 14 de agosto de 2026.

## Estados

- **Pendiente:** trabajo acordado, todavía no iniciado.
- **En desarrollo:** existe una rama o PR activa.
- **Pendiente de verificación:** implementación fusionada cuyo comportamiento operativo todavía debe validarse.
- **Postergado:** trabajo válido, pero fuera de la etapa actual.
- **Propuesta:** mejora identificada que aún requiere una decisión antes de entrar al backlog.

## Prioridad actual

### Verificación de la creación de tareas desde Objetivos

- **Estado:** Pendiente de verificación.
- **Dificultad prevista:** Baja.
- Confirmar que la acción general **Nueva tarea** resulte visible y comprensible dentro de un objetivo abierto.
- Verificar que la tarea creada herede automáticamente el objetivo actual.
- No agregar un segundo botón si la acción existente comunica bien su alcance.

La capacidad ya existe. Este punto sólo puede producir un ajuste de visibilidad o rotulado si la prueba demuestra que la acción actual no se comprende.

## Backlog aprobado

El orden de esta sección combina gravedad, riesgo para los datos, frecuencia de uso y conveniencia para una interfaz minimalista. Dentro de cada etapa, los puntos deben abordarse en la secuencia indicada salvo que una investigación revele una dependencia nueva.

### Etapa 1 — Integridad y continuidad de uso

#### 1. Excluir de Estadísticas los proyectos borrados

- **Estado:** Pendiente de investigación y corrección.
- **Dificultad prevista:** Media para reproducir; baja o media para corregir.
- Reproducir el error con borrado, sincronización, restauración y proyectos anidados.
- Determinar si intervienen datos históricos, referencias huérfanas o una ruta no cubierta por la prueba actual.
- Garantizar que los proyectos en Papelera o eliminados definitivamente no aparezcan en ninguna estadística.

#### 2. Conservar la jerarquía al duplicar subtareas

- **Estado:** Pendiente.
- **Dificultad prevista:** Baja.
- La copia de una subtarea debe conservar el mismo `parentTaskId` que la tarea original.
- Si se duplica un subárbol, sus descendientes deben quedar vinculados a la copia correspondiente y no al subárbol original.

#### 3. Restaurar Editar objetivo en celular

- **Estado:** Pendiente.
- **Dificultad prevista:** Baja.
- Mostrar en la vista móvil la acción **Editar objetivo** que ya existe en la estructura de la interfaz.
- Integrarla sin sumar una fila adicional de controles ni romper la geometría del encabezado.

#### 4. Unificar la creación dentro de Proyectos

- **Estado:** Pendiente.
- **Dificultad prevista:** Baja.
- Dentro de un proyecto, dejar una única acción de alta: **Agregar subtarea**.
- Ocultar o transformar contextualmente la acción general **Nueva tarea** para evitar la creación accidental de una tarea suelta en Inbox.

#### 5. Corregir el contador de progreso de Proyectos

- **Estado:** Pendiente.
- **Dificultad prevista:** Baja.
- Calcular el progreso con todas las tareas válidas del proyecto, aunque las completadas estén ocultas en la lista.
- Mantener el formato `completadas/total`, por ejemplo `3/10`.

### Etapa 2 — Seguridad de acciones y claridad visual

#### 6. Incorporar Deshacer contextual al completar tareas

- **Estado:** Pendiente.
- **Dificultad prevista:** Baja o media.
- Mostrar en escritorio el mismo aviso temporal de tarea completada que se utiliza después del gesto móvil.
- Ofrecer **Deshacer** al completar mediante la casilla y reutilizar un único componente en escritorio y celular.
- Diseñar la base para admitir otras acciones acotadas sólo cuando exista una necesidad concreta y una reversión segura.
- No incorporar un botón permanente ni un historial general de deshacer.

#### 7. Mostrar la ruta jerárquica de subtareas aisladas

- **Estado:** Pendiente.
- **Dificultad prevista:** Media.
- Cuando una subtarea aparezca sin su padre visible, mostrar arriba del título una ruta del tipo `Tarea > Subtarea > Sub-subtarea`.
- Omitir la ruta cuando el origen ya resulte evidente por la estructura visible.
- Truncar rutas extensas y ocultarlas junto con los demás metadatos.

#### 8. Representar el color del contexto como texto discreto

- **Estado:** Pendiente.
- **Dificultad prevista:** Baja.
- Mantener el contexto como texto, sin convertirlo en chip.
- Comunicar su color mediante un punto pequeño u otro acento discreto que preserve el contraste con colores personalizados.

#### 9. Homogeneizar popovers y controles transitorios

- **Estado:** Pendiente.
- **Dificultad prevista:** Media.
- Auditar popovers, menús y selectores existentes antes de crear un componente nuevo.
- Unificar geometría, espaciado, sombras, botones, foco, cierre con Escape o clic exterior y adaptación móvil.
- Respetar diferencias funcionales entre controles y evitar que la homogeneidad agregue decoración o pasos innecesarios.

#### 10. Cambiar la etiqueta Descripción por Notas

- **Estado:** Pendiente.
- **Dificultad prevista:** Baja.
- Conservar el campo, su modelo de datos, su sincronización y su comportamiento actual.
- Cambiar únicamente el nombre visible de **Descripción** a **Notas** en todos los editores y textos relacionados.
- No crear notas múltiples, una entidad nueva ni otra sección del editor.

### Etapa 3 — Gestión de Objetivos y Proyectos

#### 11. Heredar objetivos en la jerarquía de un proyecto

- **Estado:** Pendiente.
- **Dificultad prevista:** Media.
- Al asignar un objetivo a un proyecto, sumarlo a todas sus tareas descendientes sin eliminar otras asociaciones existentes.
- Hacer que cada nueva subtarea herede todos los objetivos de su padre.
- No retirar automáticamente de los descendientes un objetivo que se quite del proyecto hasta definir una regla segura para asociaciones agregadas manualmente.

#### 12. Mostrar u ocultar completadas en Objetivos

- **Estado:** Pendiente.
- **Dificultad prevista:** Baja o media.
- Incorporar en la vista de objetivos el ícono de ojo ya utilizado por las demás vistas.
- Mantener el mismo significado, estado accesible y persistencia del control existente.

#### 13. Incorporar filtros rápidos y orden en Objetivos

- **Estado:** Pendiente.
- **Dificultad prevista:** Media.
- Reutilizar **Herramientas de la lista** para filtrar y ordenar las tareas de los proyectos asociados al objetivo.
- Evitar una nueva fila permanente de controles.
- Conservar las preferencias por objetivo si el contrato actual de persistencia por vista lo permite sin ambigüedades.

#### 14. Agregar un filtro rápido por Proyecto

- **Estado:** Pendiente.
- **Dificultad prevista:** Media.
- Permitir filtrar por un proyecto y todo su subárbol desde el panel existente de filtros rápidos.
- Usar un selector buscable y mostrar la ruta del proyecto cuando sea necesaria para distinguir nombres repetidos.

### Etapa 4 — Eficiencia avanzada sin ruido visual

#### 15. Incorporar un conjunto acotado de atajos de teclado

- **Estado:** Pendiente de definición funcional.
- **Dificultad prevista:** Baja o media.
- Definir con el usuario un conjunto pequeño antes de implementar.
- Ignorar atajos de acción mientras se escribe en campos editables.
- Evitar conflictos con el navegador y documentar los atajos sin mantener una ayuda permanente en pantalla.

#### 16. Permitir orden manual mediante arrastre

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

- un sistema de notas múltiples: el campo actual se conservará y sólo pasará a llamarse **Notas**;
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
