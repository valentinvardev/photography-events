# Guía de deployment — nuevo cliente

Esta guía es para configurar un nuevo deployment del proyecto para un cliente diferente, compartiendo infraestructura AWS y VPS con otros deployments existentes.

---

## Prerequisitos

- Acceso SSH al VPS
- Acceso a AWS (S3 + Rekognition)
- Cuenta de Supabase nueva (una por cliente)
- Cuenta de MercadoPago del cliente
- Cuenta de Resend (o usar la existente con dominio propio)
- Dominio apuntando al VPS via Cloudflare
- PostgreSQL disponible (puede ser la misma instancia, diferente base de datos)

---

## Paso 1 — Crear base de datos

En el servidor PostgreSQL, crear una base de datos nueva para el cliente:

```sql
CREATE DATABASE cliente2;
```

La `DATABASE_URL` va a ser algo como:
```
postgresql://usuario:password@localhost:5432/cliente2
```

---

## Paso 2 — Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New Project
2. Guardar: `URL`, `anon key`, `service_role key`
3. Ir a Storage → New Bucket → nombre: `photos`, privado (no public)

El bucket `photos` de Supabase se usa exclusivamente para la imagen de marca de agua (`watermarks/active.png`). Los uploads de fotos van a S3.

---

## Paso 3 — Configurar S3

El bucket S3 puede ser **el mismo** que otros deployments. Para aislar los archivos, se usa `AWS_S3_PREFIX`.

Elegir un prefijo único para el cliente, ej: `cliente2`.

Verificar que el bucket S3 tiene CORS configurado para el dominio del cliente:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": ["https://dominiocliente.com"],
    "ExposeHeaders": []
  }
]
```

Si ya hay otros orígenes en el CORS, agregar el nuevo al array `AllowedOrigins`.

---

## Paso 4 — Configurar MercadoPago

1. Ir al dashboard de MercadoPago del cliente → Credenciales
2. Obtener: `Access Token`, `Public Key`, `Client ID`, `Client Secret`
3. En la app de MercadoPago, configurar la URL de redirect OAuth:
   ```
   https://dominiocliente.com/api/mercadopago/connect/callback
   ```
4. Configurar webhook apuntando a:
   ```
   https://dominiocliente.com/api/webhooks/mercadopago
   ```

---

## Paso 5 — Configurar Resend

Opción A — dominio propio del cliente:
1. En Resend → Add Domain → ingresar el dominio del cliente
2. Agregar los registros DNS que indica Resend
3. Usar `RESEND_FROM_EMAIL=Nombre Cliente <noreply@dominiocliente.com>`

Opción B — reusar dominio existente:
- Usar `RESEND_FROM_EMAIL=Nombre Cliente <noreply@dominioyaverificado.com>`
- No requiere configuración adicional en Resend

---

## Paso 6 — Clonar en el VPS

```bash
ssh photoplatform@ip-del-vps
cd ~
git clone https://github.com/valentinvardev/photography-events.git cliente2
cd cliente2/app
npm install
```

---

## Paso 7 — Crear .env

```bash
cp .env.example .env   # si existe, sino crear desde cero
nano .env
```

Completar con todos los valores:

```env
AUTH_SECRET=           # openssl rand -base64 32
ADMIN_EMAIL=admin@dominiocliente.com
ADMIN_PASSWORD=        # contraseña segura

DATABASE_URL=postgresql://usuario:password@localhost:5432/cliente2
DIRECT_URL=postgresql://usuario:password@localhost:5432/cliente2

AWS_ACCESS_KEY_ID=     # mismas credenciales AWS que otros deployments
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-2
AWS_S3_BUCKET=         # mismo bucket
AWS_S3_PREFIX=cliente2 # IMPORTANTE: prefijo único para este cliente

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=  # string random, usarlo también al configurar el webhook en MP
MP_CLIENT_ID=
MP_CLIENT_SECRET=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=

RESEND_API_KEY=
RESEND_FROM_EMAIL=Nombre Cliente <noreply@dominiocliente.com>

NEXT_PUBLIC_BASE_URL=https://dominiocliente.com
```

---

## Paso 8 — Inicializar base de datos

```bash
npx prisma generate
npx prisma db push
```

---

## Paso 9 — Build y PM2

```bash
npm run build
pm2 start npm --name "cliente2" -- start -- -p 3002
pm2 save
```

Usar un puerto diferente al de otros deployments (3001, 3002, 3003...).

---

## Paso 10 — Nginx

Agregar un nuevo bloque server en Nginx:

```bash
sudo nano /etc/nginx/sites-available/cliente2
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name dominiocliente.com www.dominiocliente.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        client_max_body_size 500M;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/cliente2 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Paso 11 — Cloudflare

1. Agregar el dominio a Cloudflare
2. Apuntar el DNS al IP del VPS (registro A, proxy activado)
3. SSL/TLS → modo **Flexible** (Cloudflare HTTPS → origin HTTP)

---

## Paso 12 — Verificar

1. Entrar a `https://dominiocliente.com/admin`
2. Login con `ADMIN_EMAIL` y `ADMIN_PASSWORD`
3. Ir a Settings → subir imagen PNG de marca de agua
4. Crear una colección de prueba y subir una foto
5. Verificar que la foto aparece con marca de agua en la galería pública

---

## Personalización por cliente

Los textos del sitio (nombre, email, hero, etc.) se modifican directamente en los componentes. Los archivos clave son:

- `app/src/app/_components/` — componentes públicos
- `app/src/lib/email.ts` — template de emails (nombre del fotógrafo, colores)
- `app/src/app/page.tsx` — landing page

Si el cliente necesita branding completamente diferente, se recomienda trabajar en una rama separada.

---

## Puerto de referencia

| Cliente | Puerto | PM2 name |
|---|---|---|
| Ivana Maritano | 3001 | ivanamaritano |
| Cliente 2 | 3002 | cliente2 |
| Cliente 3 | 3003 | cliente3 |
