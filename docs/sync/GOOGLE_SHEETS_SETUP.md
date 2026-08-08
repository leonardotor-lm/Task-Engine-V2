# Configuración del backend de Google Sheets

Este backend almacena los datos de Task Engine V2 en Google Sheets y solo puede utilizarse con un token secreto.

## Antes de empezar

Necesitás:

- una cuenta de Google;
- una hoja de cálculo vacía;
- el archivo `google-apps-script/Code.gs` de este repositorio.

La misma aplicación web administra los adjuntos en Google Drive. Los archivos se guardan en una carpeta propia; Google Sheets conserva únicamente sus metadatos.

No publiques el token en GitHub, en capturas de pantalla ni en conversaciones.

## 1. Crear la hoja de cálculo

1. Creá una hoja nueva en Google Sheets.
2. Poné un nombre reconocible, por ejemplo `Task Engine V2 DB`.
3. Copiá su identificador desde la URL.

En esta dirección:

```text
https://docs.google.com/spreadsheets/d/IDENTIFICADOR/edit
```

el identificador es el texto ubicado entre `/d/` y `/edit`.

## 2. Crear el proyecto de Apps Script

1. En la hoja, abrí **Extensiones → Apps Script**.
2. Eliminá el contenido inicial de `Code.gs`.
3. Copiá allí el contenido completo de `google-apps-script/Code.gs`.
4. Guardá el proyecto.

## 3. Generar un token

En la terminal de VS Code podés ejecutar:

```bash
node -e "console.log(crypto.randomUUID() + crypto.randomUUID())"
```

Copiá el resultado y guardalo en un lugar seguro. No lo agregues a ningún archivo del repositorio.

## 4. Configurar las propiedades privadas

1. En Apps Script, abrí **Configuración del proyecto**.
2. En **Propiedades de la secuencia de comandos**, agregá:

| Propiedad | Valor |
|---|---|
| `TASK_ENGINE_SPREADSHEET_ID` | El identificador de la hoja |
| `TASK_ENGINE_TOKEN` | El token secreto generado |

3. Guardá las propiedades.

## 5. Inicializar las hojas internas

1. Volvé al editor.
2. Elegí la función `setupTaskEngine`.
3. Pulsá **Ejecutar**.
4. Aceptá los permisos solicitados por Google.

Cuando se habiliten adjuntos, Google también solicitará permiso para crear y administrar archivos de la carpeta **Mis tareas - Adjuntos**. El backend comprueba que un archivo pertenezca a esa carpeta antes de enviarlo a la papelera.

La hoja de cálculo debería incorporar dos pestañas:

- `TaskEngineData`
- `TaskEngineMeta`

No edites manualmente esas pestañas.

## 6. Publicar como aplicación web

1. Pulsá **Implementar → Nueva implementación**.
2. Elegí **Aplicación web**.
3. Configurá:
   - **Ejecutar como:** tu cuenta;
   - **Quién tiene acceso:** cualquiera.
4. Pulsá **Implementar**.
5. Copiá la URL terminada en `/exec`.

El acceso público a la URL es necesario porque la autenticación se realiza con el token privado. Las solicitudes sin el token correcto son rechazadas.

## 7. Actualizaciones futuras

Cuando cambie `Code.gs`:

1. copiá la nueva versión;
2. abrí **Implementar → Gestionar implementaciones**;
3. editá la implementación;
4. elegí **Nueva versión**;
5. volvé a implementar.

La URL `/exec` se mantiene.

Las actualizaciones que incorporen adjuntos pueden solicitar una nueva autorización de Drive. Si Google la muestra al probar la primera subida, aceptala desde la misma cuenta propietaria del despliegue.

### Actualización del contrato de persistencia

Las versiones del backend que incorporan el esquema de persistencia `2` deben volver a desplegarse en Apps Script. Actualizar solamente el frontend no modifica el código que está ejecutando la URL `/exec`.

El esquema nuevo agrega persistencia explícita para:

- filtros personalizados guardados;
- orden elegido por vista;
- filtros rápidos elegidos por vista.

No hace falta migrar manualmente las filas existentes. Una revisión creada por un backend anterior no contiene la marca de esquema y se interpreta como una revisión histórica que **no conoce** esos datos. Por eso no debe borrar los valores locales actuales. La primera escritura realizada con el backend actualizado crea la marca de esquema y, desde ese momento, los valores vacíos también son significativos: `[]` o `{}` pueden representar una eliminación deliberada.

Este comportamiento depende de mantener la diferencia entre **campo ausente** y **campo presente pero vacío**. No agregues manualmente filas de metadatos ni de preferencias en `TaskEngineData`.

## Estructura de almacenamiento

Cada entidad ocupa una fila con:

- revisión global;
- tipo de entidad;
- identificador;
- versión individual;
- fecha de actualización;
- contenido JSON.

Cada guardado crea una nueva generación y recién después actualiza la revisión activa. Esto evita que una escritura incompleta reemplace la última versión válida.

Los filtros personalizados se almacenan como entidades versionadas, igual que las demás colecciones. Las preferencias por vista se guardan en registros propios de la revisión. Una fila `snapshotMeta` indica qué datos opcionales forman parte de esa revisión y qué versión del contrato de sincronización los describe.

Los archivos adjuntos no se convierten en filas ni se incluyen como texto Base64 en la hoja. Cada tarea conserva sólo el identificador de Drive, nombre, tipo, tamaño, enlace y fecha de creación.

## Resolución de conflictos

Cada subida incluye la última revisión conocida por la aplicación. Si Sheets contiene una revisión más nueva, el servidor devuelve `CONFLICT` y no escribe nada.

El frontend compara el estado local, el remoto y, cuando existe, la última base común sincronizada. Las revisiones históricas que no contienen datos opcionales no se interpretan como una orden de borrarlos.
