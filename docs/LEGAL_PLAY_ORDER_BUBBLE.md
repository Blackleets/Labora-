# Burbuja de pedidos + lectura opcional de notificaciones: revisión legal y de Google Play

> **Estado:** investigación, con fuentes primarias leídas el **27-09-2026**. **Esto no es asesoramiento jurídico.** Antes de publicar, un abogado de protección de datos o laboral en España debe revisar las secciones 3 y 5.
> **Alcance:** app Android `app.labora.plus` (shell Capacitor). Tiene (a) una burbuja flotante (`SYSTEM_ALERT_WINDOW`) dentro de un foreground service `specialUse`, (b) un `NotificationListenerService` **opcional y apagado por defecto** que solo lee el título y el texto de las notificaciones de las apps de repartidor de Uber y Glovo, y (c) una confirmación manual de cada pedido (aceptado o rechazado) que se guarda en la cuenta Supabase del propio rider.
> **Lo que no hacemos:** aceptar pedidos automáticamente, usar AccessibilityService o capturar la pantalla.

---

## 1. Resumen ejecutivo (ES)

### Veredicto corto
- **Google Play:** ninguna política prohíbe una burbuja de registro manual con FGS `specialUse`, siempre que la inicie el usuario, sea visible y se pueda parar. El `NotificationListenerService` **no tiene formulario de declaración propio** en la política de permisos a fecha de hoy, pero es un permiso especial y por tanto **restringido**. Eso activa la *User Data policy*: divulgación destacada **dentro de la app** más consentimiento afirmativo, función central anunciada en la ficha y alternativa manual si el usuario dice que no. El riesgo de rechazo existe, pero se puede gestionar.
- **El riesgo mayor no es Google, es la cuenta del rider:**
  - **Uber:** sus Directrices de la comunidad (Europa, versión del 2/4/2025) tratan como fraude las «acciones con la intención de interrumpir o manipular el funcionamiento normal de la plataforma». En 2025 Uber declaró a la prensa que «usar herramientas de automatización, apps o bots para manipular la app de Uber o acceder a datos de Uber de cualquier forma no está permitido».
  - **Glovo España:** desde el 1-7-2025 los riders son **trabajadores por cuenta ajena**. Sus «Previsiones de uso» (1-9-2026) califican como **falta laboral muy grave** usar la propiedad intelectual de Glovo «para fines distintos» a las funciones laborales. También prohíben revelar o «utilizar en beneficio propio» datos operativos de Glovo.
  - Leer una notificación en el propio móvil no es ingeniería inversa ni compartir credenciales. Aun así, **no podemos garantizar que Uber o Glovo no lo interpreten en contra del rider.**
- **RGPD:** es viable con procesamiento **en el dispositivo**, allowlist de paquetes, descarte inmediato del texto bruto y subida solo de los campos que el rider confirma. Recomendamos una **EIPD/DPIA**, porque cumplimos 2 o más criterios de la lista de la AEPD.

### Top 5 riesgos y mitigaciones
| # | Riesgo | Mitigación |
|---|---|---|
| 1 | **Desactivación o sanción del rider** (Uber: cláusula de fraude y «manipular»; Glovo ES: arts. 7.3–7.5 de las Previsiones, falta muy grave para personas trabajadoras) | Solo lectura, nunca actuar sobre la app de la plataforma, sin credenciales. En la build de Play, **Glovo fuera** de la lectura de notificaciones (registro manual o importación RGPD). Aviso explícito del riesgo en la divulgación. Priorizar la **importación de exportaciones RGPD**. |
| 2 | **Rechazo o retirada en Play** por el uso del listener (User Data, divulgación y consentimiento, «función central»; Device & Network Abuse menciona apps que usan un servicio «en contra de sus términos») | Pantalla de divulgación conforme a la política, que se muestra antes de abrir Ajustes y **pide un toque afirmativo**. La función aparece en la descripción de la ficha. Alternativa manual completa. **Build o flavour separada** para el listener. |
| 3 | **Rechazo del FGS `specialUse`** o fallos en Android 15 | Servicio atado a «Iniciar jornada» / «Terminar», con botón Parar en la notificación y auto-parada por inactividad. Vídeo demo. En Android 15 la burbuja debe estar **visible antes** de arrancar el FGS desde segundo plano. |
| 4 | **RGPD:** datos de terceros (nombre o dirección del cliente) en notificaciones, fuga del texto bruto (logs, crash reports), falta de EIPD | Parseo en el dispositivo y descarte del título y el texto. Nunca loguear ni subir el texto. Subir solo importe, km, plataforma, hora y decisión confirmados. Hacer la EIPD. Añadir cláusulas a la política de privacidad. |
| 5 | **Escalada de la plataforma contra Labora+** (cartas de cese y desistimiento como Para o Mystro, marcas, bloqueo técnico con `HIDE_OVERLAY_WINDOWS`) | Nada de scraping ni APIs privadas. Uso **nominativo** de las marcas («compatible con…»), sin logos. Registro documental de diseño «solo lectura y confirmación humana». La función debe degradar bien si la burbuja se oculta. |

### Recomendación
1. **Build de Play (v1):** burbuja + registro manual rápido + **importación de datos RGPD** (Uber «Download Your Data», solicitud de acceso o portabilidad a Glovo) + **captura compartida con OCR en el dispositivo** (el usuario la inicia, sin permisos de pantalla). **Sin** `NotificationListenerService` en el manifest.
2. **Lectura de notificaciones (v1.1):** enviarla como segunda versión a un track cerrado de Play, **solo Uber**, apagada por defecto, con la divulgación y la EIPD hechas. Si Play la rechaza, **no insistir en la build de Play**. En ese caso, distribuir un flavour `labs` con otro `applicationId` fuera de Play (verificación de desarrollador obligatoria; Android 13+ exige «Permitir ajustes restringidos»). **No usar un flag remoto para ocultar la función a los revisores**, porque Play revisa el manifest y ocultar funciones es engañoso.
3. **Palanca legal a medio plazo:** la Directiva (UE) 2024/2831, art. 9.6, obliga a las plataformas a dar herramientas **gratuitas** de portabilidad y a **transmitir los datos directamente a un tercero** si la persona lo pide. El plazo de transposición es el **2-12-2026**. Esto hace de la vía de importación la opción de menor riesgo y más duradera.

---

## 2. English details: Google Play

