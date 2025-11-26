# Настройка переменных окружения

## Первоначальная настройка

1. **Создайте файл env.js** (если его нет):
   - Скопируйте содержимое из `.env.example`
   - Переименуйте файл в `env.js`
   - Заполните реальными значениями Firebase

2. **Структура env.js**:
```javascript
const ENV = {
    FIREBASE_API_KEY: "ваш-api-ключ",
    FIREBASE_AUTH_DOMAIN: "ваш-проект.firebaseapp.com",
    FIREBASE_DATABASE_URL: "https://ваш-проект.firebasedatabase.app",
    FIREBASE_PROJECT_ID: "ваш-project-id",
    FIREBASE_STORAGE_BUCKET: "ваш-проект.appspot.com",
    FIREBASE_MESSAGING_SENDER_ID: "ваш-sender-id",
    FIREBASE_APP_ID: "ваш-app-id",
    FIREBASE_MEASUREMENT_ID: "ваш-measurement-id"
};
```

## Безопасность

⚠️ **ВАЖНО**: Файл `env.js` содержит конфиденциальные данные!

- ✅ Файл `env.js` добавлен в `.gitignore` и НЕ будет коммититься в Git
- ✅ Для деплоя создавайте `env.js` на сервере вручную
- ✅ Делитесь только файлом `.env.example` с примерами

## Получение конфигурации Firebase

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Выберите ваш проект
3. Перейдите в Настройки проекта (⚙️ → Project Settings)
4. Прокрутите вниз до раздела "Ваши приложения"
5. Скопируйте значения из `firebaseConfig`

## Проверка настройки

После создания `env.js`:
1. Откройте `index.html` в браузере
2. Если конфигурация правильная, вы увидите экран входа
3. В консоли браузера (F12) не должно быть ошибок Firebase

## Проблемы

**Ошибка: "ENV is not defined"**
- Убедитесь, что файл `env.js` существует
- Проверьте, что `env.js` загружается перед `js/config.js` в `index.html`

**Ошибка инициализации Firebase**
- Проверьте правильность всех значений в `env.js`
- Убедитесь, что в Firebase Console включена аутентификация Email/Password




