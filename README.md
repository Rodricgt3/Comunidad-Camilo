# Camilo Guerra Cars — Club Oficial

PWA móvil React + TypeScript + Vite, HashRouter y Firebase modular. Interfaz obsidiana/lima, cristal oscuro y dock flotante; contenedor de 480 px en escritorio. Sin datos de demostración ni backend de pago.

## 1. Abrir en tu computadora

1. Abre esta carpeta en tu editor y abre una terminal PowerShell.
2. Ejecuta `npm install` una sola vez.
3. Ejecuta `Copy-Item .env.example .env.local` si vas a configurar WhatsApp o push.
4. Completa WhatsApp y VAPID en `.env.local` siguiendo el apartado Firebase. Los seis valores públicos del proyecto ya están incorporados.
5. Ejecuta `npm run dev` y abre la dirección que imprime la terminal.

La configuración pública de `camilo-community` ya está integrada en `src/firebase/config.ts`. Las variables de entorno permiten cambiar de proyecto; puedes omitirlas para este proyecto. `npm run build` verifica TypeScript y genera `dist/`; `npm run preview` sirve esa compilación.

## 2. Crear y conectar Firebase Spark

1. En [Firebase Console](https://console.firebase.google.com/) crea un proyecto en el plan Spark. No necesitas habilitar Analytics.
2. En Configuración del proyecto → General → Tus apps, registra una **app web**. Copia sus seis valores de configuración a las variables `VITE_FIREBASE_*` de `.env.local`. No incluyas comillas ni comas.
3. En Authentication → Sign-in method activa **Google**, elige el correo de soporte y guarda.
4. En Authentication → Settings → Authorized domains agrega `localhost` y tu dominio de Pages, por ejemplo `rodricgt3.github.io` (sin ruta de repositorio).
5. Crea Cloud Firestore, elige una región cercana a tu comunidad e inicia con reglas de producción.
6. En Firestore → Rules reemplaza el contenido por `firestore.rules` y pulsa Publicar. No uses las reglas básicas originales: exponían respuestas, datos privados y mutaciones sin validación.
7. Despliega el índice de respuestas: `npx firebase login`, `npx firebase use --add` (elige tu proyecto) y `npx firebase deploy --only firestore`. Esto despliega reglas e índices, no publica el sitio. Espera a que el índice termine de construirse.
8. El correo maestro ya está definido como `camiloguerra2010@gmail.com` tanto en el cliente como en `firestore.rules`. Una vez publicadas las reglas, al iniciar sesión con ese correo verificado se obtiene el rol `camilo_owner` automáticamente. No necesitas crear un documento de propietario a mano.
9. Inicia sesión con ese correo. En Perfil → Consola del club podrás publicar y gestionar el equipo. Los 11 Spotters se administran allí; revocar permisos afecta las reglas inmediatamente, aunque una consola abierta conserve botones hasta volver a iniciar sesión.
10. El WhatsApp de compras ya está configurado como `5215515889090`, a partir del número proporcionado. Puedes reemplazarlo con `VITE_WHATSAPP_NUMBER`. Reinicia `npm run dev` tras cambiar variables.

El propietario maestro está autorizado por correo verificado en las reglas del servidor y reflejado en `ADMIN_EMAILS`. Cambiar únicamente el arreglo del cliente no concede privilegios. El equipo Spotter se administra en `/access/{email}` mediante la consola de Camilo; `SPOTTER_EMAILS` es informativa. `/users.role` es una copia histórica, no concede permisos.

## 3. Publicar en GitHub Pages

1. Sube el código y `package-lock.json` al repositorio, en la rama `main`.
2. En GitHub → Settings → Secrets and variables → Actions → **Variables**, configura `VITE_FIREBASE_VAPID_KEY` para push. WhatsApp ya está configurado; `VITE_WHATSAPP_NUMBER` permite reemplazarlo. Los otros valores ya están integrados para `camilo-community`; configúralos solo si deseas reemplazarlos. Las claves web de Firebase son públicas por diseño; no pongas cuentas de servicio aquí.
3. En Settings → Pages → Source elige **GitHub Actions**.
4. Abre Actions → Deploy garage to GitHub Pages y ejecuta el workflow o haz push a `main`.
5. Abre la URL que devuelve el despliegue. Verifica que el dominio esté autorizado en Firebase Authentication.

`base: './'`, rutas `#/…`, manifiesto y worker relativos funcionan en una subcarpeta de repositorio. No necesitas reescrituras de servidor. No se ha publicado automáticamente desde esta entrega.

## 4. Push y PWA

1. Firebase → Configuración del proyecto → Cloud Messaging → Web Push certificates: genera el par de claves y copia la **clave pública** a `VITE_FIREBASE_VAPID_KEY`.
2. Publica por HTTPS. En Android instala desde el aviso o menú del navegador. En iPhone/iPad usa Safari → Compartir → Agregar a Inicio (iOS 16.4 o posterior para push).
3. Abre la app instalada, inicia sesión y en Perfil pulsa **Activar alertas**. La app solicita permiso y guarda el token en `/users/{uid}/pushTokens/{token}`.
4. Para comprobar entrega usa Firebase Messaging Console → campaña de notificación → mensaje de prueba y pega un token de ese dispositivo. No copies tokens a repositorios ni chats.

El worker procesa payloads FCM de notificación o datos y abre solo rutas del propio sitio. **La SPA no puede enviar push de forma segura**: enviar a toda la comunidad requiere Firebase Console o un servidor confiable con credenciales privadas. No se incluyen claves privadas ni Cloud Functions. Publicar una trivia no dispara por sí solo una campaña push. Los permisos o tokens pueden caducar; el usuario puede volver a activar alertas.

El build genera una versión del caché según el hash del HTML. El service worker precarga el shell y sus assets iniciales, conserva los assets visitados y retira el caché de versiones anteriores; Firestore usa caché IndexedDB. Operaciones sensibles (transacciones, sorteo, compras y check-in) requieren conexión. La primera visita requiere red. Los datos del usuario son persistentes en este dispositivo: usa un perfil de navegador propio y cierra sesión en dispositivos compartidos.

## 5. Operación del club

- **Trivias:** crea pregunta, respuesta privada, premio y duración; cada miembro puede enviar un intento inmutable. Las reglas validan vencimiento con el reloj del servidor. Cierra y consulta Top 3; acredita RPM y marca entrega. Los tiempos muestran milisegundos de recepción del servidor, no latencia ni orden físico de los celulares. Dos escrituras con el mismo timestamp no permiten establecer quién pulsó primero.
- **Meets:** abierto o limitado genera pase tras confirmar; sorteo crea waitlist. El cupo y el registro se escriben juntos. El sorteo bloquea inscripciones antes de consultar candidatos y usa `crypto.getRandomValues` con muestreo sin sesgo, se ejecuta una sola vez, hasta 400 inscritos por operación. Más inscritos requieren una herramienta confiable externa. El propietario es operador de confianza; un sorteo desde su navegador no aporta verificabilidad pública de imparcialidad.
- **QR:** contiene ID de evento, UID y token aleatorio. Firestore valida el token, confirmación y uso previo, en una transacción con +500 RPM. Los miembros solo leen su propio pase. No se vende como “JSON firmado”: sin servidor no existe una clave privada segura en una SPA. El pase es transferible mediante captura; el staff debe verificar identidad si es necesario.
- **Contenido:** enlaces HTTPS de YouTube, Vimeo y MP4, miniatura, reloj, reacciones y comentarios eliminables. El enlace es visible para miembros; un video unlisted no es DRM. El timer comunica exclusividad, no publica automáticamente en redes.
- **Merch:** stock por talla con reserva atómica. El stock se consulta al abrir o actualizar y se revalida al reservar. Al tocar una talla o “Ver stock en vivo”, se activa un solo listener sobre ese producto; se sustituye al elegir otro y se cierra al salir del showroom. La reserva no acredita un pago: el staff confirma el pago y la entrega manualmente. La entrega acredita la insignia. Cancelar una reserva repone stock. Órdenes pagadas necesitan conciliación manual antes de reembolso; no hay pasarela ni webhook de pago. Una reserva sin pago sigue ocupando stock hasta que staff la cancele.
- **Showroom:** autos abren una consulta WhatsApp con miembro, modelo y precio. Las imágenes se enlazan desde URLs HTTPS; no se usa Firebase Storage de pago. Usa imágenes propias y autorizadas para publicaciones. La portada inicial usa una fotografía externa de Unsplash y requiere conexión.
- **RPM:** +500 por check-in, +1,000 por trivia correcta premiada; badges y Top 10. Staff es de confianza para validar premios/RPM y gestionar inventario; no puede conceder roles. Redline VIP recibe dos boletos por participante en el sorteo, los demás uno; no garantiza ganar ni elimina el cupo. La lectura de elegibilidad añade hasta una lectura por inscrito.
- **Soporte:** tickets privados entre miembro y staff. Enviar, responder y resolver desde la app.

Los listados están limitados a 30 documentos (trivias home 5, control 15, comentarios 20, Top 10). El botón de actualización solicita datos al servidor; solo hay un `onSnapshot` opcional sobre el producto seleccionado. El volumen real depende de visitas y reintentos, no se puede garantizar permanecer bajo la cuota Spark con tráfico arbitrario. La lectura del rol en reglas también puede consumir lecturas. El leaderboard permite leer perfiles básicos entre miembros autenticados. Los correos no se guardan en `/users`; el correo propio proviene de Firebase Auth y los permisos de `/access` solo pueden leerse por el titular y el propietario. No agregues información privada a los perfiles públicos.

## 6. Verificación

- `npm run build`: chequeo estricto de TypeScript y build Vite.
- `npm run test:rules`: pruebas contra Firestore Emulator. Requiere Java 21+ y descarga inicial del emulador; no modifica tu Firebase real.
- Comprobación manual con tres cuentas: miembro, Spotter y propietario. Prueba doble inscripción al último cupo, QR repetido, trivia vencida, stock agotado y revocación de Spotter.
- Push, OAuth real, cámara y A2HS se verifican en HTTPS y dispositivos físicos, con tu configuración Firebase.

## Estructura

```
src/
  firebase/config.ts    # Entorno, Auth y caché Firestore
  firebase/api.ts       # Consultas, transacciones y operaciones del club
  main.tsx              # Vistas, formularios, sesión y navegación
  components/ui.tsx     # Acciones, modales y estados accesibles
  session.ts            # Contexto de sesión
  useLoad.ts            # Consultas bajo demanda
  types.ts              # Modelos estrictos y utilidades
  style.css             # Tokens y diseño responsive
public/
  manifest.json
  sw.js
  icons/
firestore.rules
firestore.indexes.json
tests/firestore.test.mjs
.github/workflows/deploy.yml
```
