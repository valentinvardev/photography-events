# Photography Events Platform

Plataforma de venta de fotos y videos de eventos deportivos. Los fotógrafos suben el contenido, los corredores buscan por dorsal y compran sus fotos con marca de agua aplicada automáticamente.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| API | tRPC v11 |
| Base de datos | PostgreSQL + Prisma v6 |
| Auth | NextAuth.js (CredentialsProvider — email/password) |
| Storage principal | AWS S3 |
| Storage auxiliar | Supabase Storage (marca de agua, índice de caras) |
| Pagos | MercadoPago |
| Email | Resend |
| Detección de caras | AWS Rekognition |
| Procesamiento de imágenes | Sharp |
| Procesamiento de video | fluent-ffmpeg + ffmpeg-static |
| Deploy | PM2 + Nginx + Cloudflare |

---

## Modelos de datos

### Collection
Representa un evento (carrera, maratón, etc.).
- `slug` — URL pública: `/colecciones/:slug`
- `pricePerBib` — precio por dorsal
- `packPrice` — precio del pack completo (opcional)
- `discountTiers` — JSON con descuentos por cantidad
- `isPublished` — visible al público

### Photo
Foto o video dentro de una colección.
- `storageKey` — key S3 del archivo original
- `previewKey` — key S3 del archivo procesado (con marca de agua, H.264 para videos)
- `bibNumber` — dorsal del corredor (puede tener múltiples separados por coma)
- `mimeType` — tipo MIME original
- `fileSize`, `width`, `height` — metadatos

### Purchase
Compra de un conjunto de fotos.
- `photoIds` — array de IDs comprados
- `bibNumber` — dorsal al que pertenece la compra
- Integrado con MercadoPago (preference ID + payment ID)

---

## Flujo de procesamiento

### Al subir una foto
1. El browser sube directamente a S3 vía presigned PUT URL
2. El cliente registra en DB via `photo.bulkAdd`
3. En background se ejecuta:
   - `runOcr` — detecta dorsal via AWS Rekognition
   - `runWatermark` — aplica PNG de marca de agua con Sharp, guarda preview en S3
   - `runFaceIndex` — indexa caras en colección Rekognition

### Al subir un video
1. Mismo upload directo a S3
2. En background se ejecuta:
   - `runVideoWatermark` — transcodifica a H.264 via ffmpeg, overlayea PNG de marca de agua centrado, guarda preview en S3

### Búsqueda por dorsal
- Búsqueda exacta (case-insensitive) + búsqueda fuzzy (1 dígito de diferencia para dorsales de 3-4 caracteres)
- También disponible búsqueda por cara (AWS Rekognition)

---

## Estructura S3

```
{AWS_S3_PREFIX}/uploads/{collectionId}/{timestamp}-{random}.{ext}   ← originales
{AWS_S3_PREFIX}/previews/{photoId}.jpg                              ← fotos procesadas
{AWS_S3_PREFIX}/previews/{photoId}.mp4                              ← videos procesados
```

`AWS_S3_PREFIX` es opcional. Si está seteado (ej: `ivana`), todos los archivos van dentro de esa carpeta. Permite compartir el mismo bucket entre múltiples deployments.

### Supabase Storage (bucket: `photos`)
```
watermarks/active.png   ← marca de agua PNG (no usa prefix, es por deployment de Supabase)
```

---

## Variables de entorno

```env
# Auth
AUTH_SECRET=                        # openssl rand -base64 32
ADMIN_EMAIL=                        # email del administrador
ADMIN_PASSWORD=                     # contraseña del administrador

# Base de datos
DATABASE_URL=                       # postgresql://...
DIRECT_URL=                         # opcional, para migrations directas

# AWS S3 + Rekognition
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=                         # ej: us-east-2
AWS_S3_BUCKET=                      # nombre del bucket
AWS_S3_PREFIX=                      # ej: ivana (para aislar en bucket compartido)

# Supabase (para marca de agua y búsqueda por cara)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
MP_CLIENT_ID=
MP_CLIENT_SECRET=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=

# Resend (emails)
RESEND_API_KEY=
RESEND_FROM_EMAIL=                  # ej: Ivana Maritano <noreply@ivanamaritano.com>

# App
NEXT_PUBLIC_BASE_URL=               # ej: https://ivanamaritano.com
```

---

## Rutas principales

### Públicas
- `/` — landing page
- `/colecciones/:slug` — galería del evento (búsqueda, lightbox, compra)

### Admin (requiere login)
- `/admin` — dashboard
- `/admin/colecciones` — lista de eventos
- `/admin/colecciones/:id` — gestión de fotos, precios, marca de agua
- `/admin/settings` — configuración de marca de agua

---

## API Routes

| Ruta | Método | Descripción |
|---|---|---|
| `/api/watermark` | POST | Aplica marca de agua a una foto o video |
| `/api/watermark-settings` | GET/POST/DELETE | Lee/sube/elimina el PNG de marca de agua |
| `/api/uploads/sign` | POST | Genera signed URL de Supabase para upload |
| `/api/face-search` | POST | Búsqueda por cara con Rekognition |
| `/api/webhooks/mercadopago` | POST | Webhook de pagos |
| `/api/mercadopago/connect` | GET | OAuth MercadoPago |

---

## Notas de arquitectura

- Los archivos originales nunca se sirven al usuario final — siempre se sirve el `previewKey` (con marca de agua)
- Las URLs firmadas de S3 expiran en 1 hora
- El procesamiento de fotos/videos corre en background en el mismo proceso Next.js (no hay workers separados) — válido para VPS, no para serverless
- Cloudflare en modo **Flexible SSL** (Cloudflare termina HTTPS, origin sirve HTTP)
- `isS3Key()` detecta si una key es de S3 por el prefijo `uploads/` o `previews/` para mantener retrocompatibilidad con keys sin prefijo
