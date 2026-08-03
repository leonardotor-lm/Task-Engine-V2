# Guía de búsqueda avanzada

La búsqueda avanzada permite encontrar tareas combinando texto, propiedades, fechas y relaciones. Se abre desde la barra lateral con **Búsqueda avanzada**. Los criterios se editan en un panel emergente y, al aplicar una consulta válida, los resultados aparecen en la vista central.

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
- Un Filtro personalizado guardado se abre sobre **Todas**, es decir, sobre las tareas activas.
- Para incluir completadas en una vista activa, debe estar activada la opción **Mostrar completadas**.

## Funciones todavía no disponibles

La aplicación aún no permite agregar adjuntos. Por ese motivo, la búsqueda avanzada no incluye criterios de adjuntos. Se incorporarán cuando esa funcionalidad exista realmente.

## Guardar un filtro personalizado

1. Activar **Búsqueda avanzada**.
2. Escribir y ejecutar una consulta válida.
3. Pulsar **Guardar filtro**.
4. Asignarle un nombre.

El filtro aparecerá en la sección **Filtros personalizados** de la barra lateral y se incluirá en las copias de seguridad y en la sincronización.
