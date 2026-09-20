# Mensajería rider ↔ gestoría

Contrato bidireccional de Labora+. Sin OAuth inventado ni vínculos fantasma.

## Quién puede hablar con quién

| Rol | Contactos visibles | Puede enviar a |
| --- | --- | --- |
| **Autónomo (rider)** | Solo su gestoría vinculada (`user.managerId`) | Solo ese `managerId` |
| **Gestoría / Admin** | Solo riders con `managerId === currentUser.id` | Solo esos clientes |

La conversación es un hilo único entre ambos: cada mensaje tiene `senderId` / `recipientId`. Ambos pueden escribir y dejar mensajes; no hay canal “solo gestoría” ni “solo rider”.

## Vinculación (previa a mensajería)

1. El rider va a **Perfil → Relación de trabajo** e introduce el **correo** de la gestoría (`linkManagerByEmail`).
2. La gestoría no “conecta” por OAuth: comparte su correo; el rider se vincula, o el flujo de cartera vigente añade el vínculo.
3. Sin `managerId` el rider ve vacío honesto (“No tienes gestoría vinculada”) y se le indica Perfil — **no** se inventa un botón de conectar gestor.

## UI (claridad)

- **Rider:** título «Mensajes con tu gestoría» + nombre de la gestoría.
- **Gestoría:** «Mensajes con tus clientes» + recuento.
- Badges en lista: «Tu gestoría» / «Cliente».
- Cabecera del hilo: «Conversación con {nombre} · Gestoría|Autónomo».
- Burbujas: etiqueta «Tú» vs rol de la contraparte; hora; estado **Enviado / Leído / Fallido**.
- Composer: aviso de aislamiento («Solo ves y escribes a tu gestoría vinculada» / «Solo a clientes vinculados a ti»).

## Aislamiento y caché

- Envío solo como la sesión actual (`senderId === auth.uid`); el repositorio rechaza suplantar.
- Antes del repositorio, la UI valida `canMessagePair` (elegibilidad por vínculo).
- Caché offline: `labora_messages:<userId>` (nunca la clave legacy compartida `labora_messages`).
- Al abrir un hilo, si el usuario es destinatario, se marca leído vía RPC `mark_message_read` (RLS).

## Previews y legacy

Los mensajes antiguos pueden tener solo `personId` (= destinatario). La UI prefiere `senderId`/`recipientId` y nombra a la **contraparte** del visor; no asume que `personId` sea siempre el interlocutor cuando el visor es el destinatario.

## Pruebas

- Unit: `modules/messages/messagingRules.test.ts` (elegibilidad + contraparte).
- Unit: `modules/messages/repositories/messageCache.test.ts` (aislamiento de caché).
- UAT manual: sección C de `docs/UAT_DUAL_ACCOUNT.md`.
