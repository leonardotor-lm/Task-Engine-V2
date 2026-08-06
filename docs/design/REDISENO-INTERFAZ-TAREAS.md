# Rediseño de la interfaz de tareas

## Estado

- **Tipo:** propuesta funcional y visual.
- **Alcance actual:** documentación; no modifica todavía el código.
- **Referencias analizadas:** boceto manual del editor de escritorio y capturas de ClickUp en escritorio y celular.
- **Criterio:** adaptar los patrones útiles a Task Engine, sin copiar funciones, estructura ni estética que no correspondan a la aplicación.

## Objetivo

Reorganizar la interfaz para que las herramientas aparezcan cerca del contenido sobre el que actúan, reducir el ruido de la barra lateral y simplificar el editor de tareas sin eliminar capacidades.

El rediseño debe priorizar:

- acceso rápido a las funciones de uso frecuente;
- separación clara entre navegación, herramientas de lista y edición de una tarea;
- divulgación progresiva de propiedades secundarias;
- adaptación real a escritorio y celular;
- persistencia de las preferencias de presentación;
- accesibilidad mediante teclado, foco visible, nombres accesibles y objetivos táctiles suficientes.

## Principios

1. La barra lateral se utiliza principalmente para navegar.
2. Las herramientas que modifican la lista abierta se ubican junto al panel central.
3. El editor de tareas se centra primero en el contenido: título y descripción.
4. Las propiedades se presentan como controles compactos y se despliegan bajo demanda.
5. Las acciones destructivas no compiten visualmente con Guardar o Completar.
6. Escritorio y celular comparten la misma jerarquía funcional, pero no necesitan la misma distribución.
7. Las nuevas superficies deben respetar la guía visual Flat 2.0 del proyecto.

# 1. Barra superior del panel central

## Propósito

Agregar una barra de herramientas breve y contextual por encima de la lista de tareas. Esta barra reúne operaciones que actúan sobre la vista actual y permite retirar controles equivalentes de la barra lateral.

## Controles previstos

### Selección múltiple

- Botón con ícono.
- Debe mostrar con claridad si el modo está activo.
- Al activarse, conserva la posición actual de la lista.
- En celular, la barra debe expandirse automáticamente si estaba contraída.

### Filtros

- Botón visible con texto o combinación de ícono y texto según el ancho disponible.
- Abre un modal específico para filtros.
- El modal no debe mezclar el ordenamiento con los criterios de filtrado.
- Debe indicar cuando existen filtros activos.

### Orden

- Control desplegable independiente de Filtros.
- Conserva los criterios de orden ya existentes.
- Debe permitir elegir criterio y dirección cuando corresponda.
- El valor seleccionado permanece visible o identificable sin abrir nuevamente el control.

### Mostrar u ocultar completadas

- Botón alternable mediante ícono.
- Debe incluir `aria-label`, `title`, foco visible y estado `aria-pressed`.
- Su estado activo no debe comunicarse únicamente mediante color.

## Escritorio

- La barra permanece visible y compacta.
- Se ubica dentro del panel central, vinculada al encabezado de la vista y a la lista.
- No debe duplicar controles equivalentes en la barra lateral.
- Debe admitir títulos de vista y contadores sin comprimirlos excesivamente.

## Celular

- La barra puede contraerse y expandirse.
- El estado contraído o expandido debe persistir.
- Los controles pueden reducirse a íconos cuando el ancho sea insuficiente.
- Cada control mantiene un área táctil amplia.
- No debe ocultarse mientras exista un modo activo que necesite intervención, como selección múltiple.

## Búsqueda

La búsqueda también actúa sobre la lista actual y podría trasladarse más adelante a esta barra. No forma parte obligatoria de la primera etapa. Su ubicación se evaluará después de comprobar el espacio y el comportamiento real de los cuatro controles acordados.

# 2. Persistencia del orden

El orden elegido no debe volver al valor predeterminado al recargar la página, cerrar la aplicación o navegar y regresar a una vista.

Deben persistirse como mínimo:

- criterio de orden;
- dirección ascendente o descendente cuando corresponda.

## Alcance pendiente de decisión final

Existen dos alternativas:

1. un único orden global para todas las vistas;
2. un orden independiente por vista.

La recomendación actual es persistirlo por vista de tareas, porque permite, por ejemplo, ordenar Hoy por fecha y hora, Inbox por creación y un área por prioridad. Esta decisión debe confirmarse antes de implementar.

Las preferencias son de presentación y no deben sincronizarse como datos de dominio salvo que más adelante se acuerde expresamente.

# 3. Barra lateral

## Función principal

La barra lateral debe concentrar:

- navegación entre vistas;
- áreas;
- filtros guardados;
- acceso a configuración;
- estado de sincronización.

Selección múltiple, filtros, orden y mostrar completadas se trasladarán al panel central.

## Áreas

