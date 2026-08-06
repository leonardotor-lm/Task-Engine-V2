# Tareas en espera

## Objetivo

Las tareas en espera representan asuntos incompletos que no pueden ejecutarse todavía porque dependen de una condición externa: disponer de dinero o tiempo, recibir una respuesta, obtener una autorización o esperar que ocurra otro hecho.

La espera es una propiedad adicional de la tarea (`isWaiting`), no un estado nuevo. La tarea conserva su estado `INBOX` o `PENDING`, su área, fecha, prioridad y demás datos.

## Reglas de visibilidad

- Las tareas en espera aparecen en la vista específica **En espera**.
- Se ocultan de Inbox, Hoy, Mañana, Próximas, Todas y Calendario.
- También se ocultan de proyectos y objetivos para que no entren en el flujo operativo cotidiano.
- En las vistas de áreas se ocultan por defecto.
- Cada vista de área ofrece **Mostrar en espera** y **Ocultar en espera**. La opción es temporal y vuelve a ocultarse al entrar nuevamente al área.
- Los contadores de las vistas habituales no incluyen tareas en espera.
- El contador de **En espera** incluye todas las tareas activas marcadas con esa propiedad.

## Edición

El editor de tareas incorpora la casilla **En espera**. Al guardarla:

- la tarea desaparece de la lista operativa actual;
- queda disponible en la vista En espera;
- conserva su fecha, área, contexto, etiquetas, objetivos y adjuntos.

Una tarea nueva creada desde la vista En espera nace marcada automáticamente.

## Ciclo de vida

- Sólo una tarea incompleta puede estar en espera.
- Al completar, archivar o enviar a la papelera una tarea, la marca se elimina.
- Reactivar o restaurar una tarea no vuelve a marcarla automáticamente como en espera.
- Una fecha vencida no hace reaparecer la tarea en Hoy mientras continúe en espera.
- Las subtareas se marcan individualmente: poner una subtarea en espera no obliga a poner en espera a su tarea principal.

## Búsqueda avanzada

Criterios admitidos:

```text
enEspera:si
enEspera:no
isWaiting:true
waiting:false
```

Se combinan con los demás criterios y operadores:

```text
enEspera:si AND area:"Trabajo docente"
enEspera:si AND adjunto:pdf
enEspera:si AND NOT prioridad:baja
```

Una búsqueda que incluye explícitamente `enEspera` puede recuperar las tareas ocultas desde Todas y desde un filtro personalizado guardado.

## Verificación manual

1. Crear una tarea normal y marcarla En espera desde el editor.
2. Confirmar que desaparezca de la vista original y aparezca en En espera.
3. Comprobar que no figure en Hoy, Todas ni Calendario aunque tenga fecha.
4. Asignarle un área y verificar que esté oculta al abrir esa área.
5. Pulsar Mostrar en espera y comprobar que aparezca con la identificación correspondiente.
6. Volver a entrar al área y comprobar que vuelva a quedar oculta.
7. Quitar la marca y verificar que regrese a la lista que le corresponda.
8. Crear una tarea directamente desde En espera y comprobar que nazca marcada.
9. Probar `enEspera:si`, `enEspera:no` y una combinación con otro criterio.
10. Completar, archivar y eliminar tareas de prueba para confirmar que la marca se limpia.
