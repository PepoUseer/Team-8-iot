# Air Buddy

## Popis projektu

Každý člověk se lépe soustředí když může dýchat čistý vzduch. Pokud pracujete v kanceláři, kvalita ovzduší se může často měnit. Proto jsme sestavili měřič koncentrace CO2 v ovzduší, tlaku, teploty a vlhkosti vzduchu. Díky tomuto zařízení můžeme udržovat a dálkově monitorovat kvalitu ovzduší a udržovat tak příjemné pracovní prostředí.

## Stack

- frontend: `React` + `Vite`
- backend: `Express` + `Supabase`

## Spustenie frontendu

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend běží na `http://localhost:5173`.

## Spustenie backendu

```bash
cd backend
npm install
npm run dev
```

Backend běží na `http://localhost:4000`.

## API endpoint

- `GET /api/health`
