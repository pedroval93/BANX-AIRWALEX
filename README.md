# Mis tarjetas

Web donde cada cliente ve las tarjetas de Airwallex que le asignaste: el frente y el reverso con número, vencimiento y CVV, y, si se lo permites, su gasto y movimientos.

- **Clientes:** entran solo por invitación. Ven sus tarjetas en `/` y el detalle de cada una en `/tarjetas/[id]`.
- **Admin (`/admin`):** asignas tarjetas en bulk desde la pestaña Tarjetas. En la pestaña Clientes los invitas, prendes o apagas por separado si ven su **saldo** (gasto del mes y disponible) y sus **movimientos**, y creas enlaces para cambiar contraseña.
- **Sin claves de Airwallex** la app muestra tarjetas y movimientos de ejemplo, con un aviso arriba.

Stack: Next.js 16, Supabase (usuarios y asignaciones), API de Airwallex Issuing, Vercel.

## Puesta en marcha

1. **Base de datos.** En Supabase → SQL Editor, pega y corre en orden [`0001_init.sql`](supabase/migrations/0001_init.sql) y [`0002_show_balance.sql`](supabase/migrations/0002_show_balance.sql).
2. **Cierra el registro público.** En Supabase → Authentication → Sign In / Providers, apaga *Allow new users to sign up*. Así solo entra quien invites.
3. **Variables.** Copia `.env.example` a `.env.local` y llénalas. En Vercel ponlas en Settings → Environment Variables. `ADMIN_EMAILS` es tu correo.
4. **Tu cuenta de admin:**
   ```bash
   node --env-file=.env.local scripts/invite.mjs tu@correo.com https://tu-app.vercel.app
   ```
   Abre el enlace que imprime y crea tu contraseña.
5. **Local:** `npm install` y luego `npm run dev`.

## Datos de la tarjeta

El número completo, el vencimiento y el CVV se piden a Airwallex (`GET /api/v1/issuing/cards/{id}/details`) solo cuando el cliente toca "Ver datos". No se guardan en la base de datos y se ocultan solos en un minuto. Airwallex solo los da para tarjetas virtuales activas.

Airwallex indica que esa llamada normalmente requiere certificación PCI de tu lado. La alternativa sin PCI son sus iframes seguros (*PAN delegation*), que tu ejecutivo de Airwallex tiene que activar. Si Airwallex rechaza la llamada, la app muestra un aviso y deja la tarjeta enmascarada.

## Gasto y movimientos

Vienen de `GET /api/v1/issuing/card_transactions`, mes por mes (hora de Ciudad de México). Cuentan las compras autorizadas y liquidadas, y las devoluciones restan. Las rechazadas, canceladas y caducadas se muestran tachadas y no cuentan. La lógica está en [`src/lib/cards/spend.ts`](src/lib/cards/spend.ts); conviene revisarla con datos reales del sandbox.

## Pruebas

```bash
npm test
```
