# Dedicated Exeller Admin Console

The application supports a protected operations-console subdomain while keeping `/admin` working on the public website.

## Production console URL

```text
https://admin.exellercomputer.com/
```

At this host, clean paths are internally mapped to the existing protected application routes:

| Browser URL | Application route |
| --- | --- |
| `https://admin.exellercomputer.com/` | `/admin/dashboard` |
| `https://admin.exellercomputer.com/jobs` | `/admin/jobs` |
| `https://admin.exellercomputer.com/leads` | `/admin/leads` |
| `https://admin.exellercomputer.com/media` | `/admin/media` |
| `https://admin.exellercomputer.com/whatsapp` | `/admin/whatsapp` |

Every non-login request on the subdomain is authenticated by Supabase middleware and then checked again by the admin layout and RLS. The alternate URL is for separation and usability, not security by obscurity.

## Vercel setup

1. Open **Vercel → Exeller Computer project → Settings → Domains**.
2. Add `admin.exellercomputer.com` to the **same** Vercel project as the public website.
3. At the DNS provider for `exellercomputer.com`, add the DNS record shown by Vercel. This is typically a CNAME record for `admin` pointing to Vercel's supplied hostname.
4. In **Vercel → Settings → Environment Variables**, set:

   ```text
   ADMIN_CONSOLE_HOST=admin.exellercomputer.com
   ```

   Set it for Production. Add it to Preview only when a matching preview console domain is configured.
5. Redeploy after the domain becomes verified.

## Local test

The normal local console remains:

```text
http://localhost:3000/admin/dashboard
```

A subdomain needs local DNS/hosts-file configuration, so it is not required for development.