- La sección Áreas aparece desplegada en la primera apertura.
- El usuario puede contraerla o volver a desplegarla.
- La aplicación recuerda esa preferencia al recargar o volver a abrirse.
- Entrar en un área no modifica automáticamente el estado de la sección.
- El encabezado Áreas y su indicador de expansión permanecen visibles.
- La solución debe funcionar con teclado y exponer correctamente el estado expandido mediante `aria-expanded`.

# 4. Editor de tareas: criterio general

El editor deja de comportarse como un formulario largo con campos de importancia semejante. Se convierte en un espacio de trabajo centrado en la tarea.

La jerarquía principal será:

1. contexto de la tarea;
2. título;
3. descripción;
4. propiedades frecuentes;
5. contenido y relaciones adicionales;
6. acciones principales;
7. operaciones administrativas o destructivas.

Título y descripción deben dominar visualmente. Las propiedades se presentan como botones, chips o controles compactos que abren selectores o paneles internos.

# 5. Editor de escritorio

## Estructura propuesta

```text
[ Área ▼ ] [ Contexto ▼ ]                              [ × ]

Título de la tarea

Descripción

[ Prioridad ] [ Fecha ] [ Etiquetas ] [ Objetivos ] [ Más ··· ]

[ Adjuntos ] [ Subtareas ] [ Opciones avanzadas ]

──────────────────────────────────────────────────────────

[ Completar ]                              [ Guardar cambios ]
```

La distribución definitiva puede variar, pero debe conservar esta jerarquía.

## Encabezado y contexto

- Área y Contexto aparecen como selectores compactos.
- El botón Cerrar permanece arriba a la derecha.
- El primer foco de edición debe ser el título cuando corresponda.
- Cerrar mediante Escape o clic exterior continúa respetando la confirmación por cambios sin guardar.

## Título y descripción

- El título es el campo principal.
- La descripción ocupa un área amplia y simple.
- No deben quedar encerrados entre cajas o bordes innecesarios.
- La tipografía y el espaciado deben comunicar la jerarquía antes que los contenedores.

## Propiedades frecuentes

Pueden aparecer directamente como controles compactos:

- prioridad;
- fecha y hora;
- etiquetas;
- objetivos;
- estado En espera cuando resulte pertinente.

Cada control debe mostrar su valor actual y abrir un selector apropiado.

## Contenido y relaciones

Secciones que pueden desplegarse dentro del editor:

- adjuntos;
- subtareas;
- recurrencia;
- relación con la tarea o proyecto padre;
- otras propiedades secundarias.

La apertura de una sección no debe lanzar automáticamente otro modal completo. Se prefieren desplegables, popovers o paneles internos.

## Organización

Mover una tarea, convertirla en tarea principal o navegar hacia su tarea padre son operaciones estructurales. No deben competir permanentemente con Fecha, Prioridad o Etiquetas.

Podrán ubicarse en:

- una sección Organización;
- Opciones avanzadas;
- el menú Más acciones.

La ubicación final debe permitir descubrirlas sin mantenerlas siempre visibles.

## Barra inferior y acciones

La zona inferior puede permanecer fija cuando el contenido tenga desplazamiento.

Jerarquía recomendada:

- **Guardar cambios:** acción primaria.
- **Completar:** acción secundaria destacada.
- **Archivar:** acción terciaria o incluida en Más acciones.
- **Enviar a papelera:** acción destructiva, separada.
- **Eliminar definitivamente:** sólo en estados donde corresponda, con denominación explícita y doble confirmación.

Guardar, Completar, Archivar y Eliminar no deben presentarse con la misma prominencia visual.

# 6. Editor móvil

## Forma general

- Editor como hoja ascendente desde abajo o superficie casi de pantalla completa.
- No se limita a comprimir la versión de escritorio.
- Conserva suficiente espacio para título, descripción y propiedades.
- El desplazamiento ocurre dentro del editor cuando sea necesario.

## Encabezado

```text
[ Área ▼ ] [ Contexto ▼ ]                 [ ··· ] [ × ]
```

El menú de tres puntos puede concentrar operaciones menos frecuentes:

- mover;
- archivar;
- enviar a papelera;
- convertir en tarea principal;
- acciones especiales de recurrencia.

## Contenido principal

- Título amplio y fácil de editar.
- Descripción inmediatamente debajo.
- Información contextual extensa sólo cuando aporte valor, por ejemplo:
  - fecha y hora;
  - tarea padre;
  - estado En espera activo;
  - recurrencia activa.

## Barra inferior fija

La referencia conceptual es una barra compacta con hasta cinco accesos secundarios y una acción principal.

Posible conjunto inicial:

- completar;
- prioridad;
- fecha;
- etiquetas;
- adjuntos;
- Guardar.

La composición exacta debe validarse según el espacio real y la frecuencia de uso. No deben acumularse tantos íconos que la barra vuelva a saturarse.

