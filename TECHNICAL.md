# 🔧 Техническая документация — Склад Online v5.1

## Содержание

1. [Технологический стек](#технологический-стек)
2. [Архитектура приложения](#архитектура-приложения)
3. [Модули и их функции](#модули-и-их-функции)
4. [Структура данных](#структура-данных)
5. [API Reference](#api-reference)
6. [Жизненный цикл данных](#жизненный-цикл-данных)
7. [Оптимизация и производительность](#оптимизация-и-производительность)
8. [Безопасность](#безопасность)
9. [Развертывание](#развертывание)
10. [Разработка и отладка](#разработка-и-отладка)

---

## Технологический стек

### Frontend
- **HTML5** — семантическая разметка
- **Tailwind CSS 3.x** (CDN) — утилитарный CSS фреймворк
- **Vanilla JavaScript (ES6+)** — без фреймворков
- **Font Awesome 6.4** — иконки

### Backend/Database
- **Firebase Realtime Database** — облачная NoSQL база данных
- **Firebase Authentication** — аутентификация пользователей
- **LocalStorage API** — локальное хранилище для оффлайн-режима

### Инструменты разработки
- **Git** — контроль версий
- **Browser DevTools** — отладка и профилирование
- **Live Server** — локальная разработка

---

## Архитектура приложения

### Общая архитектура

```
┌─────────────────────────────────────────────────┐
│              index.html (UI Layer)              │
│  ┌─────────┬─────────┬─────────┬─────────────┐ │
│  │Dashboard│ Склад   │Движение │  Проекты    │ │
│  │         │         │         │  Спецификации│ │
│  └─────────┴─────────┴─────────┴─────────────┘ │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│          JavaScript Modules Layer               │
│  ┌────────────────────────────────────────────┐ │
│  │ app.js (Navigation & Orchestration)        │ │
│  ├────────────────────────────────────────────┤ │
│  │ Business Logic Modules:                    │ │
│  │ - warehouse.js  (Склад)                    │ │
│  │ - movements.js  (Движение)                 │ │
│  │ - projects.js   (Проекты)                  │ │
│  │ - specs.js      (Спецификации)             │ │
│  │ - dashboard.js  (Аналитика)                │ │
│  ├────────────────────────────────────────────┤ │
│  │ Infrastructure Modules:                    │ │
│  │ - auth.js       (Аутентификация)           │ │
│  │ - db.js         (Синхронизация данных)     │ │
│  │ - ui.js         (UI компоненты)            │ │
│  │ - utils.js      (Утилиты)                  │ │
│  │ - theme.js      (Темы)                     │ │
│  │ - permissions.js (Система прав доступа)    │ │
│  │ - help.js       (Система справки)          │ │
│  ├────────────────────────────────────────────┤ │
│  │ State Management:                          │ │
│  │ - app-state.js  (Глобальное состояние)     │ │
│  │ - config.js     (Конфигурация Firebase)    │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              Data Persistence Layer             │
│  ┌──────────────────┬──────────────────────┐   │
│  │ Firebase         │  LocalStorage        │   │
│  │ Realtime DB      │  (Offline Cache)     │   │
│  └──────────────────┴──────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Паттерны проектирования

1. **Module Pattern** — каждый файл JS инкапсулирует свою логику
2. **Observer Pattern** — Firebase listeners для real-time обновлений
3. **Cache Pattern** — кеширование расчетов резервов
4. **Singleton Pattern** — единственный экземпляр базы данных

---

## Модули и их функции

### 1. config.js — Конфигурация Firebase

```javascript
const firebaseConfig = {
    apiKey: string,
    authDomain: string,
    databaseURL: string,
    projectId: string,
    storageBucket: string,
    messagingSenderId: string,
    appId: string
};

// Глобальные переменные
let auth: firebase.auth.Auth
let dbRef: firebase.database.Reference
let isDemoMode: boolean
```

**Ответственность:**
- Инициализация Firebase SDK
- Настройка соединения с базой данных
- Обработка ошибок инициализации

---

### 2. app-state.js — Глобальное состояние

```javascript
// Главная база данных
let db = {
    items: Array<Item>,
    projects: Array<Project>,
    specs: Object<ProjectId, Array<Spec>>,
    movements: Array<Movement>
}

// UI состояние
let currentFilterCat: string = 'all'
let selectedProjectId: number | null
let selectedSpecId: string | null
let hasUnsavedChanges: boolean = false

// Массовое удаление
let selectedItems: Set<number>
let massSelectionEnabled: boolean

// Пагинация
let currentPage: number = 1
let itemsPerPage: number | null = 20
let totalPages: number = 1

// Настройки
let deleteProjectsEnabled: boolean

// Сортировка
let sortState = {
    warehouse: { key: string, dir: 'asc' | 'desc' },
    projects: { key: string, dir: 'asc' | 'desc' }
}

// Кеш производительности
let reservesCache: Object<ItemId, number>
let reservesCacheTimestamp: number
const RESERVES_CACHE_TTL = 1000 // ms
```

---

### 3. auth.js — Аутентификация

#### Функции

```javascript
// Firebase Auth State Listener
auth.onAuthStateChanged((user) => {
    // Автоматический вход/выход
})

// Firebase вход
function login(): void
// Параметры: читает из DOM (#loginEmail, #loginPass)
// Обработка ошибок: показывает сообщения об ошибках

// Демо вход (без Firebase)
function demoLogin(): void
// Устанавливает isDemoMode = true
// Вызывает seedData() для демо-данных

// Выход
function logout(): void
// Проверяет несохраненные изменения
// Перезагружает страницу
```

#### События аутентификации

```javascript
// Успешный вход
onAuthSuccess → 
    hideLoginScreen() → 
    updateConnectionStatus() → 
    init()

// Ошибка входа
onAuthError → 
    showErrorMessage() → 
    stopLoader()
```

---

### 4. db.js — Управление данными

#### Функции синхронизации

```javascript
// Инициализация данных
async function init(force: boolean = false): Promise<void>
// 1. Загрузка из Firebase (если не demo и не force)
// 2. Fallback на localStorage
// 3. Валидация структуры данных
// 4. Восстановление настроек пагинации
// 5. Вызов refreshAll()

// Синхронизация с облаком
async function syncWithCloud(): Promise<void>
// 1. Проверка demo-режима
// 2. Отправка db в Firebase
// 3. Сброс флага hasUnsavedChanges
// 4. Обновление UI

// Локальное сохранение
function save(updateUI: boolean = true): void
// 1. Сохранение в localStorage
// 2. Установка hasUnsavedChanges = true
// 3. Инвалидация кеша резервов
// 4. Опциональное обновление UI

// Обновление UI синхронизации
function updateSyncUI(): void
// Изменяет цвет кнопки синхронизации
// - Красный: есть несохраненные изменения
// - Синий: все синхронизировано

// Инициализация demo-данных
function seedData(): void

// Полное обновление UI
function refreshAll(): void
// Вызывает все render-функции
```

#### Алгоритм синхронизации

```
┌─────────────────────┐
│ Пользователь делает │
│    изменение        │
└──────────┬──────────┘
           │
           ▼
    ┌─────────────┐
    │   save()    │ ───► localStorage
    └──────┬──────┘
           │
           ▼
    hasUnsavedChanges = true
           │
           ▼
    ┌─────────────────┐
    │ Кнопка меняет   │
    │ цвет на красный │
    └─────────────────┘
           │
           ▼
    Пользователь нажимает "Синхронизировать"
           │
           ▼
    ┌──────────────────┐
    │ syncWithCloud()  │ ───► Firebase
    └──────┬───────────┘
           │
           ▼
    hasUnsavedChanges = false
           │
           ▼
    ┌─────────────────┐
    │ Кнопка меняет   │
    │ цвет на синий   │
    └─────────────────┘
```

---

### 5. warehouse.js — Логика склада

#### Ключевые функции

```javascript
// Расчет резерва товара (с кешированием)
function getReserve(itemId: number): number
// Алгоритм:
// 1. Проверка актуальности кеша (RESERVES_CACHE_TTL)
// 2. Если кеш устарел - пересчет всех резервов
// 3. Суммирование qty из всех draft спецификаций
// 4. Учет множителя quantity спецификации
// 5. Возврат значения из кеша

// Отрисовка списка категорий
function renderCategoryList(): void
// 1. Подсчет уникальных категорий
// 2. Подсчет товаров в каждой категории
// 3. Отрисовка с badge-счетчиками
// 4. Выделение активной категории

// Фильтрация по категории
function filterCat(category: string | 'all'): void
// 1. Установка currentFilterCat
// 2. Сброс currentPage = 1
// 3. Очистка выбора (selectedItems)
// 4. Перерисовка

// Сортировка таблицы
function setWarehouseSort(key: string): void
// 1. Toggle направления если тот же ключ
// 2. Установка нового ключа сортировки
// 3. Перерисовка

// Отрисовка таблицы товаров (оптимизированная)
function renderWarehouse(): void
// 1. Чтение поискового запроса
// 2. Фильтрация товаров (категория + поиск)
// 3. Сортировка
// 4. Пагинация
// 5. Создание DocumentFragment для производительности
// 6. Расчет резервов и свободных остатков
// 7. Генерация HTML строк
// 8. Единичная вставка в DOM
// 9. Обновление индикаторов сортировки

// Дебаунсированный рендер для поиска
const debouncedRenderWarehouse = debounce(renderWarehouse, 300)

// Пагинация
function setItemsPerPage(count: number | null): void
function prevPage(): void
function nextPage(): void
function updatePaginationButtons(): void

// Массовое удаление
function toggleItemSelection(itemId: number, checked: boolean): void
function toggleSelectAll(): void
function updateSelectAllCheckbox(): void
function updateDeleteButton(): void
function deleteSelectedItems(): void

// Быстрые операции
function openQuickMove(id: number, type: 'in' | 'out'): void
function saveQuickMove(): void
```

#### Алгоритм расчета свободного остатка

```javascript
// Для каждого товара:
const free = item.qty - getReserve(item.id)

// Цветовая индикация:
if (free < 0) {
    color = 'red'    // Критично: не хватает для проектов
} else if (free < 5) {
    color = 'orange' // Предупреждение: мало
} else {
    color = 'blue'   // Норма
}
```

#### Оптимизация рендера

```javascript
// ❌ Плохо: множественные DOM операции
items.forEach(item => {
    tbody.innerHTML += createRow(item)
})

// ✅ Хорошо: DocumentFragment
const fragment = document.createDocumentFragment()
items.forEach(item => {
    fragment.appendChild(createRow(item))
})
tbody.innerHTML = ''
tbody.appendChild(fragment) // Одна операция
```

---

### 6. movements.js — Движение товаров

```javascript
// Открытие формы движения
function handleMovSearch(typing: boolean = false): void
// Показывает dropdown с результатами поиска
// Фильтрация по категории и названию

// Выбор товара из dropdown
function selectMovItem(id: number): void

// Сохранение прихода
function saveMovementIn(): void
// 1. Валидация (товар выбран, количество > 0)
// 2. Увеличение item.qty
// 3. Запись в movements[]
// 4. save() и обновление UI

// Сохранение расхода
function saveMovementOut(): void
// 1. Валидация (товар выбран, количество > 0)
// 2. Проверка достаточности остатка
// 3. Уменьшение item.qty
// 4. Запись в movements[]
// 5. save() и обновление UI

// Отмена операции
function undoMovement(movementId: string): void
// 1. Поиск операции по ID
// 2. Откат изменения qty (обратная операция)
// 3. Удаление из movements[]
// 4. save() и обновление UI

// Отрисовка истории
function renderHistoryTable(): void
// Показывает последние 50 операций
```

---

### 7. projects.js — Управление проектами

```javascript
// Сортировка проектов
function setProjectSort(key: string): void

// Отрисовка таблицы проектов
function renderProjects(): void
// 1. Сортировка по выбранному ключу
// 2. Генерация HTML для каждого проекта
// 3. Различный стиль для закрытых проектов
// 4. Кнопки действий (закрыть/просмотр)

// Закрытие проекта
function closeProject(projectId: number): void
// Алгоритм:
// 1. Подтверждение пользователя
// 2. Поиск всех draft-спецификаций проекта
// 3. Проверка наличия товаров на складе
// 4. Списание всех товаров
// 5. Запись движений в movements[]
// 6. Изменение статуса спецификаций на 'committed'
// 7. Изменение статуса проекта на 'closed'
// 8. save()

// Просмотр закрытого проекта
function viewClosedProject(projectId: number): void
// Показывает модальное окно со всеми спецификациями
// и суммами по проекту

// Копирование проекта
function duplicateProject(projectId: number): void
// 1. Клонирование объекта проекта
// 2. Генерация нового ID
// 3. Добавление "(Копия)" к названию
// 4. Клонирование всех спецификаций
// 5. Сброс статусов на 'active' и 'draft'
// 6. save()

// Работа с карточкой проекта
function openProjectCard(id: number): void
function saveProjectFromCard(): void
function deleteProjectFromCard(): void
function switchProjectTab(tab: 'info' | 'specs'): void
```

#### Жизненный цикл проекта

```
┌──────────────┐
│   Создание   │
│ status=active│
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Добавление           │
│ спецификаций         │
│ (status=draft)       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Списание             │
│ спецификаций         │
│ (status=committed)   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Закрытие проекта     │
│ status=closed        │
│ (все draft → commit) │
└──────────────────────┘
```

---

### 8. specs.js — Спецификации

#### Основные функции

```javascript
// Отрисовка дерева проектов и спецификаций
function renderSpecProjectList(): void
// 1. Группировка по проектам
// 2. Подсчет спецификаций в каждом проекте
// 3. Раскрытие/сворачивание проектов
// 4. Выделение активной спецификации

// Переключение раскрытия проекта
function toggleProjectExpanded(projectId: number): void

// Загрузка спецификации для редактирования
function loadSpec(specId: string): void
// 1. Поиск спецификации по ID
// 2. Заполнение заголовка
// 3. Отрисовка таблицы товаров
// 4. Расчет итоговой суммы
// 5. Показ/скрытие элементов управления

// Поиск товара для добавления
function handleSpecSearch(typing: boolean = false): void
// Dropdown с категорией и названием

// Добавление товара в спецификацию
function addToSpec(): void
// 1. Валидация (товар выбран, qty > 0)
// 2. Проверка дублирования
// 3. Добавление в spec.items[]
// 4. save() и перерисовка

// Добавление нестандартного изделия
function openAddCustomItemModal(): void
function addCustomItem(): void
// Добавляет item с флагом isCustom=true

// Удаление позиции из спецификации
function removeFromSpec(index: number): void

// Изменение множителя количества
function updateSpecQuantity(quantity: number): void
// Пересчет итоговой суммы с учетом множителя

// Списание спецификации
function commitSpec(): void
// Алгоритм:
// 1. Подтверждение
// 2. Расчет финального количества (qty * specQuantity)
// 3. Проверка наличия товаров
// 4. Списание со склада
// 5. Запись в movements[]
// 6. Изменение статуса на 'committed'
// 7. save()

// Печать спецификации
function printSpec(withPrices: boolean = true): void
// 1. Создание HTML для печати
// 2. Заполнение #printArea
// 3. window.print()

// Создание/копирование спецификаций
function openAddSpecModal(): void
function openCreateNewSpec(): void
function openSelectExistingSpec(): void
function copyExistingSpec(sourceSpecId: string): void
```

#### Алгоритм резервирования

```javascript
// При добавлении товара в draft-спецификацию:
// → товар резервируется автоматически
// → free = qty - reserve

// При списании спецификации (commit):
// 1. Резерв освобождается
// 2. Товар реально списывается со склада
// 3. qty уменьшается

// При удалении из спецификации:
// → резерв освобождается
```

#### Расчет итоговой суммы

```javascript
// Для обычных товаров:
totalCost = Σ(item.cost * item.qty * specQuantity)

// Для нестандартных изделий:
totalCost = Σ(customItem.cost * customItem.qty * specQuantity)
```

---

### 9. dashboard.js — Аналитика

```javascript
function renderDashboard(): void {
    // 1. Стоимость склада
    totalMoney = Σ(item.cost * item.qty)
    
    // 2. Активные проекты
    activeProjects = projects.filter(p => p.status === 'active')
    activeBudget = Σ(activeProjects.cost)
    
    // 3. Критичные остатки
    lowStockItems = items.filter(item => {
        free = item.qty - getReserve(item.id)
        return free < 0
    })
    
    // 4. Горящие сроки (7 дней)
    today = new Date()
    upcomingDeadlines = projects.filter(p => {
        if (p.status !== 'active' || !p.end) return false
        deadline = new Date(p.end)
        diffDays = (deadline - today) / (1000 * 60 * 60 * 24)
        return diffDays <= 7
    })
    
    // 5. Последние операции
    recentMovements = movements.slice(0, 5)
}
```

---

### 10. ui.js — UI компоненты

```javascript
// Управление модальными окнами
function openModal(modalId: string): void
function closeModal(modalId: string): void

// Карточка товара
function openItemCard(id: number): void
function saveItemFromCard(): void
function deleteItemFromCard(): void
function switchModalTab(tab: 'info' | 'history'): void
function updateCardPreview(): void

// Создание товара
function openCreateItemModal(): void
function createNewItem(): void

// Создание проекта
function openCreateProjectModal(): void
function createNewProject(): void

// Настройки
function openSettings(): void
function toggleMassSelectionSetting(enabled: boolean): void
function toggleDeleteProjectsSetting(enabled: boolean): void

// Экспорт/Импорт
function exportData(): void
function importData(input: HTMLInputElement): void
function importLegacyCSV(input: HTMLInputElement): void
function exportToExcel(): void

// Datalist рендер
function renderDatalists(): void
```

---

### 11. utils.js — Утилиты

```javascript
// Дебаунс
function debounce(func: Function, wait: number): Function

// Форматирование чисел
function formatNumber(value: number, decimals: number = 2): string
// Убирает лишние нули: 10.00 → 10, 10.50 → 10.5

// Форматирование валюты
function formatCurrency(value: number, decimals: number = 2): string
// Добавляет символ рубля: 1000 → "1000 ₽"

// Экранирование HTML атрибутов
function escapeAttr(str: string): string
// Защита от XSS

// Конвертация Google Drive ссылок
function getDirectImageUrl(url: string): string
// drive.google.com/file/d/ID → drive.google.com/uc?export=view&id=ID

// Loader
function showLoader(visible: boolean): void

// Toast уведомления
function showToast(message: string): void
```

---

### 12. theme.js — Темы

```javascript
// Переключение темы
function toggleTheme(): void
// 1. Проверка текущей темы (html.classList)
// 2. Toggle класса 'dark'
// 3. Сохранение в localStorage
// 4. Обновление иконки

// Загрузка сохраненной темы
function loadSavedTheme(): void
// При загрузке страницы
```

---

## Структура данных

### TypeScript Definitions (для справки)

```typescript
interface Item {
    id: number;
    name: string;
    manuf: string;          // Производитель
    cat: string;            // Категория
    qty: number;            // Количество
    unit: string;           // Единица измерения
    cost: number;           // Цена за единицу
    img?: string;           // URL изображения
    file?: string;          // URL файла/документа
    chars?: string;         // Характеристики
}

interface Project {
    id: number;
    year: string;
    num: string;            // Номер заявки
    name: string;
    desc?: string;
    client: string;
    start: string;          // Дата ISO
    end: string;            // Дата ISO
    cost: number;           // Бюджет
    status: 'active' | 'closed';
    file?: string;          // URL файла
}

interface SpecItem {
    itemId?: number;        // Для обычных товаров
    qty: number;
    isCustom: boolean;
    // Для нестандартных:
    name?: string;
    cost?: number;
    unit?: string;
}

interface Spec {
    id: string;
    name: string;
    status: 'draft' | 'committed';
    date: string;
    quantity: number;       // Множитель количества
    items: SpecItem[];
}

interface Movement {
    id: string;
    date: string;
    type: 'in' | 'out';
    itemId: number;
    itemName: string;
    qty: number;
    invoice?: string;
}

interface Database {
    items: Item[];
    projects: Project[];
    specs: Record<number, Spec[]>;  // projectId → specs[]
    movements: Movement[];
}
```

---

## API Reference

### Ключевые глобальные переменные

```javascript
// База данных
db: Database

// Firebase
auth: firebase.auth.Auth
dbRef: firebase.database.Reference
isDemoMode: boolean

// Состояние UI
currentFilterCat: string
selectedProjectId: number | null
selectedSpecId: string | null
hasUnsavedChanges: boolean
selectedItems: Set<number>
massSelectionEnabled: boolean
deleteProjectsEnabled: boolean

// Пагинация
currentPage: number
itemsPerPage: number | null
totalPages: number

// Кеш
reservesCache: Record<number, number>
reservesCacheTimestamp: number
```

### Основные функции

#### Навигация
```javascript
switchTab(tabName: 'dashboard' | 'warehouse' | 'movements' | 'projects' | 'specs'): void
```

#### Работа с данными
```javascript
init(force?: boolean): Promise<void>
save(updateUI?: boolean): void
syncWithCloud(): Promise<void>
refreshAll(): void
```

#### Склад
```javascript
renderWarehouse(): void
filterCat(category: string | 'all'): void
setWarehouseSort(key: string): void
getReserve(itemId: number): number
openItemCard(itemId: number): void
openQuickMove(itemId: number, type: 'in' | 'out'): void
```

#### Движение
```javascript
saveMovementIn(): void
saveMovementOut(): void
undoMovement(movementId: string): void
```

#### Проекты
```javascript
renderProjects(): void
openProjectCard(projectId: number): void
closeProject(projectId: number): void
duplicateProject(projectId: number): void
```

#### Спецификации
```javascript
loadSpec(specId: string): void
addToSpec(): void
commitSpec(): void
printSpec(withPrices?: boolean): void
```

#### UI
```javascript
openModal(modalId: string): void
closeModal(modalId: string): void
showToast(message: string): void
showLoader(visible: boolean): void
```

---

## Жизненный цикл данных

### 1. Загрузка приложения

```
Загрузка index.html
    ↓
Инициализация Firebase (config.js)
    ↓
Проверка аутентификации (auth.js)
    ├─→ Пользователь авторизован
    │       ↓
    │   init() загружает данные
    │       ├─→ Firebase (приоритет)
    │       └─→ localStorage (fallback)
    │           ↓
    │   refreshAll() рендерит UI
    │
    └─→ Пользователь НЕ авторизован
            ↓
        Показ экрана входа
        Демо-режим / Firebase вход
```

### 2. Изменение данных

```
Пользователь делает изменение
    ↓
Изменение объекта db
    ↓
save() → localStorage
    ↓
hasUnsavedChanges = true
    ↓
updateSyncUI() (красная кнопка)
    ↓
refreshAll() (опционально)
```

### 3. Синхронизация

```
Нажатие кнопки "Синхронизировать"
    ↓
syncWithCloud()
    ↓
Firebase: dbRef.set(db)
    ↓
hasUnsavedChanges = false
    ↓
updateSyncUI() (синяя кнопка)
```

---

## Оптимизация и производительность

### 1. Кеширование резервов

**Проблема:** Расчет резервов для каждого товара при каждом рендере O(n*m*k) — дорого.

**Решение:** Кеш с TTL 1 секунда.

```javascript
function getReserve(itemId) {
    const now = Date.now();
    if (now - reservesCacheTimestamp > RESERVES_CACHE_TTL) {
        // Пересчитать ВСЕ резервы за один проход
        reservesCache = {};
        // ... расчет
        reservesCacheTimestamp = now;
    }
    return reservesCache[itemId] || 0;
}
```

### 2. Debounce для поиска

```javascript
const debouncedRenderWarehouse = debounce(renderWarehouse, 300);
```

Предотвращает рендер при каждом нажатии клавиши.

### 3. DocumentFragment для рендера

```javascript
const fragment = document.createDocumentFragment();
items.forEach(item => {
    fragment.appendChild(createRow(item));
});
tbody.appendChild(fragment); // Одна операция DOM
```

### 4. Пагинация

Рендерится только видимая страница (20-100 товаров), а не все 10,000.

### 5. Lazy Loading изображений

```html
<img loading="lazy" src="...">
```

### 6. CSS transitions вместо JS анимаций

Более производительно, использует GPU.

---

## Безопасность

### 1. Firebase Security Rules

**Текущие правила (базовые):**
```json
{
  "rules": {
    "warehouse_v4": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

**Рекомендованные правила (продвинутые):**
```json
{
  "rules": {
    "warehouse_v4": {
      ".read": "auth != null && auth.token.email_verified == true",
      ".write": "auth != null && auth.token.email_verified == true",
      ".validate": "newData.hasChildren(['items', 'projects', 'specs', 'movements'])",
      "items": {
        "$itemId": {
          ".validate": "newData.hasChildren(['id', 'name', 'qty', 'cost'])"
        }
      }
    }
  }
}
```

### 2. XSS Protection

```javascript
// Всегда экранируйте пользовательский ввод
function escapeAttr(str) {
    return str.replace(/&/g,'&amp;')
              .replace(/"/g,'&quot;')
              .replace(/'/g,'&#39;')
              .replace(/</g,'&lt;')
              .replace(/>/g,'&gt;');
}

// Использование:
const fileUrl = escapeAttr(item.file);
html += `<a href="${fileUrl}">...</a>`;
```

### 3. Валидация на клиенте

```javascript
if (!qty || qty <= 0) {
    return alert('Введите корректное количество!');
}

if (item.qty < qty) {
    return alert('Недостаточно товара на складе!');
}
```

### 4. HTTPS обязателен

Firebase требует HTTPS для production.

---

## Развертывание

### Вариант 1: Firebase Hosting (рекомендуется)

```bash
# Установка Firebase CLI
npm install -g firebase-tools

# Вход
firebase login

# Инициализация
firebase init hosting

# Деплой
firebase deploy
```

### Вариант 2: GitHub Pages

```bash
# Создайте репозиторий на GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/warehouse.git
git push -u origin main

# В Settings → Pages выберите main branch
```

### Вариант 3: Netlify

1. Перетащите папку проекта на netlify.com
2. Автоматический деплой

### Вариант 4: Собственный хостинг

```nginx
# Nginx конфигурация
server {
    listen 80;
    server_name warehouse.example.com;
    
    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name warehouse.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/warehouse;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Разработка и отладка

### Локальный сервер

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

### Отладка

#### Просмотр состояния базы данных
```javascript
// В консоли браузера (F12)
console.log(JSON.stringify(db, null, 2));
```

#### Очистка localStorage
```javascript
localStorage.clear();
location.reload();
```

#### Принудительная синхронизация
```javascript
init(true);  // force reload
```

#### Просмотр Firebase данных
Firebase Console → Realtime Database → Data

### Профилирование производительности

```javascript
// Замер времени выполнения
console.time('renderWarehouse');
renderWarehouse();
console.timeEnd('renderWarehouse');

// Chrome DevTools → Performance → Record
```

---

## Тестирование

### Ручное тестирование

#### Чек-лист функциональности

- [ ] Вход через Firebase
- [ ] Демо вход
- [ ] Создание товара
- [ ] Редактирование товара
- [ ] Удаление товара
- [ ] Поиск товара
- [ ] Фильтрация по категории
- [ ] Сортировка таблицы
- [ ] Пагинация (20/100/Все)
- [ ] Массовое удаление
- [ ] Быстрый приход
- [ ] Быстрое списание
- [ ] Создание проекта
- [ ] Закрытие проекта
- [ ] Копирование проекта
- [ ] Удаление проекта
- [ ] Создание спецификации
- [ ] Добавление товара в спецификацию
- [ ] Нестандартное изделие
- [ ] Множитель количества
- [ ] Списание спецификации
- [ ] Печать спецификации
- [ ] Дашборд метрики
- [ ] Синхронизация с облаком
- [ ] Экспорт данных
- [ ] Импорт данных
- [ ] Переключение темы

### Unit-тесты (будущее развитие)

```javascript
// Пример с Jest
describe('getReserve', () => {
    test('returns 0 for item without reservations', () => {
        expect(getReserve(999)).toBe(0);
    });
    
    test('calculates reserve from draft specs', () => {
        // Mock data
        db.specs = {
            1: [{
                status: 'draft',
                quantity: 2,
                items: [{ itemId: 1, qty: 5 }]
            }]
        };
        expect(getReserve(1)).toBe(10); // 5 * 2
    });
});
```

---

## FAQ для разработчиков

### Как добавить новое поле в товар?

1. Добавьте поле в интерфейсе (HTML форма)
2. Обновите функции `createNewItem()` и `saveItemFromCard()`
3. Обновите `seedData()` для демо-данных
4. Обновите `renderWarehouse()` для отображения

### Как изменить структуру базы данных?

1. Изменить интерфейсы в комментариях
2. Обновить `seedData()`
3. Добавить миграцию в `init()`:
   ```javascript
   if (!db.newField) db.newField = defaultValue;
   ```

### Как добавить новый модуль?

1. Создать файл `js/module-name.js`
2. Подключить в `index.html` перед `app.js`
3. Использовать глобальные переменные из `app-state.js`

### Почему не использовать React/Vue?

Проект начинался как простое приложение и вырос органически. Преимущества vanilla JS:
- Нет сборки
- Быстрая загрузка
- Простота развертывания

Для масштабирования рекомендуется рефакторинг на фреймворк.

---

## Глоссарий терминов

- **Резерв** — количество товара, зарезервированное в черновых спецификациях
- **Свободный остаток** — qty - reserve, доступно для новых проектов
- **Черновая спецификация (draft)** — не списана, резервирует товары
- **Списанная спецификация (committed)** — товары реально списаны со склада
- **Активный проект** — status='active', в работе
- **Закрытый проект** — status='closed', все спецификации списаны
- **Множитель** — quantity спецификации, умножает количество всех позиций
- **Нестандартное изделие** — позиция не из склада, с кастомными параметрами

---

## Контрибьюция

### Стиль кода

- **Отступы**: 4 пробела
- **Кавычки**: одинарные `'` для строк
- **Точка с запятой**: обязательна
- **Имена переменных**: camelCase
- **Имена функций**: camelCase
- **Комментарии**: на русском языке

### Commit messages

```
feat: добавлена поддержка штрих-кодов
fix: исправлен баг с резервированием
refactor: оптимизирован рендер таблицы
docs: обновлена документация
```

---

**Последнее обновление:** 24 ноября 2025

**Версия документации:** 1.0

**Автор:** Разработано для эффективного управления складом





