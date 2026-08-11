# Guía de búsqueda avanzada

La búsqueda avanzada permite encontrar tareas combinando texto, propiedades, fechas, relaciones, adjuntos y condiciones de espera. Se abre desde la barra lateral con **Búsqueda avanzada**. Los criterios se editan en un panel emergente y, al aplicar una consulta válida, los resultados aparecen en la vista central.

## Uso básico

Cada condición tiene la forma:

```text
criterio:valor
```

Ejemplos:

```text
prioridad:alta
fecha:hoy
area:"Trabajo docente"
```

Los nombres y valores no distinguen mayúsculas ni tildes. Cuando un valor contiene espacios, debe escribirse entre comillas.

## Operadores

| Operador | Significado | Ejemplo |
|---|---|---|
| `AND` | Deben cumplirse ambas condiciones | `prioridad:alta AND fecha:hoy` |
| `OR` | Debe cumplirse al menos una condición | `fecha:hoy OR fecha:atrasada` |
| `NOT` | Excluye las coincidencias | `NOT etiqueta:Lectura` |
| `( )` | Agrupa condiciones | `(prioridad:alta OR prioridad:critica) AND fecha:hoy` |
| `" "` | Conserva una frase con espacios | `area:"Trabajo docente"` |

También puede omitirse `AND` entre condiciones consecutivas:

```text
prioridad:alta area:"Trabajo docente"
```

equivale a:

```text
prioridad:alta AND area:"Trabajo docente"
```

## Texto

| Criterio | Qué busca | Ejemplo |
|---|---|---|
| `titulo` | Texto contenido en el título | `titulo:evaluacion` |
| `descripcion` | Texto contenido en la descripción | `descripcion:"revisar bibliografia"` |

Una palabra escrita sin criterio busca tanto en el título como en la descripción:

```text
bibliografia
```

## Organización

| Criterio | Qué busca | Ejemplo |
|---|---|---|
| `area` | Nombre completo del área | `area:"Trabajo docente"` |
| `areaContiene` | Parte del nombre del área | `areaContiene:trabajo` |
| `contexto` | Nombre completo del contexto | `contexto:Escuela` |
| `contextoContiene` | Parte del nombre del contexto | `contextoContiene:esc` |
| `etiqueta` | Una etiqueta determinada | `etiqueta:Importante` |
| `etiquetaContiene` | Parte del nombre de una etiqueta | `etiquetaContiene:import` |
| `tieneEtiquetas` | Si posee alguna etiqueta | `tieneEtiquetas:si` |
| `objetivo` | Título parcial de un objetivo asociado directamente | `objetivo:"Leer clásicos"` |
| `objetivoJerarquia` | Objetivo indicado o cualquiera de sus subobjetivos | `objetivoJerarquia:Lectura` |
| `tieneObjetivos` | Si posee algún objetivo asociado | `tieneObjetivos:si` |
| `objetivoDescripcion` | Texto parcial en la descripción de un objetivo asociado | `objetivoDescripcion:literatura` |
| `objetivoEstado` | Estado del objetivo asociado | `objetivoEstado:activo` |
| `objetivoFecha` | Fecha límite del objetivo asociado | `objetivoFecha:hoy` |
| `objetivoNivel` | Objetivo principal o subobjetivo | `objetivoNivel:subobjetivo` |

Los criterios booleanos aceptan `si` y `no`.

## Adjuntos

| Criterio | Qué busca | Ejemplo |
|---|---|---|
| `tieneAdjuntos` | Tareas que tienen o no tienen archivos adjuntos | `tieneAdjuntos:si` |
| `adjunto` | Coincidencia parcial en el nombre o el tipo del archivo | `adjunto:pdf` |
| `adjuntoContiene` | Variante explícita de la búsqueda parcial por nombre o tipo | `adjuntoContiene:"programa anual"` |

También se admiten los alias en inglés `hasAttachments`, `attachment` y `attachmentContains`.

Ejemplos:

```text
tieneAdjuntos:no
adjunto:"programa anual"
adjunto:image
```

Los criterios de adjuntos se pueden combinar con todos los operadores y con los demás campos:

```text
titulo:clase AND adjunto:pdf
tieneAdjuntos:si AND NOT adjunto:png
```

`adjunto` y `adjuntoContiene` buscan tanto en el nombre como en el tipo MIME. Por ejemplo, `adjunto:image` encuentra archivos cuyo tipo corresponde a una imagen aunque la palabra no aparezca en el nombre.

## Tareas en espera

| Criterio | Qué busca | Ejemplo |
|---|---|---|
| `enEspera` | Tareas marcadas o no marcadas como En espera | `enEspera:si` |

También se admiten los alias en inglés `isWaiting` y `waiting`.

Ejemplos:

```text
enEspera:si
enEspera:no
isWaiting:true
```

El criterio puede combinarse con los demás campos:

