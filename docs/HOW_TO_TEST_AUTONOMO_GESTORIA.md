# Cómo probar: autónomo → gestoría (gastos)

Checklist corta. **No marques PASS** sin dos cuentas reales vinculadas.

## Preparación

1. Cuenta **A** = Autónomo (rider). Cuenta **B** = Gestoría (manager).
2. En B: Perfil → **Tus clientes** → copia el correo.
3. En A: Perfil → **Tu gestoría** → pega el correo de B y vincula.
4. Confirma que B ve a A en la lista de clientes.

## Flujo foto → gasto → auditoría

1. **A** → Dinero → **Repostaje** o **Escanear**.
2. Sube una foto JPG/PNG/WebP.
   - Si ves **«IA no configurada»**: rellena gasolinera/importe/fecha a mano; la imagen debe seguir adjunta.
   - Si OCR responde: confirma campos dudosos antes de guardar.
3. Guarda. El gasto queda `pending_review`.
4. **B** → Resumen (Auditoría del cliente) **o** Dinero/Auditoría → abre el gasto del cliente.
5. Elige **Aprobar** (con % deducible), **Rechazar** (0%) o **Pedir corrección**.
6. Vuelve a **A**: el estado del gasto debe reflejar la decisión (Validado / No computado / Corregir).

## Vacío honesto

- Gestoría sin clientes: mensaje de “aún no tienes clientes vinculados” + correo para compartir.
- Gestoría con clientes pero sin gastos: “Sin gastos de clientes vinculados”.

## País

- Al registrarte elige país (CountrySelector). Perfil remoto guarda `country_code`.
- ES: Modelos 130/303 estimativos.
- MX: slots «pendiente de datos oficiales» — sin tasas inventadas.

## Fuera de alcance de esta prueba

- Gemini sin secret en servidor
- Stripe / HIBP / Play Store
- OAuth Glovo/Uber o Open Banking
