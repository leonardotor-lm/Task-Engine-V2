# Guía visual

## Propósito

Esta guía define el criterio visual principal de Task Engine. Su función es mantener una interfaz coherente durante las próximas mejoras y permitir que otros temas visuales cambien la apariencia sin alterar la lógica de uso.

La estética principal responde a **Flat 2.0**: superficies limpias, formas simples y pocos elementos visibles, acompañados por señales suficientes de profundidad, jerarquía e interacción.

## Principio rector

La simplificación visual no implica reducir la complejidad funcional.

Task Engine debe conservar sus capacidades, pero mostrar sólo las que resulten pertinentes para el contexto actual. La interfaz administra la complejidad mediante jerarquía, divulgación progresiva y adaptación al dispositivo.

## Contextos de uso

### Ejecución y concentración

Las vistas destinadas a actuar deben priorizar:

- el título de la tarea o del objetivo;
- el estado y la fecha cuando sean relevantes;
- la próxima acción disponible;
- una navegación breve;
- las alertas que requieran atención inmediata.

Las propiedades secundarias y las operaciones administrativas deben permanecer ocultas hasta que se soliciten.

### Planificación y organización

Las vistas destinadas a revisar o planificar pueden mostrar:

- jerarquías;
- propiedades y asociaciones;
- filtros y ordenamientos;
- progreso;
- acciones de administración;
- información contextual ampliada.

La mayor cantidad de información no debe eliminar la jerarquía visual ni convertir todas las acciones en igualmente prominentes.

## Adaptación por dispositivo

### Celular

- Priorizar consulta, captura y ejecución inmediata.
- Reservar el ancho principal para el contenido.
- Utilizar iconografía en encabezados cuando el significado sea inequívoco.
- Mantener objetivos táctiles amplios.
- Presentar opciones secundarias bajo demanda.
- Evitar barras saturadas y títulos comprimidos.

### Escritorio

- Facilitar planificación, revisión y organización.
- Conservar texto cuando mejora la comprensión y existe espacio suficiente.
- Mostrar más información contextual sin duplicar acciones.
- Mantener agrupadas las herramientas relacionadas.

## Lenguaje Flat 2.0

### Superficies

- Usar fondos planos y diferenciación tonal moderada.
- Reservar las sombras para paneles superpuestos, menús y capas temporales.
- Evitar degradados ornamentales, brillos y efectos tridimensionales intensos.

### Forma

- Emplear geometrías simples y radios consistentes.
- Evitar contornos decorativos sin función.
- Diferenciar controles, tarjetas y paneles mediante un sistema reducido de formas.

### Profundidad

- Comunicar qué elemento está por encima de otro mediante sombra discreta, borde o contraste.
- No depender exclusivamente de la sombra.
- Mantener los contenidos permanentes visualmente más planos que los paneles temporales.

### Color

- Utilizar el color para jerarquía, estado, selección, advertencia y peligro.
- No usar color únicamente como decoración.
- Conservar contraste suficiente entre texto, íconos, fondos y bordes.
- No depender sólo del color para comunicar un estado.
- Definir los valores concretos mediante variables CSS para permitir temas futuros.

### Tipografía y espaciado

- La tipografía debe sostener la jerarquía antes que los bordes o las cajas.
- Los títulos, subtítulos, metadatos y ayudas deben tener niveles reconocibles.
- El espaciado debe agrupar lo relacionado y separar lo diferente.
- La densidad puede variar según el contexto, pero debe mantener una escala consistente.

## Divulgación progresiva

Las herramientas se distribuyen en tres niveles:

1. **Esenciales:** visibles porque permiten comprender o ejecutar la acción principal.
2. **Secundarias:** disponibles en un menú, sección plegable o control de detalles.
3. **Administrativas:** concentradas en editores o vistas de planificación.

Una acción no debe permanecer visible de forma permanente sólo porque exista.

Las operaciones destructivas deben conservar una denominación explícita y una diferenciación visual suficiente. No deben depender de un ícono aislado.

## Iconografía

### Sistema

- Usar una única familia de íconos SVG.
- Mantener trazos simples, redondeados y de grosor uniforme.
- Utilizar `currentColor` para heredar el color del control.
- Evitar emojis, caracteres dependientes del sistema y mezclas de familias.
- Mantener una caja visual, alineación y escala consistentes.
- Permitir que el tema futuro modifique color y grosor sin cambiar el significado.

### Accesibilidad

Todo botón compuesto sólo por un ícono debe incluir:

- un nombre accesible mediante `aria-label`;
- una ayuda visible al mantener el puntero mediante `title`;
- estados de foco reconocibles;
- un área táctil suficiente;
- una indicación clara cuando represente un estado alternable.

El ícono decorativo no debe ser anunciado por separado por los lectores de pantalla.

### Correspondencias iniciales

| Acción | Representación |
| --- | --- |
| Volver | Flecha hacia la izquierda |
| Crear | Signo más |
| Guardar | Símbolo de guardado |
| Editar | Lápiz |
| Mostrar u ocultar detalles | Ojo abierto o cerrado según el estado |
| Más acciones | Tres puntos horizontales |
| Cerrar un panel | Cruz |

Estas correspondencias deben validarse en contexto antes de extenderse a toda la aplicación.

### Acciones que conservan texto

Como criterio inicial, deben conservar texto:

- eliminar definitivamente;
- enviar a la papelera;
- archivar cuando pueda confundirse con guardar;
- cancelar cuando pueda confundirse con volver o cerrar;
- cualquier acción cuyo ícono aislado no resulte inequívoco.

## Estados interactivos

Los controles deben distinguir como mínimo:

- reposo;
- puntero encima;
- foco de teclado;
- pulsación;
- selección o activación;
- desactivación;
- carga cuando corresponda.

Ningún estado debe comunicarse solamente mediante un cambio de color difícil de percibir.

## Arquitectura para temas

- Los colores, radios, sombras, tamaños y espaciados deben migrar progresivamente a variables CSS semánticas.
- Los componentes deben referirse a la función visual de una variable y no a un color específico.
- Los temas futuros podrán sustituir tokens visuales, pero no deben cambiar la jerarquía funcional ni el significado de los íconos.
- La guía define el comportamiento del tema principal; los demás temas deberán conservar accesibilidad y coherencia.

## Criterio de revisión

Antes de incorporar un elemento visible, debe comprobarse:

1. ¿Es necesario en este contexto?
2. ¿Debe estar siempre visible?
3. ¿Tiene la jerarquía adecuada?
4. ¿Su significado es claro sin aprendizaje adicional?
5. ¿Funciona en celular y escritorio?
6. ¿Es accesible mediante teclado y lector de pantalla?
7. ¿Puede adaptarse a un tema futuro?

## Aplicación gradual

La guía se aplicará por etapas:

1. sistema reutilizable de íconos;
2. encabezados móviles de tareas y objetivos;
3. barras de herramientas y acciones rápidas;
4. editores y paneles;
5. consolidación de variables CSS semánticas;
6. revisión integral de densidad, estados y contraste.

Cada etapa debe conservar la funcionalidad existente y contar con pruebas específicas.
