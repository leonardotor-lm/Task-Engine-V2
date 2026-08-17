# Roadmap de implementación

## Objetivo

Construir una aplicación útil y estable, incorporando complejidad de manera gradual y evitando que cada nueva función degrade la experiencia existente.

La secuencia inicial por fases cumplió su propósito. Desde agosto de 2026, este documento registra las capacidades consolidadas y los cierres principales; el trabajo vigente se mantiene únicamente en `docs/roadmap/PENDIENTES.md`.

## Estado actual — agosto de 2026

Task Engine V2 cuenta con:

- dominio y persistencia local de tareas, áreas, contextos, etiquetas, objetivos, recurrencias y actividad;
- sincronización con Google Apps Script y Google Sheets, reconciliación automática, copias de seguridad y conservación de cambios locales ante fallos de red;
- adjuntos en Google Drive;
- interfaz responsive y editores diferenciados para escritorio y celular;
- Inbox, Hoy y atrasadas, Mañana, Próximas, Todas, En espera, Calendario, Actividad, Estadísticas, Completadas, Archivadas y Papelera;
- fechas de inicio y vencimiento, hora y períodos para tareas no recurrentes;
- subtareas, proyectos, objetivos y subobjetivos jerárquicos;
- breadcrumbs para Objetivos y Proyectos;
- búsqueda simple, búsqueda avanzada, filtros guardados, filtros rápidos y orden persistente por vista;
- recurrencias, selección múltiple y operaciones masivas;
- historial de actividad y estadísticas de proyectos y objetivos;
- PWA instalable con caché de la aplicación, datos locales disponibles sin conexión y sincronización al recuperar conectividad;
- accesibilidad funcional, diálogos propios, selector de color y una interfaz Flat 2.0 consolidada.

## Cierres recientes

### Accesibilidad, editores y consistencia visual — PR #163 a #181

- orden y filtros por vista;
- rediseño del editor de escritorio y adaptación móvil;
- navegación jerárquica mediante breadcrumbs;
- PR #180: creación directa de subtareas con el editor completo, sin persistir borradores cancelados;
- manejo de foco, teclado, estados ARIA, overlays y confirmaciones propias;
- persistencia completa de preferencias a través del backend;
- consolidación de la estructura CSS y de los controles principales.

El documento `docs/design/REDISENO-INTERFAZ-TAREAS.md` se conserva como registro histórico de este bloque.

### Finalización asistida de proyectos — PR #188

Al completar la última subtarea pendiente, la aplicación puede ofrecer completar el proyecto padre. La decisión es explícita y evita cascadas de diálogos en jerarquías anidadas.

### Historial de actividad — PR #189

Registra acciones relevantes sobre tareas, resume operaciones masivas y permite buscar y filtrar por categoría. Se conserva en copias y sincronización; excluye deliberadamente eventos técnicos para evitar ruido.

### Navegación y consistencia visual — PR #190

Se auditó la navegación en escritorio y celular, la geometría de encabezados, los breadcrumbs extensos, las áreas táctiles y el orden de la cascada CSS.

### Estadísticas de proyectos y objetivos — PR #191

Las estadísticas miden progreso por tareas completadas sin convertirlo en un puntaje de productividad. Distinguen avance propio y acumulado, evitan doble conteo y ofrecen períodos de 7, 30, 90, 180 y 365 días, además de todo el historial.

### Ajustes móviles de Actividad — PR #192

Se corrigieron la distribución y el espaciado de los controles de búsqueda y categoría en pantallas pequeñas.

### Fecha de inicio, períodos y búsqueda `activaEn` — PR #193

- `startDate` es opcional e independiente del vencimiento;
- inicio sin vencimiento está permitido;
- si existen ambas fechas, se exige `startDate <= dueDate`;
- fecha de inicio y recurrencia son incompatibles;
- las tareas futuras permanecen fuera de las listas de ejecución hasta comenzar;
- el calendario representa el período completo;
- persistencia, sincronización, copias, orden, filtros y búsqueda avanzada incluyen el nuevo dato;
- `activaEn` localiza tareas cuyo período se superpone con un intervalo consultado.

### PWA instalable y funcionamiento sin conexión — PR #194 y #200 a #203

- manifiesto e íconos de instalación;
- service worker con caché de la aplicación;
- apertura independiente en modo instalado;
- datos locales disponibles sin conexión;
- guía de instalación cuando el navegador no ofrece el diálogo nativo;
- prevención de conflictos entre datos de ejemplo y una nube ya configurada;
- intercepción de Atrás en modo instalado para pedir confirmación antes de salir.

La matriz operativa final quedó verificada en escritorio y Android:

- la aplicación abre, conserva datos y permite cambios sin conexión;
- al recuperar internet, reanuda la sincronización automáticamente, incluso si Android no cambia el foco de la PWA;
- una instalación limpia reemplaza los ejemplos intactos por los datos de la nube sin generar un conflicto falso;
- una versión publicada sustituye la caché anterior;
- la guía manual de instalación funciona cuando el navegador no ofrece el diálogo nativo;
- Atrás muestra el aviso de salida y explica la limitación propia de Android.

### Continuidad de interacción durante la sincronización — PR #199 y #202

