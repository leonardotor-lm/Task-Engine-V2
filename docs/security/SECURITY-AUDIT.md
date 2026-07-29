# Auditoría de seguridad

Fecha de cierre: 29 de julio de 2026.

## Alcance

La revisión abarca el frontend público en GitHub Pages, el cliente de sincronización, el backend de Google Apps Script, la documentación operativa y el historial accesible de las ramas del repositorio.

## Controles verificados

- El token no se incluye en URLs: se elimina cualquier parámetro heredado y se envía dentro del cuerpo de solicitudes `POST`.
- La configuración exige HTTPS y un token no vacío.
- Apps Script obtiene el secreto desde `PropertiesService` y rechaza solicitudes sin un token válido.
- Las solicitudes tienen límites de tamaño y las entidades se validan antes de guardarse.
- Existe control de frecuencia para solicitudes autenticadas, con bloqueo para evitar actualizaciones concurrentes del contador.
- Los registros de rechazo sólo incluyen evento, código y método; no registran token ni contenido.
- El navegador aplica una política de seguridad de contenido, bloquea scripts inline, restringe conexiones y no envía información de referencia.
- El procedimiento de rotación y revocación del token está documentado.
- El token guardado no se inserta en el HTML de la interfaz.

## Verificaciones realizadas

- Búsqueda heurística de tokens, claves de API, credenciales de GitHub y claves privadas en los archivos actuales.
- Revisión equivalente sobre el historial accesible de todas las ramas remotas.
- Ejecución de 47 pruebas específicas de navegador, Apps Script, token, sincronización e interfaz.

Resultado: no se detectaron credenciales reales y todas las pruebas finalizaron correctamente.

## Riesgos residuales aceptados

### Token en almacenamiento local

El token permanece en `localStorage` para sostener la sincronización automática. Puede quedar expuesto ante una extensión maliciosa, acceso al perfil del navegador o una futura vulnerabilidad de inyección de scripts.

Este riesgo se acepta para el uso personal actual. La aplicación no debe configurarse en dispositivos o perfiles compartidos. Ante una sospecha de exposición, debe rotarse el token.

### Backend y credencial compartida

La URL de Apps Script es pública y el token funciona como credencial portadora: quien obtenga ambos datos puede leer o reemplazar la información sincronizada.

No deben publicarse en el repositorio, capturas, mensajes ni documentos compartidos. La rotación documentada es el mecanismo de revocación.

### Límites de Google Apps Script

El control de frecuencia propio se aplica después de autenticar la solicitud. Reduce errores o abuso desde un cliente autorizado, pero no sustituye los límites de la plataforma ni impide por sí solo intentos anónimos contra un endpoint público.

## Comprobación operativa pendiente

El repositorio no permite determinar qué versión de `google-apps-script/Code.gs` está efectivamente desplegada en la cuenta de Google.

Antes de considerar verificado el entorno productivo se debe:

1. copiar la versión actual de `google-apps-script/Code.gs` en el proyecto de Apps Script;
2. crear una nueva versión del despliegue;
3. comprobar una descarga y una subida desde la aplicación;
4. confirmar que objetivos, tareas y demás colecciones se conservan.

## Dictamen

La implementación versionada cuenta con una base de seguridad adecuada para el uso personal previsto y es compatible con GitHub Pages. No se requiere una reescritura ni una migración del backend.

La auditoría del código queda cerrada. La seguridad operativa queda condicionada a confirmar que el despliegue de Apps Script utiliza la versión actual.
