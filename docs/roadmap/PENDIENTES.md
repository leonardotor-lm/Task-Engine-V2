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

### Selectores escalables

- **Estado:** En desarrollo.
- Base reutilizable y buscable incorporada inicialmente en el gestor de asociaciones de objetivos.
- Selector múltiple buscable con chips incorporado en el editor de tareas para etiquetas y objetivos.
- Crear un componente reutilizable con búsqueda para listas extensas.
- Usarlo para elegir destinos al mover tareas o proyectos.
- Evitar listas completas de casillas o desplegables HTML con cientos de opciones.
- Ofrecer búsqueda, altura limitada, desplazamiento y confirmación explícita.

### Gestión de asociaciones de objetivos

- **Estado:** En desarrollo.
- El editor muestra un control compacto con la cantidad asociada.
- El gestor permite buscar y asociar o quitar tareas y proyectos sin desplegar listas interminables.
- Pendiente: incorporar filtros adicionales por área y tipo si el volumen real los vuelve necesarios.
- Mantener la pantalla central del objetivo orientada al seguimiento, no a la administración.

### Mover tareas y proyectos

- **Estado:** Pendiente.
- Mantener la acción rápida **Mover**.
- Incorporar también **Mover** dentro del editor de tareas.
- Utilizar el selector escalable con búsqueda.
- Excluir la propia tarea y sus descendientes para impedir ciclos.
- Conservar el árbol completo al mover un proyecto.

### Objetivos en edición múltiple

- **Estado:** Pendiente.
- Permitir asignar uno o varios objetivos a todas las tareas seleccionadas.
- Aplicar el cambio junto con fecha, prioridad, área, contexto y etiquetas en una sola operación.

### Auditoría de seguridad

- **Estado:** Pendiente.
- Revisar exposición del repositorio público y GitHub Pages.
- Revisar almacenamiento local del token y configuración de sincronización.
- Revisar validación, límites y registros de Google Apps Script.
- Documentar amenazas, medidas actuales y mejoras recomendadas.
- Definir rotación y recuperación segura de credenciales.

## Prioridad media

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
