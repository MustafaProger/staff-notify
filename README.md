# 📢 Staff Notify

Корпоративная система уведомлений для обмена важными объявлениями между сотрудниками компании.

## ✨ Возможности

- 🔐 **JWT-авторизация** с разделением на роли (admin/employee)
- 📱 **Мобильное приложение** на React Native + Expo
- 🎯 **Целевая аудитория**: фильтрация по отделам, ролям или конкретным пользователям
- 📊 **Статистика прочтений** для администраторов и авторов
- ✅ **Отметка прочитанных** сообщений
- 🎨 **Современный UI/UX** с интуитивным интерфейсом
- 🐳 **Docker** поддержка для простого развертывания

## 🛠 Технологический стек

### Backend
- **Node.js** + **Express** (TypeScript)
- **PostgreSQL** + **Prisma ORM**
- **JWT** для авторизации
- **bcrypt** для хеширования паролей
- **Zod** для валидации

### Frontend
- **React Native** + **Expo**
- **TypeScript**
- **Expo Router** для навигации
- **Axios** для HTTP-запросов
- **SecureStore** для безопасного хранения токенов

### DevOps
- **Docker** + **Docker Compose**

## 🚀 Быстрый старт

### Требования

- Node.js 18+ и pnpm
- Docker и Docker Compose
- Git

### Установка

1. **Клонируйте репозиторий**
```bash
git clone https://github.com/yourusername/staff-notify.git
cd staff-notify
```

2. **Запустите базу данных**
```bash
docker-compose up -d
```

3. **Настройте backend**
```bash
cd server

# Создайте .env файл
cat > .env << EOF
DATABASE_URL="postgresql://staff_user:staff_pass@localhost:5432/staff_notify?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
PORT=3000
EOF

# Установите зависимости
pnpm install

# Примените миграции
pnpm prisma:migrate

# Заполните базу тестовыми данными
pnpm seed

# Запустите сервер
pnpm dev
```

4. **Настройте мобильное приложение**
```bash
cd ../mobile

# Установите зависимости
npm install

# Запустите приложение в LAN-режиме на порту 8081
npm start
```

Приложение само берет LAN-адрес из Expo Go и отправляет API-запросы на тот же хост с портом `3000`. Если iPhone не открывает `exp://...` из-за сети, VPN или firewall, запустите Expo через туннель:

```bash
cd mobile
npm run start:tunnel
```

Если API запущен не на этом компьютере или доступен по отдельному адресу, перед запуском можно указать его явно:

```bash
EXPO_PUBLIC_API_URL="http://YOUR_API_HOST:3000" npm start
```

## 🔑 Тестовые аккаунты

### Администратор
- **Email:** `admin@corp.local`
- **Пароль:** `Admin123!`

### Сотрудник
- **Email:** `user1@corp.local`
- **Пароль:** `User123!`

В базе данных также создано 15 тестовых пользователей в 4 отделах (IT, Sales, HR, Finance).

## 📱 Использование

### Для администраторов

1. Войдите в систему с учетными данными администратора
2. Нажмите "Создать" в правом верхнем углу
3. Заполните заголовок и текст объявления
4. Выберите целевую аудиторию (отделы, роли или конкретных пользователей)
5. Опубликуйте объявление

Для просмотра статистики прочтений откройте любое объявление и нажмите "Статистика прочтений".

### Для сотрудников

1. Войдите в систему с учетными данными сотрудника
2. Просматривайте ленту объявлений
3. Открывайте объявления для просмотра деталей
4. Отмечайте прочитанные сообщения

## 🏗 Структура проекта

```
staff-notify/
├── server/                 # Backend приложение
│   ├── src/
│   │   ├── auth/          # Авторизация (routes, middleware)
│   │   ├── announcements/ # API объявлений
│   │   ├── modules/       # Метаданные (roles, departments)
│   │   └── index.ts       # Точка входа
│   ├── prisma/
│   │   ├── schema.prisma  # Схема базы данных
│   │   └── seed.ts        # Тестовые данные
│   └── package.json
│
├── mobile/                 # Mobile приложение
│   ├── app/
│   │   ├── login.tsx      # Экран входа
│   │   ├── register.tsx   # Регистрация
│   │   ├── feed.tsx       # Лента объявлений
│   │   ├── announcement/
│   │   │   ├── [id].tsx   # Детали объявления
│   │   │   └── stats.tsx  # Статистика прочтений
│   │   └── announcements/
│   │       └── create.tsx # Создание объявления
│   ├── lib/
│   │   └── api.ts         # API клиент
│   └── package.json
│
├── docker-compose.yml      # Оркестрация сервисов
└── README.md
```

## 🔒 Безопасность

- Пароли хешируются с помощью bcrypt
- JWT токены хранятся в SecureStore
- Middleware проверяет права доступа
- Валидация данных на всех уровнях
- SQL-инъекции предотвращены через Prisma

## 📊 API Endpoints

### Авторизация
- `POST /auth/login` - Вход
- `POST /auth/register` - Регистрация
- `GET /auth/me` - Текущий пользователь

### Объявления
- `GET /announcements` - Список объявлений (для текущего пользователя)
- `POST /announcements` - Создать объявление
- `GET /announcements/:id` - Детали объявления
- `POST /announcements/:id/read` - Отметить прочитанным
- `GET /announcements/:id/stats` - Статистика прочтений (для админа/автора)

### Метаданные
- `GET /meta/roles` - Список ролей
- `GET /meta/departments` - Список отделов

## 🧪 Тестирование

Для запуска в режиме разработки:

```bash
# Backend
cd server
pnpm dev

# Mobile
cd mobile
npm start
```
