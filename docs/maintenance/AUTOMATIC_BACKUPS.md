# Respaldos automáticos y mantenimiento preventivo

## Alcance

El mantenimiento diario crea una copia JSON verificada de la revisión activa antes de evaluar si corresponde compactar el historial. Ningún dato de usuario se elimina automáticamente. La rotación afecta únicamente archivos de respaldo antiguos y los envía a la papelera de Google Drive, desde donde pueden recuperarse.

## Organización en Google Drive

La base debe permanecer dentro de la carpeta `Task Engine V2`. Apps Script localiza esa carpeta a partir del archivo de Google Sheets y mantiene esta jerarquía:

```text
Task Engine V2/
└── Mantenimiento y respaldos/
    └── <nombre de la base> — <8 primeros caracteres del ID>/
        ├── Automáticos/
        ├── Mensuales/
        ├── Previos a compactación/
        ├── Diagnósticos/
        └── Manuales/
```

El nombre y un fragmento estable del ID de la hoja separan las instalaciones aunque dos usuarios utilicen títulos parecidos.

## Frecuencia y conservación

- **Automáticos:** una copia por día y revisión; se conservan las 45 más recientes.
- **Mensuales:** el primer día de cada mes; se conservan las 12 más recientes.
- **Previos a compactación:** se crean antes de reemplazar la hoja histórica y se conservan las 20 más recientes.
- **Diagnósticos:** registran el resultado de cada mantenimiento y el inventario de activadores de Apps Script; se conservan los 90 más recientes.
- **Manuales:** no tienen rotación automática.

Si el mantenimiento se ejecuta nuevamente el mismo día sobre la misma revisión, reutiliza la copia existente en lugar de duplicarla.

## Verificación de integridad

Antes de guardar una copia se valida el formato, la versión, las colecciones, los identificadores y las referencias. Después de crear el archivo, Apps Script vuelve a leerlo desde Drive, lo valida y comprueba que su contenido coincida con el original. Una falla impide continuar con la compactación.

## Puesta en marcha

Después de copiar `MaintenanceBackups.gs` y actualizar `Code.gs` en el proyecto de Apps Script:

1. ejecutar una vez `installTaskEngineMaintenance()` para instalar o renovar el activador diario de las 03:00;
2. ejecutar manualmente `runTaskEngineMaintenance()`;
3. autorizar el acceso a Google Drive si Google lo solicita;
4. comprobar que aparezcan un respaldo en `Automáticos` y un registro en `Diagnósticos`.

## Copia manual

La función `createTaskEngineManualBackup()` crea una copia verificada en `Manuales` sin aplicar rotación automática.

## Restauración segura

La restauración nunca se ejecuta automáticamente.

1. obtener el ID del archivo JSON elegido;
2. ejecutar `inspectTaskEngineBackup("ID")` y revisar que informe `valid: true` y cantidades razonables;
3. ejecutar `restoreTaskEngineBackupFromDrive("ID")` solamente después de confirmar el archivo;
4. sincronizar Task Engine y verificar los datos restaurados.

Antes de restaurar, el sistema crea una copia de seguridad de la revisión vigente en `Manuales`. La restauración se registra como una revisión nueva, de modo que no reemplaza silenciosamente el historial anterior.
