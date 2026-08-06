# Rediseño de la interfaz de tareas

## Estado actual

- **Tipo:** guía funcional y visual viva.
- **Etapas completadas:** barra contextual, simplificación de la barra lateral, adaptación principal de la lista en celular y consolidación inicial del CSS de esta interfaz.
- **Siguiente etapa:** persistencia del orden por vista.
- **Etapas posteriores:** rediseño del editor de escritorio, adaptación específica del editor móvil y revisión integral de accesibilidad.
- **Criterio general:** adaptar patrones útiles a Task Engine sin copiar funciones ni estructuras que no correspondan a la aplicación.

## Objetivo

Organizar la interfaz para que cada herramienta aparezca cerca del contenido sobre el que actúa, reducir el ruido visual y simplificar el editor de tareas sin eliminar capacidades.

El rediseño prioriza:

- acceso rápido a funciones frecuentes;
- separación entre navegación, herramientas de lista y edición;
- divulgación progresiva de propiedades secundarias;
- soluciones específicas para escritorio y celular;
- persistencia local de preferencias de presentación;
- accesibilidad mediante teclado, foco visible y nombres accesibles;
- uso de variables CSS semánticas para facilitar futuros temas visuales.

# 1. Implementación completada

## Barra contextual de la lista

La lista dispone de una barra superior que reúne:

- selección múltiple;
- filtros;
- orden;
- mostrar u ocultar detalles;
- mostrar u ocultar tareas completadas;
- acceso al estado En espera cuando corresponde a un área.

### Escritorio

- La barra permanece visible y abierta.
- Se encuentra vinculada al encabezado y a la lista actual.
- Los controles equivalentes fueron retirados de la barra lateral.

### Celular

- La barra aparece contraída inicialmente.
- Recuerda el último estado elegido.
- Se expande automáticamente durante la selección múltiple.
- El encabezado Herramientas se mantiene compacto.

## Barra lateral

La barra lateral se concentra principalmente en:

- navegación entre vistas;
- áreas;
- planificación;
- historial;
- filtros guardados;
- configuración;
- estado de sincronización.

Áreas, Planificación e Historial funcionan como grupos independientes y recuerdan su estado. Áreas y Planificación aparecen desplegados inicialmente.

## Creación de tareas

- El botón Nueva tarea abre directamente el editor.
- No existe un campo intermedio redundante para escribir el nombre.
- La nueva tarea se mantiene como borrador no persistido hasta confirmar Crear tarea.
- Cerrar el editor descarta el borrador sin dejar tareas residuales.
- En celular, Nueva tarea se presenta como botón flotante en la esquina inferior derecha.

## Organización CSS

Los estilos de la barra contextual, la distribución lateral vinculada y la adaptación principal móvil se consolidaron en `styles/task-interface.css`.

La organización futura debe hacerse por componente o zona funcional estable, no mediante un archivo nuevo por cada PR o corrección puntual. Los componentes deben consumir variables semánticas para que un futuro tema visual pueda cambiar colores, superficies, bordes y tipografía sin reescribir la estructura.

# 2. Siguiente etapa: persistencia del orden

## Decisión tomada

El orden se persistirá **por vista**, no como una única preferencia global.

Esto permite, por ejemplo:

- ordenar Hoy por fecha;
- ordenar Inbox por creación;
- ordenar un área por prioridad;
- conservar una preferencia diferente en otra área.

## Datos que deben persistirse

- criterio de orden;
- dirección ascendente o descendente cuando corresponda;
- clave estable de la vista actual.

## Alcance

- La preferencia es local y pertenece a la presentación.
- No se sincroniza como dato de dominio.
- Debe restaurarse al recargar, cerrar y volver a abrir la aplicación, o navegar y regresar a la vista.
- Si una preferencia almacenada deja de ser válida, la aplicación debe usar el orden predeterminado sin romper la vista.
- Las áreas deben distinguirse mediante su identificador estable.

## Criterios de aceptación

- Cambiar el orden actualiza la lista inmediatamente.
- Salir de una vista y regresar restaura su orden.
- Recargar la aplicación conserva el orden.
- Cambiar el orden de una vista no modifica el de otra.
- No se altera la búsqueda, los filtros ni el orden manual existente.

# 3. Editor de tareas: criterio general pendiente

El editor debe dejar de comportarse como un formulario largo cuyos campos parecen igualmente importantes. La jerarquía prevista es:

1. contexto de la tarea;
2. título;
3. descripción;
4. propiedades frecuentes;
5. contenido y relaciones adicionales;
6. acciones principales;
7. operaciones administrativas o destructivas.