Guardar puede conservar texto por ser la acción principal. Los demás controles pueden utilizar íconos cuando su significado sea inequívoco.

## Paneles inferiores secundarios

Al tocar una propiedad, puede abrirse una hoja secundaria dentro del mismo flujo, por ejemplo:

- selector de etiquetas;
- fecha y hora;
- prioridad;
- objetivos;
- adjuntos;
- recurrencia.

Estos paneles deben:

- conservar el contexto de la tarea;
- permitir volver sin perder cambios;
- gestionar correctamente el foco;
- cerrarse de forma previsible;
- no acumular diálogos superpuestos.

# 7. Propiedades y comportamiento

## En espera

- No necesita ocupar siempre un botón prominente en celular.
- Debe mostrar una señal visible cuando esté activo.
- Puede modificarse desde Más propiedades u Opciones avanzadas.

## Recurrencia

- Se presenta bajo demanda.
- Sus acciones especiales no necesitan permanecer siempre visibles.
- La edición debe conservar todas las reglas actuales y la detección de cambios sin guardar.

## Adjuntos

- Se mantienen accesibles desde un control compacto.
- La sección interna conserva alta, apertura y eliminación.
- Deben mantenerse los estados de conexión y los límites ya implementados.

## Subtareas

- Deben poder consultarse y administrarse sin convertir el editor en una lista permanentemente extensa.
- La relación padre-hijo continúa siendo visible cuando sea relevante.

# 8. Accesibilidad

El rediseño debe verificar:

- navegación completa mediante teclado;
- orden lógico del foco;
- devolución del foco al cerrar selectores o paneles;
- `aria-label` y `title` para controles con sólo ícono;
- `aria-expanded` y `aria-pressed` en controles alternables;
- foco visual común y suficiente contraste;
- objetivos táctiles amplios en celular;
- ausencia de información comunicada únicamente por color;
- respeto por la preferencia de movimiento reducido;
- confirmación de cambios sin guardar en todos los mecanismos de cierre.

# 9. División de la implementación

## Etapa 1 — Especificación y prototipo

- Confirmar la distribución final.
- Revisar las propiedades de uso frecuente, ocasional y excepcional.
- Definir qué elementos se abren como desplegable, popover, panel interno o diálogo.
- Preparar una maqueta visual antes de modificar la lógica.

## Etapa 2 — Barra superior y barra lateral

- Crear la barra contextual.
- Trasladar selección múltiple, filtros, orden y mostrar completadas.
- Separar Filtros de Orden.
- Hacer persistente el estado de la barra móvil.
- Hacer desplegable y persistente la sección Áreas.

## Etapa 3 — Persistencia del orden

- Confirmar alcance global o por vista.
- Persistir criterio y dirección.
- Verificar navegación, recarga y reapertura.

## Etapa 4 — Editor de escritorio

- Reorganizar encabezado, contenido, propiedades y acciones.
- Incorporar controles compactos y divulgación progresiva.
- Mantener toda la funcionalidad actual.

## Etapa 5 — Editor móvil

- Implementar hoja móvil y barra inferior contextual.
- Crear paneles secundarios para propiedades.
- Validar gestos, teclado, foco y desplazamiento.

## Etapa 6 — Accesibilidad y limpieza

- Verificación integral de teclado y lector de pantalla.
- Ajustes de contraste, estados y áreas táctiles.
- Eliminar componentes y estilos antiguos que ya no se utilicen.
- Actualizar pruebas y documentación.

# 10. Decisiones todavía abiertas

Antes de desarrollar deben resolverse explícitamente:

1. si el orden persistente es global o diferente por vista;
2. si la búsqueda se traslada también a la barra superior;
3. qué cinco accesos, como máximo, permanecen en la barra inferior móvil;
4. si En espera aparece entre las propiedades frecuentes de escritorio o dentro de Más opciones;
5. si Archivar permanece visible en escritorio o pasa a Más acciones;
6. qué comportamiento exacto tendrá el editor móvil: hoja parcial, casi completa o pantalla completa;
7. qué propiedades se consideran frecuentes según el uso real del usuario.

# 11. Criterios de aceptación generales

- La barra lateral queda visualmente más limpia.
- Las herramientas de lista se encuentran junto a la lista.
- El orden elegido persiste según el alcance acordado.
- Áreas aparece desplegada inicialmente y recuerda su estado.
- Título y descripción dominan el editor.
- Las propiedades secundarias se acceden sin perder capacidades.
- Escritorio y celular presentan soluciones adaptadas, no una mera reducción de tamaño.
- Las acciones destructivas permanecen explícitas y separadas.
- Ningún flujo actual de edición, adjuntos, subtareas, recurrencia, espera, objetivos o eliminación se pierde.
- La interfaz es operable mediante teclado y mantiene nombres accesibles en controles con íconos.