- conserva el foco, el texto todavía no enviado y la posición del cursor cuando un render de sincronización reconstruye la interfaz;
- restaura controles repetidos mediante su contenedor estable y mantiene abierto el desplegable correspondiente;
- evita reemplazar formularios y editores con cambios sin guardar;
- conserva la posición vertical de la barra lateral después de completar los ajustes de diseño posteriores al render;
- mantiene abierta la barra lateral móvil y repone su desplazamiento después de los ajustes tardíos de Android;
- mantiene la sincronización y la incorporación de cambios remotos sin congelar de forma general la interfaz.

### Integridad y claridad de tareas — PR #207 y #210 a #219

- la creación desde Objetivos comunica su alcance y hereda el objetivo actual;
- Estadísticas excluye proyectos borrados y sus árboles;
- duplicar subtareas conserva correctamente toda la jerarquía;
- las migraciones técnicas equivalentes se reconcilian sin generar conflictos falsos;
- **Editar objetivo** volvió al encabezado móvil;
- Proyectos ofrece una única acción de alta y calcula su progreso con todas las tareas válidas;
- completar desde la casilla o desde el celular comparte un deshacer contextual;
- las subtareas aisladas muestran su ruta sin duplicarla dentro de Proyectos;
- los contextos se presentan como `@Nombre` con la tipografía en su color configurado.

### Superficies transitorias consistentes

Diálogos, popovers, menús rápidos y selectores comparten tokens de borde, geometría, espaciado, elevación y fondo modal. Se conservaron los cierres existentes por `Escape` y clic exterior, las áreas táctiles móviles y las diferencias funcionales de cada control.

### Herencia de objetivos en proyectos

Al asociar un objetivo a un proyecto, la aplicación lo suma a todas sus tareas descendientes sin eliminar otras asociaciones. Las nuevas subtareas heredan los objetivos de su padre tanto desde el alta rápida como desde el editor completo. Quitar un objetivo del proyecto no lo retira automáticamente de los descendientes, porque podrían haberlo recibido o conservado por una asociación manual.

### Visibilidad de tareas completadas en Objetivos

La vista de un objetivo reutiliza el control de ojo y la preferencia persistente de las demás listas para mostrar u ocultar tareas completadas. Las completadas permanecen ocultas por defecto, mientras que el progreso conserva el total real aunque parte de la lista no esté visible.

### Filtros rápidos y orden por Objetivo

Cada objetivo reutiliza **Herramientas de la lista** para filtrar por área, contexto, etiqueta, prioridad o fecha y ordenar su árbol de tareas. Filtros y orden se guardan con una clave propia por objetivo, participan de las copias y la sincronización de preferencias existentes y no agregan una fila permanente de controles.

### Búsqueda avanzada por proyectos

La búsqueda avanzada admite `esProyecto:si/no` como alias semántico de `tieneSubtareas:si/no`. El criterio `proyecto:"Nombre"` incluye el proyecto coincidente y todas las tareas de su árbol, y puede combinarse con los demás operadores sin agregar controles a los filtros rápidos.

### Atajos de teclado de acción — PR #227

- `Alt+N` abre **Nueva tarea** cuando esa acción está disponible;
- `Alt+B` enfoca y selecciona la búsqueda simple;
- `Alt+C` completa la tarea cuya fila tiene el foco;
- los atajos se ignoran dentro de campos editables y no reemplazan la navegación por teclado ya existente.

### Orden manual mediante arrastre — PR #228

- el arrastre se habilita únicamente con **Orden manual** y sin búsqueda, búsqueda avanzada, filtros ni selección múltiple activos;
- sólo permite reordenar tareas hermanas y nunca cambia el proyecto o `parentTaskId`;
- persiste el resultado en `manualOrder` y normaliza el grupo completo de hermanos, incluso si parte de la lista no está visible;
- en celular utiliza un tirador explícito para no interferir con el desplazamiento vertical;
- los proyectos abiertos disponen de **Filtros rápidos** y **Orden**, de modo que sus subtareas pueden reordenarse con el mismo criterio;
- la función fue verificada manualmente antes de la fusión.

## Etapa operativa actual

Los bloques de eficiencia avanzada sin ruido visual —atajos de acción y orden manual por arrastre— están cerrados. La propiedad local conserva el nombre **Descripción** para distinguirla de las futuras notas vinculadas de Notion. La próxima prioridad aprobada es la integración de Notion como base externa de notas, según `PENDIENTES.md` y el issue #212.

## Fases históricas

1. Fundación.
2. Persistencia.
3. Dominio.
4. UI mínima.
5. Organización.
6. Jerarquía.
7. Búsquedas.
8. Recurrencias.
9. Adjuntos.
10. Historial.
11. Estadísticas.
12. Optimización y distribución.

Las doce fases forman parte de la aplicación. Optimización continúa como una práctica transversal, no como una excusa para reabrir bloques cerrados sin un defecto o necesidad concreta.

## Regla de avance

Cada bloque nuevo debe:

1. partir de `main` actualizado;
2. tener una rama y una PR específicas;
3. conservar compatibilidad con los datos existentes;
4. incluir pruebas automáticas cuando corresponda;
5. pasar una verificación manual del flujo afectado;
6. actualizar `docs/roadmap/PENDIENTES.md` si cambia el trabajo vigente;
7. actualizar este roadmap cuando se cierre una etapa relevante;
8. fusionarse sólo después de la aprobación explícita.