### 2.1 Permissions and APIs that Access Sensitive Information (restricted permissions)
Source: https://support.google.com/googleplay/android-developer/answer/16558241?hl=en (read 2026-09-27)
- General rule: you may only request sensitive permissions and APIs "that are necessary to implement current features or services in your app that are promoted in your Google Play listing". Request them "in context (via incremental requests)".
- **Restricted permissions** are "permissions that are designated as Dangerous, Special, Signature, or as documented below". Data accessed through them "is considered as personal and sensitive user data. The requirements of the User Data policy apply."
  - Notification access is granted from the *Special app access* settings screen, and `BIND_NOTIFICATION_LISTENER_SERVICE` is held by the system.
  - `SYSTEM_ALERT_WINDOW` is also a special access (its protection level includes `appop`: https://developer.android.com/reference/android/Manifest.permission#SYSTEM_ALERT_WINDOW).
  - **Both fall under "restricted".**
- "You must make a reasonable effort to accommodate users who do not grant access to sensitive permissions (for example, allowing a user to manually enter…)". Our manual order log already satisfies this, and it must stay fully functional without the listener.
- Key considerations: "Direct users to the system settings page for approval of special permissions (for example, `SYSTEM_ALERT_WINDOW`)". "Don't manipulate or deceive users."
- **NotificationListenerService has no dedicated Play Console declaration form in this policy page.** The pages with forms are SMS/Call Log, location, All files, QUERY_ALL_PACKAGES, Accessibility, REQUEST_INSTALL_PACKAGES, health, VPN, exact alarm and full-screen intent. *Inference:* review happens through the general permissions, User Data and Device & Network Abuse policies, not a checklist form.
- The Accessibility section says "Apps must use more narrowly scoped APIs and permissions in lieu of the Accessibility API when possible". Choosing a notification listener instead of Accessibility is the direction Play asks for.

### 2.2 Device and Network Abuse (includes the FGS policy)
Source: https://support.google.com/googleplay/android-developer/answer/16559646?hl=en
- "We don't allow apps that interfere with, disrupt, damage, or access in an unauthorized manner … other apps on the device…"
- Listed example: **"Apps that access or use a service or API in a manner that violates its terms of service."**
  - *Analysis:* we do not call Uber or Glovo services or APIs. We read a system notification delivered to the user's own device through a public Android API. The Uber and Glovo clauses (section 3.2) are still the text a reviewer or a complainant would point at.
  - *This is the main policy hook for a takedown if Uber or Glovo complain to Google.* It is also why the listener should not ship in the same build as the rest of the app until it is approved.
- Also listed: "Apps that circumvent Android sandbox protections in order to derive user activity or user identity from other apps." A user-granted notification listener is a sanctioned API, not a circumvention. Never add screen capture, Accessibility or log reading.
- **Permissions for Foreground Services.** Apps may declare an FGS permission only if the use:
  - "provides a feature that is beneficial to the user and relevant to the core functionality of the app";
  - "is initiated by the user or is user perceptible";
  - "can be terminated or stopped by the user";
  - "can't be interrupted or deferred by the system without causing a negative user experience…";
  - "runs only for as long as necessary to complete the task".

### 2.3 Foreground service types and the `specialUse` declaration
Sources:
- https://developer.android.com/develop/background-work/services/fgs/service-types#special-use
- https://support.google.com/googleplay/android-developer/answer/13392821?hl=en
- https://developer.android.com/about/versions/15/behavior-changes-15

Requirements:
- `specialUse` "Covers any valid foreground service use cases that aren't covered by the other foreground service types."
- In the manifest, declare the `FOREGROUND_SERVICE_SPECIAL_USE` permission and a `<property android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE" android:value="…"/>`. "These values and corresponding use cases are reviewed when you submit your app in the Google Play Console."
- In Play Console → *App content* → foreground service declaration, give for each type:
  1. a description of the functionality;
  2. the user impact if the task is **deferred** and if it is **interrupted**;
  3. a **video link** "demonstrating the steps the user needs to take in your app in order to trigger the feature";
  4. a use case (free text allowed).
- "In limited scenarios … you may declare the foreground service `TYPE_SPECIAL_USE` type. All foreground service types are subject to review."

Why no other type fits:
- There is no location (we don't track GPS), no media, no dataSync (not a transfer), and `shortService` is limited to short tasks.
- An overlay window must live in a process that the system does not kill while the rider works in another app. *Inference:* that justifies an FGS, as long as its lifetime equals the user's shift.

Android 15 (targetSdk 35+):
- An app holding `SYSTEM_ALERT_WINDOW` can start an FGS from the background only if it "also ha[s] a visible overlay window". Show the bubble window **first**, then call `startForeground`, or start the FGS from the foreground activity when the rider taps «Iniciar jornada».
- Source: https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start

### 2.4 Is NotificationListenerService restricted? Notification access and prominent disclosure
Sources:
- https://developer.android.com/reference/android/service/notification/NotificationListenerService
- https://support.google.com/googleplay/android-developer/answer/10144311?hl=en (User Data)

Platform facts:
- The listener must declare `BIND_NOTIFICATION_LISTENER_SERVICE`, and "Notification listeners cannot get notification access or be bound by the system on low-RAM devices running Android Q (and below)". The system also ignores listeners in a work profile.
- Android 15 redacts OTPs from notifications given to "untrusted apps that implement a NotificationListenerService" (https://developer.android.com/about/versions/15/behavior-changes-all). This is irrelevant to us but shows the platform treats notification access as sensitive.

Play status:
- Restricted (special access), so the **User Data policy's Prominent Disclosure & Consent** applies. Reading notifications of *other apps* while the user is not in our app is outside "reasonable expectation".

User Data requirements (quoted). The in-app disclosure:
- "Must be within the app itself, not only in the app description or on a website";
- "Must be displayed in the normal usage of the app and not require the user to navigate into a menu or settings";
- "Must describe the data being accessed or collected";
- "Must explain how the data will be used and/or shared";
- "Cannot only be placed in a privacy policy or terms of service";
- "Cannot be included with other disclosures unrelated to personal and sensitive user data collection".

The consent:
- "must be immediately preceded by an in-app disclosure";
- "Must require affirmative user action (for example, tap to accept, tick a check-box)";
- "Must not interpret navigation away from the disclosure (including tapping away or pressing the back or home button) as consent";
- no auto-dismissing messages;
- "Must be granted by the user before your app can begin to collect or access the personal and sensitive user data".

Recommended format: "[This app] collects/transmits/syncs/stores [type of data] to enable ["feature"], [in what scenario]."

Also: "Apps that rely on other legal bases … such as a legitimate interest under the EU GDPR, must comply with all applicable legal requirements and provide appropriate disclosures … including in-app disclosures as required under this policy."

Implementation consequences for our code:
- Keep `android:enabled="false"` on `OrderNotificationListener` until consent (already done).
- Show our disclosure screen → affirmative «Acepto y abrir Ajustes» → then `Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS`.
- Add a visible toggle to revoke, and on revoke disable the component and delete pending drafts.

### 2.5 `SYSTEM_ALERT_WINDOW` guidance
- Android reference: "Very few apps should use this permission; these windows are intended for system-level interaction with the user." The user must grant it via `Settings.ACTION_MANAGE_OVERLAY_PERMISSION`. Check it with `Settings.canDrawOverlays()`. Source: https://developer.android.com/reference/android/Manifest.permission#SYSTEM_ALERT_WINDOW
- Play: direct users to system settings. No manipulation. Source: 2.1.
- Android 12+ blocks "untrusted touches" that pass through `TYPE_APPLICATION_OVERLAY` windows with `FLAG_NOT_TOUCHABLE`. Keep the bubble small, touchable and away from the platform's accept button. **Our bubble must never sit over, cover or relay taps to the Uber or Glovo accept or reject buttons.** Source: https://developer.android.com/about/versions/12/behavior-changes-all#untrusted-touch-events
- **Technical risk:** any app can call `Window.setHideOverlayWindows(true)` (API 31+, needs the `HIDE_OVERLAY_WINDOWS` permission) to hide non-system overlays over its windows. If Uber or Glovo do this, our bubble disappears while their app is in front. The feature must still work from the notification shade or the app. Sources: https://developer.android.com/reference/android/view/Window#setHideOverlayWindows(boolean) and https://developer.android.com/reference/android/Manifest.permission#HIDE_OVERLAY_WINDOWS

### 2.6 Data safety form implications
Source: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en
- "Collect" means "transmitting data from your app off a user's device".
- "**On-device access/processing:** User data accessed by your app that is only processed locally on the user's device and not sent off device does **not** need to be disclosed."
  - If the notification title and text never leave the device (no upload, no crash or analytics logs), they need no Data safety entry.
  - The **confirmed order** we upload (amount, km, platform, time, accepted or rejected, optional note) **is collected**.
- Candidate data types (from the official list):
  - **Financial info → Other financial info** ("such as user salary"; order earnings are income);
  - **App activity → Other user-generated content** (free-text note);
  - **App activity → Other actions** (accepted or rejected decision).
  - We collect no location (no GPS) and no messages (notification contents are not transmitted).
- The upload can be declared **optional** only if "all users – regardless of device or region – can either optionally provide information, opt-out, or opt-in". The module is off by default, so this is satisfied.
- Security: "encrypted in transit" (Supabase over HTTPS) and a deletion mechanism (we have owner delete plus account deletion).
- **If any SDK or crash reporter ever captures notification text, the answers become wrong.** "When Google becomes aware of a discrepancy … we may take appropriate action, including enforcement action."

### 2.7 What rejections look like, and how comparable apps pass
*The rejection patterns below are inferred from the policy text; we found no official rejection-reason list for this combination.*
- Typical failure points a reviewer can cite:
  1. a runtime or special-access request before the disclosure, or a disclosure only in the privacy policy (User Data "Examples of common violations": "An app has a runtime permission requesting access to data before the prominent disclosure");
  2. an FGS declaration whose video doesn't show the user starting and stopping the feature (13392821 requires the video);
  3. a sensitive feature not promoted in the listing (16558241);
  4. a Data safety mismatch (10787469);
  5. a complaint that the app uses a service against its terms (Device & Network Abuse).
- Anecdotal, non-primary: developers report repeated FGS declaration rejections (https://www.reddit.com/r/androiddev/comments/1fsuii4/has_anyone_had_repeat_issues_with_app_submission/).
- Play's *advance notice* channel covers accessibility-service explanations and third-party IP permissions, **not** notification listeners (https://support.google.com/googleplay/android-developer/answer/6320428?hl=en).

Comparables, from their Google Play listings as fetched 2026-09-27:
| App | Mechanism (their own words) | Play status |
|---|---|---|
| **GigU** (`co.gigu.app`) | "we use Accessibility Services to detect if a trip offer is on screen… used exclusively for the Cherry Pick feature, only while it's activated." Works with Uber, Lyft, DoorDash, Grubhub. | Listed, 1M+ downloads, updated 26 Aug 2026. Passes Play **with Accessibility plus a disclaimer**, which is more invasive than our design. |
| **Mystro** (`com.mystrodriver`) | "Use filters to auto-accept the best offers", "Auto-decline offers". The CEO told BI that Mystro uses the ride apps' APIs. | Listed, updated 24 Sep 2026. Uber sent Mystro letters alleging ToS violations (BI, 2025). |
| **Gridwise** (`com.gridwise.app`) | "automatic earnings download for Uber, Lyft… Uber Eats, DoorDash…" (account linking) plus mileage tracking. | Listed. Data safety: location, personal info and 3 others. |
| **GananciasPro** (`com.gananciaspro.app`, Spanish-language) | "Overlay assistant… floating window… on top of your ride-hailing app", "OCR… intelligent screen reading", "processing is done 100% locally". | Listed. Data safety: **"No data collected"**. |
| **Para** | Hidden tips for DoorDash using drivers' DoorDash credentials, plus auto-decline. | **Defunct.** DoorDash cease-and-desist, then a technical cut-off (July 2022). Uber cease-and-desist (Oct 2022). Reportedly shut down in 2024 (BI). |

What they have in common: the sensitive feature is **named in the Play description** with its exact scope ("only while it's activated") and the Data safety answers match. Our design is **less invasive** (no screen reading, no automation), so the same pattern should apply.

We found no Spain-specific rider app with a public notification-listener design to cite. GananciasPro is the closest Spanish-language comparable, and it uses screen OCR.

---

## 3. English details: EU and Spain

### 3.1 GDPR / LOPDGDD
Text: GDPR as published in the Spanish Official Gazette (DOUE copy) https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807

**Roles and scope**
- The household exemption (Art. 2(2)(c), "actividades exclusivamente personales o domésticas") does **not** cover us. Riders use Labora+ for their business, and Labora+ stores the data. **Labora+ is the controller** for the Supabase order log.
- For purely on-device steps we still design as controller (Art. 25).

**Legal basis (recommendation; confirm with counsel)**
- Order log that the rider confirms and stores in their account: **Art. 6(1)(b)**, performance of the contract (service the user signed up for and switched on).
- Notification-reading assistant: **consent, Art. 6(1)(a)**, because it is opt-in and revocable.
  - This also matches Spain's LSSI **art. 22.2** (accessing information on the user's terminal requires informed consent unless "estrictamente necesario, para la prestación de un servicio … expresamente solicitado por el destinatario"). Source: https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758
  - Consent also lines up with Play's consent requirement.
- **Third-party data** (customer name or address that may appear in a notification): the rider's consent cannot cover third parties. The only realistic basis for the transient on-device read is **legitimate interest, Art. 6(1)(f)**, and it only holds if the data is **never stored or transmitted** and is discarded after parsing.
  - If we stored it, we would owe Art. 14 information to customers we can't contact. **So never store it.**

**Minimisation and privacy by design (Art. 5(1)(c), Art. 25)**
- Art. 25(2): "por defecto, solo sean objeto de tratamiento los datos personales que sean necesarios".
- Allowlist the exact packages: `com.ubercab.driver`, `com.logistics.rider.glovo`, `com.glovoapp.courier`.
- Drop everything else in `onNotificationPosted` before reading extras.
- Parse amount and km **on the device**, discard the title and text immediately, and keep only a local draft until the rider confirms.
- Never write the raw text to Logcat, crash reports, analytics or Supabase.

**DPIA / EIPD (Art. 35)**
- The AEPD list (https://www.aepd.es/documento/listas-dpia-es-35-4.pdf) says a DPIA is needed "en la mayoría de los casos en los que dicho tratamiento cumpla con dos o más criterios".
- Relevant criteria:
  - **3** ("monitorización … a través de … aplicaciones móviles");
  - **4** ("datos que permitan determinar la situación financiera"; earnings);
  - **10** ("uso innovador de tecnologías consolidadas");
  - arguably **8** (combining with data from other controllers once imports exist).
- **Do a short DPIA before enabling the listener.** Check the exemption list too: https://www.aepd.es/documento/listasdpia-35.5l.pdf

**Transparency (Arts. 12–13)**
- Privacy policy clauses: see section 5.2.

### 3.2 Uber and Glovo terms on third-party tools (quoted)

**Uber: General Community Guidelines, Europe (Spain page, "Última modificación: 2/4/2025")**
https://www.uber.com/legal/es/document/?name=general-community-guidelines&country=spain&lang=es
- Fraud: "Entre los ejemplos de actividades fraudulentas se incluyen… **llevar a cabo acciones con la intención de interrumpir o manipular el funcionamiento normal de la plataforma Uber Marketplace**, incluida la manipulación de los ajustes de un teléfono para impedir el funcionamiento correcto de la app y el sistema GPS…"
- Account sharing: "No permita que otra persona utilice su cuenta y no comparta nunca la información personal relacionada con su cuenta (por ejemplo, su nombre de usuario, su contraseña…)".
- Enforcement: loss of access can follow from "determinadas acciones que puede llevar a cabo fuera de la plataforma Uber Marketplace, por ejemplo, a través de otras plataformas, si determinamos que dichas acciones… dañen la empresa…".
- Positive: "Rechazar un viaje o una entrega porque no le interesa no supone una infracción de estas directrices."
- **No clause in this document names "third-party apps".** Uber's public position comes from a spokesperson quote (Business Insider, 17-07-2025, https://www.businessinsider.com/uber-lyft-gigu-mystro-rideshare-apps-2025-7): "using third-party tools to bypass the system breaks our Community Guidelines and Terms of Service" and "Using automation tools, apps, or bots to manipulate the Uber app or access Uber data in any way isn't allowed."
- We could not retrieve Uber's Spain-specific delivery-partner contract publicly, so we don't quote it.

**Uber: API Terms of Use** (only relevant if we ever used an official Uber API)
https://developer.uber.com/docs/drivers/terms-of-use
- Prohibits "'scraping' or otherwise improperly obtaining data from the Uber APIs", and to "(e) include any underlying Uber platform or product with competitors in any aggregated view… (f) aggregate Uber's data with competitors' data; or (g) parse or scrape any of Uber's data", "other than as explicitly permitted by Uber in writing".
- A multi-platform log (Uber + Glovo) built on Uber APIs would conflict with (e) and (f).

**Glovo: "Previsiones de uso de la plataforma de Glovo para personas trabajadoras"** (last updated 01-09-2026)
https://riderhub.glovoapp.com/es/wp-content/uploads/sites/27/2026/09/TC-USE-OF-THE-PLATFORM-2026.pdf
- Riders are **employees**: "Usted desarrollará su actividad en el marco de una relación laboral regida por los principios de dependencia y ajenidad" (2.2(v)). Glovo handles Social Security registration (5.1.1).
- 7.3: the worker must not "revelar a terceros ni utilizar en beneficio propio ninguna información confidencial, secretos comerciales, datos técnicos, operativos o de negocio de GLOVO".
- 7.4: prohibited, "bajo cualquier circunstancia":
  - "Realizar ingeniería inversa, descompilar, desmontar, modificar o crear trabajos derivados del software o los Servicios de GLOVO";
  - "Utilizar la Propiedad Intelectual de GLOVO para fines distintos a la ejecución de sus funciones laborales o de forma que pueda perjudicar los intereses comerciales de la empresa";
  - "Proporcionar sus credenciales de acceso… a cualquier otra persona".
- 7.5: breach is "una transgresión de la buena fe contractual y una **falta laboral muy grave**, pudiendo dar lugar… [al] despido disciplinario".
- 5.4.2: Glovo "se reserva el derecho de supervisar la actividad de la Cuenta".
- 9.10: the worker can receive their data "en formato estructurado y legible… y transmitirlos a otro titular" by emailing **gdpr@glovoapp.com**.
- Industry context (secondary press): Glovo stopped working with self-employed riders in Spain on 1-7-2025. Sources: https://www.elmundo.es/economia/empresas/2025/07/01/6862ab0921efa04a568b45ad.html and https://www.lavanguardia.com/economia/20250701/10846980/glovo-contrata-14-000-riders-abandonar-modelo-autonomos.html

Consequences for Labora+:
- *Product:* Glovo riders in Spain are no longer autónomos. `docs/ORDER_LOG.md` limits the module to autónomos.
- *Legal:* reading Glovo notifications into a third-party service creates **employment-discipline risk** for the rider under 7.3–7.5. That is higher stakes than a platform deactivation.
- **Recommendation: exclude Glovo packages from notification reading in the Play build.** Offer manual logging and the GDPR import instead.

### 3.3 Uber v. Para and GigU: facts
**Para**
- We found **no court case "Uber v. Para"**. What the sources show:
  - NYT, 11-10-2022 (mirrored at https://www.buckhillcapital.com/gig-workers-are-learning-their-worth-with-the-para-app/): Para (founder David Pickerell, ex-Uber) showed DoorDash tips before acceptance, using drivers' DoorDash credentials, and offered auto-decline.
  - DoorDash sent a cease-and-desist "saying that it was illegal for drivers to use their DoorDash credentials on Para". In July 2022 DoorDash "tightened the security controlling how drivers log into its app, cutting off Para". After weeks of "cat-and-mouse, Para gave up".
  - "Last week, Uber also sent Para a cease-and-desist letter" (October 2022).
  - A DoorDash spokesperson told Vice: "Para collects its information by scraping content without authorization" (https://www.vice.com/en/article/no-dasher-no-deliveries-doordash-drivers-strike-for-tip-transparency/).
  - BI (2025) reports Para "shut down last year".
  - In a later unrelated case (Openforce v. Para Inc. d/b/a GigSafe, D. Ariz. 2:25-cv-01645), the court order summarises the complaint's allegation that Para "depended on Para unlawfully exploiting data from these gig-economy companies", leading DoorDash and Uber to act. These are allegations, not findings (https://oforce.com/hubfs/2026.01.30%20(000035.00)%20Order.pdf).
- **Lesson:** credentials plus scraping draws legal and technical action. We use neither.

**GigU (ex-StopClub, Brazil)**
- Uber sued StopClub in July 2023, "claiming the Brazilian app was illegally obtaining and storing confidential data".
- In August 2023 Uber "lost its injunction to block the app in a unanimous 3-0 judges' decision". Per Brazilian press, the TJSP held that the technology could not be blocked "sem provas concretas de prejuízo", and the case moved to expert review.
- The contested features were the earnings calculator and **auto-reject**.
- GigU filed an antitrust complaint with **CADE**. CADE's General Superintendence closed it in 2025. In July 2026 the CADE Tribunal approved an *avocação*, reopening the case.
- Sources:
  - https://gritdaily.com/brazils-gigu-expands-to-us-driver-empowering-tech/
  - https://www.bnews.com.br/noticias/crime-e-justica-bahia/aplicativo-que-salva-motoristas-de-prejuizo-vira-alvo-da-uber-na-justica-veja-como-funciona-o-app.html
  - https://oglobo.globo.com/blogs/capital/post/2026/07/disputa-entre-ex-stopclub-e-uber-ressuscita-no-cade.ghtml
  - https://timesbrasil.com.br/empresas-e-negocios/uber-e-investigada-pelo-cade-apos-denuncia-de-startup-que-calcula-ganhos-reais-de-motoristas-por-corrida/
- *These are press sources; we did not retrieve the Brazilian court filings.*
- Per the same CADE reporting, Uber also sent drivers messages threatening deactivation for "atividade potencialmente fraudulenta". Lyft emailed GigU users that third-party apps "are not secure and not allowed" and "Your account may be at risk of deactivation" (BI 2025).
- **Lesson:** even when the tool wins in court, **individual drivers carry the deactivation risk**, and auto-reject is the most contested feature. We have none.

### 3.4 EU Platform Work Directive (EU) 2024/2831 and Spain's Ley Rider
Directive text (Spanish OJ copy): https://www.boe.es/buscar/doc.php?id=DOUE-L-2024-81667 (ELI https://data.europa.eu/eli/dir/2024/2831/spa)

**Scope**
- Art. 1(2): the algorithmic-management data rules apply to "las personas que realizan trabajo en plataformas en la Unión, **incluidas aquellas que no tienen un contrato de trabajo**". This covers both autónomos and employees.

**Portability, Art. 9(6)**
- Persons performing platform work "tendrán derecho a la portabilidad de los datos personales generados por la realización de su trabajo en el contexto de los sistemas automatizados de seguimiento o … toma de decisiones…, incluidas las calificaciones y reseñas".
- The platform "proporcionará gratuitamente … herramientas para facilitar el ejercicio efectivo de sus derechos de portabilidad a que se refieren el artículo 20 del Reglamento (UE) 2016/679".
- "Cuando la persona … así lo solicite, la plataforma digital de trabajo **transmitirá dichos datos personales directamente a un tercero**."

**Other provisions**
- Art. 7: limits on the platforms' own processing.
- Art. 8: DPIA required for platforms' automated systems.
- Art. 9: transparency on automated monitoring and decision systems.
- Art. 29: transposition deadline **2 December 2026**. Spain had not transposed it as of this research; secondary sources report a prior public consultation in summer 2026, which we did not verify on a primary source.

**Ley 12/2021 "Ley Rider"** (https://www.boe.es/buscar/act.php?id=BOE-A-2021-15767)
- Adds art. 64.4.d ET: the **works council** (a collective right, not individual) must be informed of "los parámetros, reglas e instrucciones en los que se basan los algoritmos o sistemas de inteligencia artificial…".
- Adds DA 23ª ET: presumption of employment for delivery work managed algorithmically through a digital platform.
- *Takeaway:* Ley Rider gives no individual data-export right. The individual rights come from **GDPR Arts. 15 and 20** and, once transposed, **Directive Art. 9(6)**.

**GDPR Art. 20 limits**
- It covers data the data subject "haya facilitado" to the controller, where processing is based on consent or contract and automated.
- It "no afectará negativamente a los derechos y libertades de otros" (Art. 20(4)).
- *Customer data in exports may need redaction on import.*

**This supports our approach.** A rider-initiated export from Uber or Glovo, imported into Labora+, is a **legal, platform-sanctioned path**. From transposition, the rider can ask the platform to transmit the data **directly to Labora+**.

### 3.5 DMA and other portability options
- **DMA:** Uber and Glovo (Delivery Hero) are **not designated gatekeepers**. The list is Alphabet, Amazon, Apple, ByteDance, Meta, Microsoft and Booking (https://digital-markets-act.ec.europa.eu/gatekeepers_en). DMA portability obligations do not apply to them.
- **Uber:** the privacy notice for drivers and delivery people (https://www.uber.com/global/en/privacy-notice-drivers-delivery-people/) says: "You can also use our **Download Your Data** feature to download a copy of the most requested data relating to use of Uber, including account, usage, communications, and device data". There is also "Explore Your Data" and a Privacy Inquiry Form for further requests.
- **Glovo:** "You can exercise your rights … through the App or by sending us an email to: gdpr@glovoapp.com". In-app path: "Help >> Not related to an order >> Policies" (https://glovoapp.com/docs/en/legal/privacy-couriers/). For employees, see Previsiones 9.10 (above).

---

## 4. Safer alternatives, ranked by risk (lowest first)
| Rank | Approach | Platform ToS risk | Play risk | GDPR notes | Value |
|---|---|---|---|---|---|
| 1 | **Import GDPR exports** (Uber Download Your Data ZIP/CSV; Glovo access or portability response) via the Storage Access Framework or share sheet | None: platform-provided channel | Low: no sensitive permission | Parse locally; import only the rider's own fields; drop customer data (Art. 20(4)) | Month-end reconciliation, not live. Format is not guaranteed stable. |
| 2 | **Share-sheet screenshot import + on-device OCR**, user-initiated: rider takes a screenshot, shares it to Labora+ (`ACTION_SEND`, https://developer.android.com/training/sharing/receive) or picks it via Photo Picker (https://developer.android.com/training/data-storage/shared/photopicker); ML Kit Text Recognition runs **on-device** ("ML Kit's processing happens on-device… works while offline", https://developers.google.com/ml-kit) | Low: user action on own screenshot; no automation, no screen capture by us | Low: no special permission; Photo Picker avoids `READ_MEDIA_IMAGES` (16558241) | Delete the image after parsing; don't upload it | Near-live, a few taps |
| 3 | **Notification action-button logger (no reading)**: our own ongoing notification with «Aceptado» / «Rechazado» actions (https://developer.android.com/develop/ui/views/notifications/build-notification) opens a 2-field quick form | None | Very low: `POST_NOTIFICATIONS` only (already declared) | Only rider-typed data | Fast, works without an overlay |
| 4 | **Quick Settings tile** «Nuevo pedido» (https://developer.android.com/develop/ui/views/quicksettings-tiles) | None | Very low | Same as 3 | One swipe from any app |
| 5 | **Home-screen widget** with the day's totals and quick-log buttons (https://developer.android.com/develop/ui/views/appwidgets/overview) | None | Very low | Same as 3 | Good glanceability; not usable over other apps |
| 6 | **Overlay bubble with manual entry** (current `BubbleService`) | Low: doesn't read or touch the platform app | Medium: `SYSTEM_ALERT_WINDOW` plus `specialUse` review | Only rider-typed data | Best in-flow UX |
| 7 | **NotificationListener prefill** (Uber only, opt-in) | Medium: see 3.2 | Medium-high: 2.4 plus the Device & Network Abuse ToS example | DPIA, on-device, discard raw text | Fastest; fragile to notification format changes |
| — | **Official APIs** | — | — | — | **None usable.** Glovo publishes no courier API that we found. Uber's API Terms forbid aggregating Uber data with competitors' data (3.2), which conflicts with a multi-platform log. Not viable without a written Uber agreement. |

---

## 5. Play submission checklist and ready-to-use text

### 5.0 Checklist
- [ ] Play build **without** `OrderNotificationListener` in the merged manifest. Verify with `aapt dump xmltree` or the Play Console "App bundle explorer → Permissions".
- [ ] The Play description mentions the floating bubble, what it does, and that it is started and stopped by the user.
- [ ] Overlay permission requested only after an in-app explanation screen, via `ACTION_MANAGE_OVERLAY_PERMISSION`.
- [ ] FGS: starts only from «Iniciar jornada» or the bubble toggle. Ongoing notification with a **Parar** action. Stops at «Terminar jornada» and after N minutes of inactivity. Overlay visible before `startForeground` (Android 15).
- [ ] The `PROPERTY_SPECIAL_USE_FGS_SUBTYPE` value matches the Console declaration (5.3).
- [ ] FGS declaration in *App content* with the demo video link (unlisted YouTube), per 5.5.
- [ ] Data safety updated (5.4). Privacy policy URL is public HTTPS and contains the clauses in 5.2.
- [ ] Manual entry works 100% with every permission denied.
- [ ] No Uber or Glovo logos. The app name and icon contain no third-party marks. Only nominative text such as «compatible con apps de reparto como Uber Eats» (Impersonation policy: https://support.google.com/googleplay/android-developer/answer/9888374).
- [ ] No SDK logs notification contents. Crash reporting scrubs extras.
- [ ] DPIA done (3.1) before the listener ships anywhere.
- [ ] **Listener release (separate):** disclosure screen (5.1) → affirmative consent → Settings. Revoke toggle. Glovo packages excluded in the Play flavour. Listing text updated. Data safety re-checked.

### 5.1 Prominent disclosure (in-app, Spanish). Show immediately before opening notification-access settings
> **Asistente de notificaciones (opcional)**
> Labora+ **lee el título y el texto de las notificaciones de la app de repartidor de Uber** (y de ninguna otra app) para **rellenar automáticamente el importe y los km** del pedido en tu registro, **también cuando Labora+ está cerrada o en segundo plano**.
> - El texto se analiza **solo en tu móvil** y se **descarta al momento**. No guardamos ni enviamos el texto de la notificación.
> - Solo se guarda en tu cuenta de Labora+ lo que **tú confirmas** al pulsar «Aceptado» o «Rechazado»: plataforma, importe, km, hora y tu decisión.
> - Nunca aceptamos ni rechazamos pedidos por ti ni tocamos la app de la plataforma.
> - **Aviso:** Uber o Glovo podrían considerar que el uso de herramientas de terceros incumple sus condiciones. Úsalo bajo tu criterio. Siempre puedes apuntar los pedidos a mano.
> - Puedes desactivarlo cuando quieras en Ajustes → Módulos → Registro de pedidos.
>
> [ **Acepto, abrir ajustes** ]   [ No, gracias ]

Rules: no pre-ticked box, no auto-dismiss, and Back or tap-outside counts as «No» (User Data policy). Play's own template sentence, for the Console reviewer note: "Labora+ reads Uber courier-app notification title and text to prefill order amount and distance in the user's order log, even when the app is closed or not in use."

Overlay pre-permission screen (not a data disclosure, but recommended):
> **Burbuja flotante**
> Para apuntar pedidos sin salir de la app de reparto, Labora+ muestra una pequeña burbuja encima de otras apps mientras tu jornada está activa. No lee tu pantalla ni pulsa nada por ti. Se para al terminar la jornada o al pulsar «Parar».
> [ Continuar a Ajustes ]   [ Ahora no ]

### 5.2 Privacy policy clauses (Spanish, to add to `privacidad.html`)
> **Registro de pedidos y burbuja flotante.** Si activas el módulo «Registro de pedidos», guardamos en tu cuenta los pedidos que tú confirmas: plataforma, importe, distancia, fecha y hora, aceptado o rechazado, motivo y nota opcional. Base jurídica: ejecución del contrato (art. 6.1.b RGPD). Solo tú puedes verlos; tu gestoría no tiene acceso. Puedes editarlos, exportarlos (CSV) y borrarlos en cualquier momento.
>
> **Asistente de notificaciones (opcional, desactivado por defecto).** Si lo activas expresamente, la app lee en tu dispositivo el título y el texto de las notificaciones de las apps de repartidor indicadas en la pantalla de activación, **únicamente** para proponerte el importe y los km. El texto se procesa localmente y se descarta de inmediato; **no lo almacenamos ni lo transmitimos** a nuestros servidores ni a terceros. Base jurídica: tu consentimiento (art. 6.1.a RGPD y art. 22.2 LSSI), que puedes retirar en cualquier momento desactivando la función o el acceso a notificaciones en los ajustes de Android. Si una notificación contuviera datos de terceros (por ejemplo, el nombre de un cliente), se descartan sin guardarse (interés legítimo en el funcionamiento seguro de la función, art. 6.1.f RGPD). Hemos realizado una evaluación de impacto (art. 35 RGPD).
>
> **Importación de tus datos de plataformas.** Puedes importar el archivo que Uber, Glovo u otras plataformas te entregan cuando ejerces tus derechos de acceso o portabilidad (art. 15 y 20 RGPD). El archivo se procesa en tu dispositivo, solo se importan los campos de tus propios pedidos e ingresos, y se descartan los datos de terceros.
>
> **Capturas compartidas.** Si compartes una captura con Labora+, el texto se reconoce en tu dispositivo (sin enviar la imagen) y la imagen no se conserva.
>
> **Lo que no hacemos.** No usamos servicios de accesibilidad, no capturamos tu pantalla, no accedemos a tus cuentas de plataformas ni automatizamos acciones en ellas, no vendemos datos y no hay analítica en este módulo.

### 5.3 `specialUse` justification
Manifest (≤ one sentence, English, reviewed by Play):
```xml
<property android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
  android:value="User-started floating bubble that lets a delivery rider manually log each of their own orders (amount, km, accepted/rejected) while working in another app during a shift they started; stopped by the user via the notification Stop action or when the shift ends. It does not read the screen, capture content, or interact with other apps." />
```
Play Console declaration:
- **Functionality:** "The rider taps 'Start shift'. Labora+ shows a small floating bubble over other apps and an ongoing notification with a Stop action. When the rider gets a delivery offer in their courier app, they tap the bubble and record the order amount, distance and whether they accepted or rejected it. The entry is saved to their own account. The service runs only while the shift is active and stops on 'End shift', the Stop action, or after 30 minutes without interaction."
- **Impact if deferred:** "The bubble would not appear when the rider starts the shift, so they could not log orders while in the courier app. Orders arrive every few minutes and must be logged at the moment of the decision."
- **Impact if interrupted:** "The bubble disappears mid-shift and any order being typed is lost. The rider has to reopen the app, breaking the workflow during active work."
- **Use case (manual entry):** "Floating quick-entry overlay for user-initiated work logging."

### 5.4 Data safety answers (Play build v1: no listener)
| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | Yes (the account data already declared plus the items below) |
| Financial info → Other financial info (order earnings) | Collected; **not shared**; **optional**; purpose: App functionality |
| App activity → Other user-generated content (order note) | Collected; not shared; optional; App functionality |
| App activity → Other actions (accepted/rejected) | Collected; not shared; optional; App functionality |
| Location | **Not collected** by this module (no GPS) |
| Messages / notification content | **Not collected**: processed only on device (listener build) |
| Encrypted in transit | Yes |
| Users can request deletion | Yes (in-app delete plus account deletion) |

For the listener build, answers stay the same **only if** the raw text never leaves the device (10787469, "On-device access/processing").

### 5.5 Demo video script (60–90 s, screen recording, no narration, captions on screen)
1. (0–5 s) Caption: «Labora+ · Registro de pedidos (opcional)». Show Ajustes → Módulos → switch ON.
2. (5–15 s) Tap «Iniciar jornada». The overlay explanation screen appears. Tap Continuar. The Android «Mostrar sobre otras apps» screen appears. Toggle it ON and go back.
3. (15–25 s) The bubble appears. Pull down the shade to show the ongoing notification «Jornada activa · Parar».
4. (25–45 s) Open **a neutral demo screen**, not a real Uber or Glovo account or trademarks. Tap the bubble, enter 4,80 € and 2,1 km, tap «Aceptado», and show the toast «Guardado».
5. (45–55 s) Open Labora+ → Pedidos → Hoy and show the entry.
6. (55–65 s) Tap «Parar» in the notification. The bubble disappears and the notification disappears. Caption: «El servicio se detiene cuando el usuario lo para o termina la jornada».
7. Listener release only, as a separate video: show the disclosure screen (5.1), tap «Acepto» → Android notification-access screen → enable. Show a **test notification posted by our own debug tool that mimics the format**, the prefilled draft, and the rider confirming. Then show the revoke toggle.

### 5.6 Separate flavour vs feature flag: recommendation
- **Use Gradle `productFlavors`**, not a runtime flag:
  - `play`: bubble, manual log, imports, OCR. **No listener class in the manifest.**
  - `labs`: adds `OrderNotificationListener`.
- A remote or runtime flag doesn't help. Play reviews the **manifest and the declared services**. Shipping a hidden listener behind a flag you turn on after review is exactly the undisclosed behaviour the Permissions and User Data policies forbid ("undisclosed, unimplemented, or disallowed features").
- Sequence:
  1. Ship `play` v1.
  2. Put `play` v1.1 **with** the listener (Uber only) on a closed test track, with the disclosure, updated listing and DPIA.
  3. If approved, promote it.
  4. If rejected, keep the listener only in `labs`.
- `labs` distribution outside Play:
  - Use a **different `applicationId`** (e.g. `app.labora.plus.labs`).
  - Complete **Android developer verification** and register the package. Enforcement applies to certified devices in selected regions from **30-09-2026**, with a **global rollout in 2027**; unverified apps need the user's one-time "advanced flow" with a 24-hour wait (https://developer.android.com/developer-verification/guides/faq).
  - On Android 13+, sideloaded apps hit **restricted settings**: the user must tap "Allow restricted settings" in App info (https://support.google.com/android/answer/12623953). Secondary: XDA reports this blocks notification-listener access for sideloaded apps (https://www.xda-developers.com/android-13-restricted-setting-notification-listener/).
  - The Play build must **not** download, install or self-update the labs APK (Device & Network Abuse: no self-update or executable downloads outside Play; REQUEST_INSTALL_PACKAGES restrictions).
  - GDPR obligations are identical off Play.

---

## 6. Sources (all read 2026-09-27)

### Google Play and Android
- Permissions and APIs that Access Sensitive Information: https://support.google.com/googleplay/android-developer/answer/16558241?hl=en
- Device and Network Abuse, including the FGS policy: https://support.google.com/googleplay/android-developer/answer/16559646?hl=en
- Foreground service and full-screen intent requirements: https://support.google.com/googleplay/android-developer/answer/13392821?hl=en
- User Data (Prominent Disclosure & Consent): https://support.google.com/googleplay/android-developer/answer/10144311?hl=en
- Data safety: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en
- Advance notice to App Review: https://support.google.com/googleplay/android-developer/answer/6320428?hl=en
- Impersonation: https://support.google.com/googleplay/android-developer/answer/9888374
- FGS types: https://developer.android.com/develop/background-work/services/fgs/service-types
- Android 14 FGS types required: https://developer.android.com/about/versions/14/changes/fgs-types-required
- FGS background-start restrictions: https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start
- Android 15 behaviour changes (apps targeting 15): https://developer.android.com/about/versions/15/behavior-changes-15
- Android 15 behaviour changes (all apps; OTP redaction): https://developer.android.com/about/versions/15/behavior-changes-all
- Android 12 untrusted touches: https://developer.android.com/about/versions/12/behavior-changes-all
- `Manifest.permission` (SYSTEM_ALERT_WINDOW, HIDE_OVERLAY_WINDOWS): https://developer.android.com/reference/android/Manifest.permission
- `Window.setHideOverlayWindows`: https://developer.android.com/reference/android/view/Window
- NotificationListenerService: https://developer.android.com/reference/android/service/notification/NotificationListenerService
- Restricted settings: https://support.google.com/android/answer/12623953?hl=en
- Developer verification FAQ: https://developer.android.com/developer-verification/guides/faq
- Quick Settings tiles: https://developer.android.com/develop/ui/views/quicksettings-tiles
- Widgets: https://developer.android.com/develop/ui/views/appwidgets/overview
- Notifications and actions: https://developer.android.com/develop/ui/views/notifications/build-notification
- Receiving shared content: https://developer.android.com/training/sharing/receive
- Photo Picker: https://developer.android.com/training/data-storage/shared/photopicker
- ML Kit: https://developers.google.com/ml-kit and https://developers.google.com/ml-kit/vision/text-recognition/v2

### Play listings (comparables)
- https://play.google.com/store/apps/details?id=co.gigu.app
- https://play.google.com/store/apps/details?id=com.mystrodriver
- https://play.google.com/store/apps/details?id=com.gridwise.app
- https://play.google.com/store/apps/details?id=com.gananciaspro.app

### Law and regulators
- GDPR (DOUE copy at BOE): https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807
- Directive (EU) 2024/2831 (DOUE copy at BOE): https://www.boe.es/buscar/doc.php?id=DOUE-L-2024-81667
- Ley 12/2021 (Ley Rider): https://www.boe.es/buscar/act.php?id=BOE-A-2021-15767
- LSSI (Ley 34/2002), art. 22.2: https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758
- AEPD DPIA list, art. 35.4: https://www.aepd.es/documento/listas-dpia-es-35-4.pdf
- AEPD exemption list, art. 35.5: https://www.aepd.es/documento/listasdpia-35.5l.pdf
- DMA gatekeepers: https://digital-markets-act.ec.europa.eu/gatekeepers_en

### Platforms
- Uber Community Guidelines, Europe (ES): https://www.uber.com/legal/es/document/?name=general-community-guidelines&country=spain&lang=es
- Uber Community Guidelines, US/Canada: https://www.uber.com/legal/en/document/?name=general-community-guidelines&country=united-states&lang=en
- Uber API Terms of Use: https://developer.uber.com/docs/drivers/terms-of-use
- Uber Privacy Notice for drivers and delivery people: https://www.uber.com/global/en/privacy-notice-drivers-delivery-people/
- Glovo Previsiones de uso (01-09-2026): https://riderhub.glovoapp.com/es/wp-content/uploads/sites/27/2026/09/TC-USE-OF-THE-PLATFORM-2026.pdf
- Glovo courier privacy: https://glovoapp.com/docs/en/legal/privacy-couriers/

### Press and secondary (facts attributed in the text)
- Business Insider, 17-07-2025: https://www.businessinsider.com/uber-lyft-gigu-mystro-rideshare-apps-2025-7
- NYT on Para, 11-10-2022 (mirror): https://www.buckhillcapital.com/gig-workers-are-learning-their-worth-with-the-para-app/
- Vice on Para and DoorDash: https://www.vice.com/en/article/no-dasher-no-deliveries-doordash-drivers-strike-for-tip-transparency/
- Openforce v. Para Inc. order (D. Ariz. 2:25-cv-01645, 30-01-2026): https://oforce.com/hubfs/2026.01.30%20(000035.00)%20Order.pdf
- GigU in Brazil:
  - https://gritdaily.com/brazils-gigu-expands-to-us-driver-empowering-tech/
  - https://www.bnews.com.br/noticias/crime-e-justica-bahia/aplicativo-que-salva-motoristas-de-prejuizo-vira-alvo-da-uber-na-justica-veja-como-funciona-o-app.html
  - https://oglobo.globo.com/blogs/capital/post/2026/07/disputa-entre-ex-stopclub-e-uber-ressuscita-no-cade.ghtml
  - https://timesbrasil.com.br/empresas-e-negocios/uber-e-investigada-pelo-cade-apos-denuncia-de-startup-que-calcula-ganhos-reais-de-motoristas-por-corrida/
- Glovo employment model:
  - https://www.elmundo.es/economia/empresas/2025/07/01/6862ab0921efa04a568b45ad.html
  - https://www.lavanguardia.com/economia/20250701/10846980/glovo-contrata-14-000-riders-abandonar-modelo-autonomos.html
- Restricted settings and notification listeners (XDA): https://www.xda-developers.com/android-13-restricted-setting-notification-listener/
