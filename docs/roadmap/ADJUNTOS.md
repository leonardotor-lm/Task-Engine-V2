# Adjuntos: implementación y verificación

## Estado

La base técnica de Google Drive fue incorporada en la PR #156. La etapa de interfaz queda implementada en este bloque y debe verificarse manualmente antes de marcar **Adjuntos** como terminado en `PENDIENTES.md`.

## Alcance implementado

- Sección **Adjuntos** contraída dentro del editor de tareas.
- Listado con nombre, tamaño y apertura del archivo en Google Drive.
- Carga múltiple con un máximo de diez archivos de 3 MB por tarea.
- Retiro de un adjunto desde el editor y envío del archivo a la papelera de Drive.
- Conservación de los archivos cuando la tarea sólo se envía a la papelera de la aplicación.
- Envío de todos los adjuntos a la papelera de Drive antes de eliminar definitivamente una tarea, una selección o toda la papelera.
- Bloqueo seguro de la eliminación definitiva cuando hay adjuntos y la sincronización no está configurada.
- Mensaje explícito en el editor cuando falta configurar la conexión.
- Búsqueda avanzada por presencia, nombre o tipo de adjunto, compatible con `AND`, `OR`, `NOT`, paréntesis y filtros guardados.

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

## Requisito de despliegue

Antes de probar la carga o el retiro de archivos hay que actualizar el despliegue activo de Apps Script con la versión actual de `google-apps-script/Code.gs`. La interfaz puede listar y abrir metadatos existentes sin conexión, pero las operaciones sobre Drive requieren URL y token de sincronización configurados.

## Verificación manual

1. Redeplegar Apps Script y conservar la misma URL del despliegue, si corresponde.
2. Abrir una tarea activa y desplegar **Adjuntos**.
3. Subir un archivo pequeño y comprobar que aparece en la lista.
4. Abrirlo desde la aplicación y verificar que corresponde al archivo de Drive.
5. Quitar el archivo y confirmar que pasa a la papelera de Drive.
6. Adjuntar otro archivo, enviar la tarea a la papelera y comprobar que el archivo se conserva.
7. Eliminar definitivamente la tarea y comprobar que el archivo pasa a la papelera de Drive.
8. Probar `tieneadjuntos:sí`, `adjunto:pdf` y una combinación con `AND` o `NOT`.
9. Repetir la carga y la apertura en celular.
