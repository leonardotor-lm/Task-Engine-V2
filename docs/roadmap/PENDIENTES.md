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

### Densidad y jerarquía visual

- **Estado:** Pendiente.
- Revisar editores, barras y paneles para reducir ruido sin perder capacidades.
- Mantener información esencial visible y administración bajo demanda.
- Conservar una interfaz sobria, compacta y fácil de recorrer.

### Presentación de proyectos dentro de objetivos

- **Estado:** Pendiente.
- Al abrir un objetivo, mostrar cada proyecto inicialmente contraído.
- Mantener visible el nombre del proyecto y su flecha de expansión.
- Mostrar las subtareas sólo cuando la persona despliegue el proyecto.
- Conservar el estado compacto para evitar que el objetivo se abra como una lista extensa.

### Encabezado móvil de objetivos

- **Estado:** Pendiente.
- En celular, ubicar las acciones del objetivo debajo del título.
- Reservar para el título todo el ancho disponible y evitar cortes innecesarios en dos líneas.
- Mantener una jerarquía visual clara entre nombre, estado y acciones.

### Botones e iconografía

- **Estado:** Pendiente para una etapa visual cercana.
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

### Temas visuales

- **Estado:** Postergado.
- Preparar temas visuales intercambiables sin alterar el dominio.
- Mantener diferencias visuales claras entre área, contexto, etiqueta, prioridad y recurrencia.
- Preservar un diseño compacto y sobrio.

## Prioridad futura

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
