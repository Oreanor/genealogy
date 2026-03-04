# Деплой «Родословная семьи Никонец»

## Сборка

```bash
npm run build
```

## Запуск (production)

```bash
npm run start
```

## Хостинг

### Vercel (рекомендуется)

1. Подключите репозиторий к [vercel.com](https://vercel.com)
2. Деплой происходит автоматически при push

### Standalone (Docker, VPS)

Сборка создаёт папку `.next/standalone`. Для запуска:

```bash
npm run build
cd .next/standalone
node server.js
```

Или через Docker:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Статический экспорт

Приложение использует SSG для глав. Для полностью статического экспорта потребуется доработка `next.config`.
