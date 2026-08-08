# Adjuntos: implementación y verificación

## Estado

**Terminado.**

La base técnica de Google Drive fue incorporada en la PR #156 y la etapa de interfaz, eliminación y búsqueda avanzada en la PR #157. La integración posterior con los editores rediseñados de escritorio y celular quedó consolidada en las PR #166 y #167.

Este documento se conserva como referencia operativa y de verificación; Adjuntos ya no forma parte de `PENDIENTES.md` como trabajo activo.

## Alcance implementado

- Sección **Adjuntos** dentro del editor de tareas.
- Disponibilidad también durante la creación de una tarea, conservando los archivos al guardar y limpiando el borrador al cancelar.
- Listado con nombre, tamaño y apertura del archivo en Google Drive.
- Carga múltiple con un máximo de diez archivos de 3 MB por tarea.
- Retiro de un adjunto desde el editor y envío del archivo a la papelera de Drive.
- Conservación de los archivos cuando la tarea sólo se envía a la papelera de la aplicación.
- Envío de todos los adjuntos a la papelera de Drive antes de eliminar definitivamente una tarea, una selección o toda la papelera.
- Bloqueo seguro de la eliminación definitiva cuando hay adjuntos y la sincronización no está configurada.
- Mensaje explícito cuando falta configurar la conexión.
- Búsqueda avanzada por presencia, nombre o tipo de adjunto, compatible con `AND`, `OR`, `NOT`, paréntesis y filtros guardados.
- Presentación adaptada a escritorio y celular.

## Sintaxis de búsqueda

- `tieneadjuntos:sí`
- `tieneadjuntos:no`
- `hasattachments:true`
- `adjunto:pdf`
- `adjunto:"programa anual"`
- `attachment:image`
- `titulo:clase AND adjunto:pdf`
- `tieneadjuntos:sí AND NOT adjunto:png`

`adjunto` y `attachment` buscan coincidencias parciales tanto en el nombre como en el tipo MIME del archivo.

## Requisito operativo

Las operaciones sobre Drive requieren que el despliegue activo de Apps Script corresponda a la versión actual de `google-apps-script/Code.gs` y que URL y token de sincronización estén configurados.

## Prueba de regresión recomendada

Cuando se modifique el editor, la sincronización o el backend:

1. abrir una tarea y desplegar **Adjuntos**;
2. subir un archivo pequeño y comprobar que aparece;
3. abrirlo y verificar que corresponde al archivo de Drive;
4. quitarlo y confirmar que pasa a la papelera de Drive;
5. adjuntar otro archivo, enviar la tarea a la papelera y comprobar que el archivo se conserva;
6. eliminar definitivamente la tarea y comprobar que el archivo pasa a la papelera de Drive;
7. probar `tieneadjuntos:sí`, `adjunto:pdf` y una combinación con `AND` o `NOT`;
8. repetir carga, apertura y retiro en celular.