```text
enEspera:si AND area:"Trabajo docente"
enEspera:si AND NOT adjunto:pdf
```

Las tareas en espera están ocultas en las listas habituales. Al usar explícitamente `enEspera`, la búsqueda avanzada las incluye en el universo de búsqueda para que puedan encontrarse desde **Todas** y desde los filtros personalizados.

## Prioridad y estado

### Prioridad

Valores admitidos:

- `ninguna`
- `baja`
- `media`
- `alta`
- `critica`

Ejemplo:

```text
prioridad:alta OR prioridad:critica
```

### Estado

Valores admitidos:

- `inbox`
- `pendiente`
- `incompleta` — incluye Inbox y Pendiente
- `completada`
- `archivada`
- `eliminada` o `papelera`

Ejemplo:

```text
estado:incompleta AND prioridad:alta
```

## Fechas de vencimiento

| Criterio | Qué busca | Ejemplo |
|---|---|---|
| `fecha` | Una fecha o situación concreta | `fecha:hoy` |
| `fechaAntes` | Fechas anteriores al valor | `fechaAntes:2026-08-01` |
| `fechaDespues` | Fechas posteriores al valor | `fechaDespues:hoy` |
| `fechaDentro` | Vencimientos dentro de un período futuro | `fechaDentro:"7 dias"` |
| `fechaEntre` | Vencimientos entre dos fechas, inclusive | `fechaEntre:"2026-08-01,2026-08-31"` |
| `tieneFecha` | Presencia o ausencia de fecha | `tieneFecha:no` |
| `hora` | Hora exacta de vencimiento | `hora:"18:30"` |
| `tieneHora` | Presencia o ausencia de hora | `tieneHora:si` |

Valores relativos admitidos para `fecha`:

- `ayer`
- `hoy`
- `manana`
- `atrasada` o `vencida`
- `proxima`
- `sin-fecha`

También pueden usarse los sinónimos `vence`, `venceAntes`, `venceDespues`, `venceDentro` y `venceEntre`.

Ejemplo:

```text
venceEntre:"2026-08-01,2026-08-31"
```

Las fechas pueden escribirse en formatos habituales de Argentina:

```text
fecha:15/08
fecha:15/08/26
fecha:15/08/2026
```

Si se omite el año, se utiliza el año corriente. El formato técnico `AAAA-MM-DD` continúa siendo válido, pero no es obligatorio.

También se admiten comparadores:

```text
fecha:>2026-08-01
fecha:<=2026-08-31
```

También se admiten expresiones relativas:

```text
fecha:hoy
fecha:manana
fecha:"en 3 dias"
fecha:"en 2 semanas"
fecha:viernes
fecha:"proximo viernes"
```

Cuando una expresión contiene espacios, debe escribirse entre comillas. Un nombre de día se interpreta como la próxima aparición de ese día; si coincide con hoy, se refiere a hoy.

Los períodos admiten días o semanas:

```text
fechaDentro:"10 dias"
fechaDentro:"2 semanas"
```

## Fechas de inicio y períodos activos

La fecha de inicio indica desde cuándo una tarea no recurrente está disponible. Puede existir sin fecha de vencimiento. Cuando una tarea posee ambas fechas, su período incluye el día de inicio y el día de vencimiento.

| Criterio | Qué busca | Ejemplo |
|---|---|---|
| `inicio` | Una fecha de inicio concreta | `inicio:hoy` |
| `inicioAntes` | Inicios anteriores al valor | `inicioAntes:15/08/2026` |
| `inicioDespues` | Inicios posteriores al valor | `inicioDespues:hoy` |
| `inicioDentro` | Inicios dentro de un período futuro | `inicioDentro:"7 dias"` |
| `inicioEntre` | Inicios entre dos fechas, inclusive | `inicioEntre:01/08/2026..31/08/2026` |
| `tieneInicio` | Presencia o ausencia de fecha de inicio | `tieneInicio:si` |
| `activaEn` | Tareas cuyo período se superpone con el intervalo consultado | `activaEn:01/08/2026..07/08/2026` |

También se admiten los alias en inglés `start`, `startBefore`, `startAfter`, `startWithin`, `startBetween`, `hasStartDate` y `activeIn`.

`activaEn` recibe dos fechas separadas por `..` o por una coma. Incluye:

- tareas con inicio y vencimiento cuyo período se cruza con el intervalo;
- tareas con sólo inicio, si comienzan antes de que termine el intervalo;
- tareas con sólo vencimiento, si vencen después de que comienza el intervalo;
- tareas recurrentes cuya próxima fecha de vencimiento cae dentro del intervalo.

Las tareas sin inicio ni vencimiento no coinciden. Los extremos se consideran incluidos.

Ejemplos:

```text
inicio:hoy
tieneInicio:no
inicioEntre:01/08/2026..31/08/2026
activaEn:11/08/2026..13/08/2026
activaEn:"hoy..en 7 dias"
```

