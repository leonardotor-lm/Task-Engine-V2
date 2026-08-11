# Rediseño de la interfaz de tareas

## Estado

- **Tipo:** registro histórico y referencia de diseño.
- **Estado del bloque:** completado.
- **Implementación principal:** PR #163 a #181.
- **Trabajo vigente:** consultar `docs/roadmap/PENDIENTES.md`.

Este documento conserva los criterios que guiaron el rediseño. No debe utilizarse como lista de tareas pendientes.

## Objetivo cumplido

El rediseño reorganizó la interfaz para que cada herramienta aparezca cerca del contenido sobre el que actúa, redujo el ruido visual y simplificó el editor sin eliminar capacidades.

Los criterios consolidados son:

- acceso rápido a las funciones frecuentes;
- separación entre navegación, herramientas de lista y edición;
- divulgación progresiva de propiedades secundarias;
- soluciones adaptadas para escritorio y celular;
- persistencia de preferencias de presentación;
- accesibilidad mediante teclado, foco visible y nombres accesibles;
- variables CSS semánticas que permitan incorporar temas visuales en el futuro.

## Resultados implementados

### Barra contextual de la lista

La barra superior reúne:

- selección múltiple;
- filtros rápidos;
- orden;
- mostrar u ocultar detalles;
- mostrar u ocultar tareas completadas;
- acceso temporal a tareas En espera dentro de un área.

En escritorio permanece visible. En celular se contrae para reducir ruido y se expande cuando el contexto de uso lo requiere.

### Barra lateral

La barra lateral quedó orientada principalmente a:

- navegación entre vistas;
- áreas;
- planificación;
- historial y estadísticas;
- filtros guardados;
- configuración;
- estado de sincronización.

Las herramientas que afectan sólo a una lista se trasladaron a la barra contextual.

### Orden y preferencias por vista

El criterio de orden y su dirección se conservan por vista mediante una clave estable. Cada vista puede mantener una preferencia diferente sin alterar el orden manual ni los filtros de las demás.

Las preferencias de presentación relevantes se incluyen en la persistencia y sincronización con compatibilidad para datos anteriores.

### Creación y edición de tareas

- Nueva tarea abre directamente el editor.
- Una tarea nueva permanece como borrador hasta confirmar su creación.
- Cancelar descarta el borrador sin dejar tareas residuales.
- Título y descripción conservan la mayor jerarquía visual.
- Área, contexto, prioridad, fechas, etiquetas, objetivos, recurrencia, espera, adjuntos y movimiento se organizan en controles compactos o paneles bajo demanda.
- Guardar es la acción principal.
- Completar, archivar, enviar a Papelera y eliminar definitivamente mantienen una jerarquía y separación acordes con su alcance.
- Escape, clic exterior y controles de cierre respetan la confirmación de cambios sin guardar.

### Editor de escritorio

El editor de escritorio aprovecha el ancho disponible para agrupar propiedades frecuentes en una composición compacta. Las relaciones y acciones secundarias se abren bajo demanda, sin convertir la pantalla en un formulario largo.

### Editor móvil

El editor móvil es una adaptación específica, no una compresión automática del escritorio:

- usa una superficie amplia con desplazamiento interno;
- prioriza título y descripción;
- mantiene acciones frecuentes accesibles;
- abre las propiedades secundarias en paneles compatibles con pantallas pequeñas;
- conserva áreas táctiles suficientes y evita desbordes.

### Navegación jerárquica

Objetivos y Proyectos usan breadcrumbs basados en la relación real de parentesco. En Proyectos, la raíz conserva el contexto de origen, incluido un filtro guardado, y permite restaurarlo por identidad.

### Accesibilidad y consistencia

El cierre del bloque verificó:

- navegación por teclado;
- orden lógico y devolución del foco;
- nombres accesibles y estados ARIA;
- foco visible y contraste;
- objetivos táctiles móviles;
- overlays y diálogos propios;
- viewports extremos y jerarquías largas;
- ausencia de información dependiente sólo del color;
- confirmación coherente ante cambios sin guardar.

### Organización CSS

Los estilos se organizan por zonas funcionales estables y consumen variables semánticas. La arquitectura evita crear un archivo por corrección puntual y mantiene preparado el sistema para futuros temas sin duplicar la estructura.

## Decisiones que quedaron cerradas

1. La búsqueda avanzada permanece como herramienta explícita y no invade la cabecera principal.
2. La barra móvil muestra pocas acciones frecuentes y deriva el resto a paneles.
3. En espera se mantiene como propiedad accesible desde el editor y como vista propia.
4. Las acciones administrativas se separan visualmente de Guardar.
5. El editor móvil utiliza una composición propia de pantalla pequeña.
6. La frecuencia de uso y el contexto determinan qué propiedades quedan visibles.
7. Los breadcrumbs son la navegación jerárquica principal para Objetivos y Proyectos.

## Criterios permanentes de regresión

- La barra lateral debe permanecer orientada a navegación.
- Las herramientas de lista deben actuar sobre la vista visible y conservar sus preferencias.
- Título y descripción deben dominar el editor.
- Las propiedades secundarias deben seguir disponibles sin saturar la superficie.
- Escritorio y celular deben conservar paridad funcional con distribuciones adaptadas.
- Las acciones destructivas deben ser explícitas y estar separadas.
- Ninguna mejora visual puede perder flujos de adjuntos, subtareas, recurrencia, espera, objetivos, movimiento o eliminación.
- La interfaz debe seguir siendo operable mediante teclado y conservar nombres accesibles.