Título y descripción deben dominar visualmente. Las propiedades secundarias deben presentarse como controles compactos que abren selectores o paneles internos.

# 4. Editor de escritorio

## Estructura orientativa

```text
[ Área ▼ ] [ Contexto ▼ ]                              [ × ]

Título de la tarea

Descripción

[ Prioridad ] [ Fecha ] [ Etiquetas ] [ Objetivos ] [ Más ··· ]

[ Adjuntos ] [ Subtareas ] [ Opciones avanzadas ]

──────────────────────────────────────────────────────────

[ Completar ]                              [ Guardar cambios ]
```

## Reglas

- Área y Contexto deben funcionar como selectores compactos.
- El título debe ser el campo principal.
- La descripción debe disponer de una superficie amplia y simple.
- Prioridad, fecha, etiquetas, objetivos y En espera pueden mostrarse como propiedades frecuentes.
- Adjuntos, subtareas, recurrencia y organización deben abrirse bajo demanda.
- Escape y clic exterior deben conservar la confirmación de cambios sin guardar.
- Guardar debe ser la acción primaria.
- Completar debe ser una acción secundaria destacada.
- Archivar y Papelera deben quedar visualmente separados de Guardar.

# 5. Editor móvil

## Forma general

- Superficie casi de pantalla completa o hoja ascendente amplia.
- Adaptación propia, no simple compresión del editor de escritorio.
- Desplazamiento interno cuando sea necesario.
- Título y descripción con prioridad visual.

## Barra inferior

Debe contener pocos accesos frecuentes y una acción principal. La composición inicial a validar es:

- completar;
- prioridad;
- fecha;
- etiquetas;
- adjuntos;
- Guardar.

No deben acumularse tantos íconos que la barra vuelva a saturarse.

## Paneles secundarios

Propiedades como etiquetas, fecha, prioridad, objetivos, adjuntos y recurrencia pueden abrir paneles secundarios dentro del mismo flujo. Estos paneles deben conservar los cambios, gestionar el foco y evitar diálogos superpuestos.

# 6. Accesibilidad

Las etapas restantes deben verificar:

- navegación completa mediante teclado;
- orden lógico y devolución del foco;
- `aria-label` y `title` en controles con sólo ícono;
- `aria-expanded` y `aria-pressed` en controles alternables;
- foco visual común y suficiente contraste;
- objetivos táctiles adecuados en celular;
- ausencia de información comunicada sólo mediante color;
- respeto por movimiento reducido;
- confirmación de cambios sin guardar desde todos los mecanismos de cierre.

# 7. Orden de implementación restante

## Etapa 3 — Persistencia del orden

- Implementar almacenamiento por vista.
- Validar navegación, recarga y reapertura.
- Mantener valores predeterminados seguros.

## Etapa 4 — Editor de escritorio

- Reorganizar encabezado, contenido, propiedades y acciones.
- Incorporar controles compactos y divulgación progresiva.
- Mantener toda la funcionalidad actual.

## Etapa 5 — Editor móvil

- Implementar la distribución móvil específica.
- Incorporar barra inferior y paneles secundarios.
- Validar teclado, foco y desplazamiento.

## Etapa 6 — Accesibilidad y limpieza

- Verificación integral de teclado y lector de pantalla.
- Ajustes de contraste, estados y áreas táctiles.
- Eliminar estilos y componentes antiguos que ya no se utilicen.
- Actualizar pruebas y documentación.

# 8. Decisiones todavía abiertas

Antes del rediseño del editor deben resolverse:

1. si la búsqueda se traslada a la barra superior;
2. qué accesos permanecen en la barra inferior móvil;
3. si En espera aparece entre las propiedades frecuentes o dentro de Más opciones;
4. si Archivar permanece visible en escritorio;
5. si el editor móvil será hoja casi completa o pantalla completa;
6. qué propiedades se consideran realmente frecuentes según el uso cotidiano.

# 9. Criterios de aceptación generales

- La barra lateral permanece limpia y orientada a navegación.
- Las herramientas de lista se encuentran junto a la lista.
- Cada vista recuerda su orden.
- Título y descripción dominan el editor futuro.
- Las propiedades secundarias siguen disponibles sin saturar la pantalla.
- Escritorio y celular presentan soluciones adaptadas.
- Las acciones destructivas permanecen explícitas y separadas.
- No se pierde ningún flujo de edición, adjuntos, subtareas, recurrencia, espera, objetivos o eliminación.
- La interfaz es operable mediante teclado y conserva nombres accesibles.