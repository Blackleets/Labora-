# Aceptación de recuperación de contraseña

Implementación: Login → ¿Olvidaste tu contraseña? → correo → enlace → nueva contraseña → Volver a entrar. Android abre el enlace en la web canónica y usa la contraseña nueva al volver al APK. No hay deep link nativo añadido.

## Configuración a verificar

- Supabase Auth debe permitir exactamente https://blackleets.github.io/Labora-/ como retorno y tener un Site URL de producción correcto. No añadir wildcards amplios ni exponer localhost en producción.
- La plantilla de recuperación debe conservar ConfirmationURL del proveedor. Verificar entrega/SMTP y límites en el proyecto; que el proveedor email esté activo no demuestra entrega.
- La protección de contraseñas filtradas sigue pendiente según Security Advisor. Consultar https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.

## Prueba con una cuenta controlada

1. Solicitar el enlace desde la pantalla nueva; comprobar bandeja/spam, destino HTTPS correcto y ausencia de información que revele si otra cuenta existe.
2. Abrirlo en móvil y escritorio. Debe aparecer Nueva contraseña antes de cualquier expediente. No copiar ni registrar el enlace, tokens o contraseñas en capturas, logs, PRs o chat.
3. Probar contraseña corta, campos diferentes y rechazo por política del servidor. El formulario conserva valores para corregir y no muestra éxito falso.
4. Guardar una contraseña permitida elegida por el usuario; comprobar el éxito y Volver a entrar. Confirmar acceso con la nueva contraseña y rechazo de la anterior.
5. Probar enlace vencido/usado y recarga de la pantalla de recuperación: pedir otro enlace, sin mostrar el expediente previo. La ruta #password-recovery contiene solo un marcador sin secretos.
6. Tener otra cuenta abierta en otra pestaña: el cambio debe aplicarse exclusivamente a la cuenta del enlace, manteniendo el aislamiento de expedientes. No ejecutar con cuentas ajenas.
7. Probar fallo de red al solicitar, verificar, guardar y salir; no mostrar envío/cambio/salida confirmados sin respuesta. No registrar la contraseña ni el URL completo como evidencia.
8. En Android físico: teclado, scroll, campos sin desborde, volver atrás, abrir correo en navegador y volver al APK para iniciar sesión. Comprobar también login y confirmación de registro normales tras el cambio de routing.

## Evidencia actual

Pruebas de servicios y handlers/effects: PASS. GET Auth settings: HTTP 200; email habilitado y confirmación requerida. Entrega de correo, enlace real, contraseña cambiada y recorrido Android físico: PENDIENTES. No sustituir esta aceptación por CI, mocks o la compilación del APK.
