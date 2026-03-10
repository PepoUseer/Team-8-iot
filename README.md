# Air Buddy

## Project description

Každý člověk se lépe soustředí když může dýchat čistý vzduch. Pokud pracujete v kanceláři, kvalita ovzduší se může často měnit. Proto jsme sestavili měřič koncentrace CO2 v ovzduší, tlaku, teploty a vlhkosti vzduchu. Díky tomuto zařízení můžeme udržovat a dálkově monitorovat kvalitu ovzduší a udržovat tak příjemné pracovní prostředí.

## Stack

- frontend: `React` + `Vite`
- backend: `Express` + `Supabase`
- package manager: `pnpm` workspace

## Setup

```bash
pnpm install
copy frontend\.env.example frontend\.env
copy backend\.env.example backend\.env
pnpm dev
```

`pnpm dev` z rootu spusti backend aj frontend naraz.

## URLs

- frontend: `http://localhost:5173`
- backend health: `http://localhost:4000/health`