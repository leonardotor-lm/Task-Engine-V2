# Pendientes de Task Engine V2

Este documento es el registro permanente de trabajo todavía no implementado o no cerrado.
Debe actualizarse en la misma PR que complete, descarte o reprograme un punto.

## Estados

- **Pendiente:** acordado, todavía no iniciado.
- **En desarrollo:** existe una rama o PR activa.
- **Postergado:** válido, pero fuera de la etapa actual.
- **Terminado:** implementado y verificado; debe trasladarse al historial de decisiones.

## Principio de diseño de las vistas

- **Planificación:** Áreas, Proyectos y Objetivos deben mostrar estructura, contexto, progreso y elementos que requieren revisión.
- **Ejecución:** Hoy y atrasadas, Próximas e Inbox deben priorizar acciones concretas y reducir el ruido visual.
- Las funciones administrativas deben vivir en editores o gestores específicos, no duplicarse en las pantallas de seguimiento.

## Prioridad alta

### Verificación del despliegue de seguridad

- **Estado:** Pendiente de comprobación operativa.
- Confirmar que el despliegue activo de Apps Script utiliza la versión actual de `google-apps-script/Code.gs`.
- Probar una descarga y una subida con el despliegue actualizado.
- Verificar que todas las colecciones, incluidos los objetivos, se conservan.

## Prioridad media

### Paneles compactos de la barra lateral

- **Estado:** En desarrollo por bloques.
- **Búsqueda simple y avanzada:** implementadas en la rama de paneles de búsqueda; pendientes de verificación visual.
- **Filtros y vista:** implementados en la rama de panel visual; pendientes de verificación visual.
- Retirar de la barra los paneles permanentes de Organización, Sincronización y Copia de seguridad.
- Incorporar al final de la barra un acceso **Configuración** con engranaje y texto.
- Desde Configuración, ofrecer Organización, Sincronización y Copia de seguridad como tres accesos independientes a sus respectivos paneles.
- Mantener diferenciadas la navegación por Áreas y la administración de áreas, contextos y etiquetas.

### Seleccionar todas en acciones múltiples

- **Estado:** Pendiente.
- Incorporar una casilla **Seleccionar todas** al modo de selección múltiple.
- Limitar su alcance a las tareas seleccionables visibles en la vista y filtros actuales.
- Permitir desmarcar el conjunto completo sin afectar tareas ocultas.
- Comunicar con claridad cuántas tareas quedaron seleccionadas.

### Objetivos en la búsqueda avanzada

- **Estado:** Pendiente.
- Extender el motor de búsqueda avanzada para contemplar la entidad Objetivo y sus asociaciones, incorporada después del diseño inicial del buscador.
- Permitir buscar tareas y proyectos por objetivo o subobjetivo asociado, con coincidencias parciales y normalización de mayúsculas y tildes.
- Incorporar criterios para distinguir elementos con o sin objetivos asociados.
- Definir el alcance de la jerarquía: asociación directa, objetivo principal y descendientes.
- Incorporar en la búsqueda de objetivos sus propiedades pertinentes, como título, descripción, estado, fecha límite y posición jerárquica.
- Mantener compatibilidad con AND, OR, NOT, paréntesis y filtros guardados.
- Definir nombres de campos y sinónimos coherentes en español e inglés.
- Actualizar la referencia de búsqueda avanzada y agregar pruebas de análisis, filtrado y conservación de jerarquías.

### Densidad y jerarquía visual

- **Estado:** Pendiente.
- Revisar editores, barras y paneles para reducir ruido sin perder capacidades.
- Mantener información esencial visible y administración bajo demanda.
- Conservar una interfaz sobria, compacta y fácil de recorrer.

### Botones e iconografía

- **Estado:** Pendiente para una etapa visual cercana.
- Aplicar los criterios establecidos en `docs/design/VISUAL-GUIDE.md`.
- Utilizar la base reutilizable `src/ui/Icon.js` y los estilos `.icon` y `.iconButton`.
- Revisar de forma sistemática los botones de escritorio y celular.
- Reemplazar textos evidentes por íconos reconocibles cuando reduzcan ruido visual.
- Evaluar, entre otros, flecha hacia la izquierda para **Volver**, disquete para **Guardar** y ojo abierto o cerrado para **Mostrar u ocultar detalles**.
- Mantener etiquetas accesibles, títulos descriptivos y estados visuales claros en todos los botones con sólo ícono.
- Conservar texto cuando un ícono aislado pueda resultar ambiguo.

### Selector de colores

- **Estado:** Postergado hasta la etapa visual.
- Ofrecer una paleta inicial de colores pastel y algunos colores intensos.
- Permitir ingresar colores personalizados en formato hexadecimal.
- Mostrar vista previa y validar el código.
- Permitir reutilizar colores personalizados.
- Usar el mismo componente en áreas, contextos y etiquetas.

### Orden manual de áreas

- **Estado:** Pendiente.
- Permitir reorganizar las áreas visibles en la barra lateral.
- Persistir y sincronizar el orden.
- Priorizar un mecanismo adecuado para escritorio y celular.

### Navegación y desplazamiento

- **Estado:** Pendiente de revisión.
- Al cambiar de vista desde la barra lateral, desplazar el contenido al inicio.
- Verificar este comportamiento en escritorio y celular.

### Fecha y hora

- **Estado:** Pendiente.
- Permitir elegir una hora optativa junto con la fecha de vencimiento.
- Definir la compatibilidad con recurrencias, posposición, búsquedas, orden y sincronización.
- Mantener una selección simple cuando la tarea sólo necesite fecha.

### Temas visuales

- **Estado:** Postergado.
- Preparar temas visuales intercambiables sin alterar el dominio.
- Mantener diferencias visuales claras entre área, contexto, etiqueta, prioridad y recurrencia.
- Preservar un diseño compacto y sobrio.

## Prioridad futura

### Vista de calendario

- **Estado:** Postergado hasta terminar el pulido de las vistas existentes.
- Incorporar una vista de calendario para revisar y planificar tareas fechadas.
- Definir alcance mensual, semanal o combinado después de estabilizar fecha y hora.
- Conservar el minimalismo funcional y evitar duplicar el editor de tareas dentro del calendario.

### Adjuntos

- **Estado:** Postergado.
- Incorporar adjuntos mediante Google Drive.
- Definir alta, apertura, eliminación y sincronización.
- Añadir el criterio de búsqueda por adjuntos.
- Actualizar la guía de búsqueda avanzada cuando la función exista.

### Historial y estadísticas

- **Estado:** Postergado.
- Diseñar historial útil de cambios y acciones.
- Incorporar estadísticas sólo cuando exista información suficiente y estable.

## Mantenimiento del registro

Antes de iniciar un nuevo bloque de trabajo:

1. revisar este documento;
2. elegir un único objetivo principal;
3. crear una rama específica;
4. implementar y probar;
5. actualizar el estado del pendiente en la misma PR;
6. fusionar mediante **Squash and merge**.