Los formatos y expresiones relativas son los mismos que para las fechas de vencimiento. Una fecha de inicio no cambia las reglas de En espera: mientras la tarea continúe marcada, permanece fuera de las listas operativas.

## Fechas de creación, modificación y finalización

| Criterio | Ejemplo |
|---|---|
| `creada` | `creada:hoy` |
| `creadaAntes` | `creadaAntes:2026-07-01` |
| `creadaDespues` | `creadaDespues:2026-07-01` |
| `creadaDentro` | `creadaDentro:"30 dias"` |
| `creadaEntre` | `creadaEntre:"2026-07-01,2026-07-31"` |
| `actualizada` | `actualizada:hoy` |
| `actualizadaAntes` | `actualizadaAntes:2026-07-01` |
| `actualizadaDespues` | `actualizadaDespues:2026-07-01` |
| `actualizadaDentro` | `actualizadaDentro:"7 dias"` |
| `actualizadaEntre` | `actualizadaEntre:"2026-07-01,2026-07-31"` |
| `completada` | `completada:hoy` |
| `completadaAntes` | `completadaAntes:2026-07-01` |
| `completadaDespues` | `completadaDespues:2026-07-01` |
| `completadaDentro` | `completadaDentro:"30 dias"` |
| `completadaEntre` | `completadaEntre:"2026-07-01,2026-07-31"` |

En los criterios `Dentro`, las fechas de creación, actualización y finalización miran hacia atrás; `fechaDentro` mira hacia adelante.

Los criterios `Entre` reciben dos fechas separadas por coma y consideran incluidos ambos extremos:

```text
creadaEntre:"2026-07-01,2026-07-31"
```

## Posposiciones

Una **posposición** se registra cada vez que una tarea con fecha de vencimiento se mueve hacia una fecha posterior. Task Engine conserva ese historial para detectar tareas que se postergan reiteradamente.

Ejemplos:

```text
posposiciones:3
```

Busca tareas pospuestas exactamente tres veces.

```text
posposiciones:>3
```

Busca tareas pospuestas más de tres veces.

Comparadores admitidos:

- `>` mayor que
- `<` menor que
- `>=` mayor o igual
- `<=` menor o igual
- `=` igual; puede omitirse

Ejemplo útil para una revisión semanal:

```text
posposiciones:>=3 AND estado:incompleta
```

## Jerarquía y recurrencia

| Criterio | Qué busca | Ejemplo |
|---|---|---|
| `tieneSubtareas` | Tareas padre con subtareas directas | `tieneSubtareas:si` |
| `esSubtarea` | Tareas que dependen de otra | `esSubtarea:si` |
| `recurrente` | Tareas con alguna recurrencia | `recurrente:si` |
| `repeticion` | Una frecuencia determinada | `repeticion:semanal` |

Frecuencias admitidas:

- `diaria`
- `semanal`
- `mensual`

## Ejemplos completos

### Tareas urgentes de trabajo

```text
areaContiene:trabajo AND (prioridad:alta OR prioridad:critica)
```

### Tareas atrasadas que no sean de lectura

```text
fecha:atrasada AND NOT etiqueta:Lectura
```

### Tareas reiteradamente pospuestas

```text
posposiciones:>=3 AND estado:incompleta
```

### Subtareas próximas

```text
esSubtarea:si AND fechaDentro:"7 dias"
```

### Tareas con documentos PDF adjuntos

```text
tieneAdjuntos:si AND adjunto:pdf
```

### Tareas en espera de un área

```text
enEspera:si AND area:"Trabajo docente"
```

### Tareas activas durante una semana

```text
activaEn:"hoy..en 7 dias"
```

### Tareas recurrentes semanales sin contexto

No existe todavía un criterio específico `tieneContexto`. Puede buscarse la recurrencia:

```text
repeticion:semanal
```

y combinarla con los criterios disponibles.

## Alcance de la búsqueda

La consulta se aplica sobre la vista abierta:

- En **Hoy**, busca dentro de Hoy.
- En un **Área**, busca dentro de esa área.
- En **Archivadas** o **Papelera**, busca dentro de esas vistas.
- Las tareas en espera permanecen ocultas salvo que la consulta incluya explícitamente `enEspera`.
- Un Filtro personalizado guardado se abre sobre **Todas**, es decir, sobre las tareas activas; si contiene `enEspera`, también puede recuperar las tareas ocultas por esa marca.
- Para incluir completadas en una vista activa, debe estar activada la opción **Mostrar completadas**.

## Guardar un filtro personalizado

1. Activar **Búsqueda avanzada**.
2. Escribir y ejecutar una consulta válida.
3. Pulsar **Guardar filtro**.
4. Asignarle un nombre.

El filtro aparecerá en la sección **Filtros personalizados** de la barra lateral y se incluirá en las copias de seguridad y en la sincronización.
