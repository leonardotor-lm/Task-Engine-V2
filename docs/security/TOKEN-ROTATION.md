# Rotación del token de sincronización

El token permite leer y reemplazar los datos almacenados mediante Google Apps Script. No debe copiarse en GitHub, documentos compartidos, capturas ni mensajes.

## Cuándo rotarlo

- Si fue mostrado o compartido accidentalmente.
- Si un dispositivo configurado se perdió o dejó de ser confiable.
- Como mantenimiento preventivo periódico.
- Antes de permitir el acceso a otra persona o dispositivo.

## Procedimiento

1. Generar un token nuevo y aleatorio desde una terminal confiable:

   ```bash
   openssl rand -hex 32
   ```

2. Abrir el proyecto de Google Apps Script.
3. Entrar en **Configuración del proyecto → Propiedades de la secuencia de comandos**.
4. Reemplazar el valor de `TASK_ENGINE_TOKEN` por el token nuevo y guardar.
5. Abrir Task Engine en cada dispositivo autorizado.
6. En **Sincronización**, pegar el nuevo token y guardar la conexión.
7. Probar **Descargar de la nube**, modificar una tarea y luego **Subir a la nube**.
8. Borrar cualquier copia temporal del token.

## Efecto

El token anterior deja de funcionar inmediatamente al cambiar la propiedad de Apps Script. No es necesario modificar el código, crear otra hoja ni cambiar la URL de la aplicación web.

## Reglas

- No escribir el token dentro de `Code.gs`, archivos JavaScript o documentación.
- No incluirlo en URLs.
- No reutilizar contraseñas personales.
- No registrar el token en la consola.
- Si la prueba falla, revisar primero que el valor sea idéntico en Apps Script y en la configuración local.
