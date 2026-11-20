# DZone E-Commerce — Vercel Deploy Guide (සිංහල)

මචං, මේ ZIP එකේ DZone white-theme single-vendor e-commerce project එකේ **source code** තියෙනවා. ZIP එක extract කරලා Node.js/VS Code වලින් run කරලා, GitHub හරහා Vercel deploy කරන්න පුළුවන්.

## 1. Install කරන්න

- Node.js 24 LTS (22.18+ත් support).
- Visual Studio Code.
- Git (GitHub use කරනවා නම්).
- PostgreSQL database එකක් (Neon වගේ). **Pooled connection string** ගන්න.

## 2. ZIP එක Extract කරලා VS Code Open කරන්න

1. `DZone-Commerce-White-Vercel.zip` Extract කරන්න.
2. ඇතුළේ `dzone-commerce` folder එක VS Code වලින් open කරන්න.
3. Terminal → New Terminal → PowerShell open කරන්න.
4. මේ commands එකින් එක run කරන්න:

```powershell
npm install
Copy-Item .env.example .env
```

## 3. `.env` එක Update කරන්න

`DATABASE_URL` ට ඔයාගේ database pooled URL එක දාන්න.

`AUTH_SECRET` generate කිරීමට:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

ඒ output එක `.env` → `AUTH_SECRET` ට දාන්න. `ADMIN_EMAIL` සහ `ADMIN_PASSWORD` set කරන්න. Password එකට අකුරු 12කට වඩා, uppercase සහ number එකක් තියෙන්න ඕන.

**මේ passwords මට එවන්න එපා, GitHub එකට commit කරන්නත් එපා.**

## 4. Database + Demo Products + Admin

```powershell
npm run db:init
npm run db:seed
npm run admin:create
npm run dev
```

- Website: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`
- DB test: `http://localhost:3000/api/health`

## 5. GitHub Upload

Private repository එකක් create කරලා මේ project එක upload කරන්න. `.gitignore` නිසා local `.env` file එක upload නොවෙන්න ඕන.

```powershell
git init
git add .
git commit -m "Initial DZone Commerce white storefront"
```

Remote GitHub repository URL එක set කරලා `git push` කරන්න (ඔයාගේ repo URL අනුව).

## 6. Vercel

1. Vercel dashboard → Add New → Project.
2. GitHub repo එක Import කරන්න.
3. Framework: Next.js, root: `./`, Node.js 24.x.
4. Environment variables add කරන්න:
   - `DATABASE_URL` (same PostgreSQL database)
   - `AUTH_SECRET` (long random value)
   - `NEXT_PUBLIC_SITE_URL` (`https://...vercel.app` හෝ custom domain)
5. Deploy කරන්න.
6. `/api/health` එකෙන් DB connected බව බලන්න.
7. `/admin` login වෙලා Store Settings → bank account, COD, contacts, banners, shipping set කරන්න.

**Admin password / email Vercel env වලට දාන්න අවශ්‍ය නැහැ**. `admin:create` run කළේ database එකට administrator record එක save කරන්නයි.

## 7. Images Upload

- Public Vercel Blob store එකක් connect කරලා `BLOB_PUBLIC_READ_WRITE_TOKEN` set කළොත් product image upload button එක වැඩ කරනවා.
- Bank receipt privacy සඳහා වෙනම **Private Blob store** එකක් create කරලා `BLOB_PRIVATE_READ_WRITE_TOKEN` set කරන්න.
- Store එකක් connect කරලා නැත්නම් product image එකේ HTTPS URL paste කරන්න පුළුවන්. Private Blob නැත්නම් bank receipt upload නොවෙයි, bank reference/manual verify flow එක use වෙනවා.

## 8. Live යන්න කලින්

- Demo products අයින් කරන්න/replace කරන්න.
- `hello@yourdomain.lk`, phone number, bank details නිවැරදි කරන්න.
- Delivery/Returns/Privacy/Terms sample content legal review කරන්න.
- COD order එකක්, bank transfer order එකක්, inventory update, cancel/return සහ mobile checkout test කරන්න.
- `npm run lint` සහ `npm run build` execute කරලා errors නැති බව verify කරන්න.
- **Commercial sales සඳහා Vercel Hobby plan භාවිත කරන්න එපා**. Vercel Pro හෝ වෙනත් appropriate hosting use කරන්න.

**සටහන:** ZIP එක සෑදූ environment එකේ npm registry access නැති නිසා real dependency installation/build/deployment run කරලා verify කරන්න බැරි වුණා. ඒ නිසා first production launch එකට කලින් ඉහත tests අනිවාර්යයි.
