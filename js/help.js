// --- HELP MODULE ---

// Навигация по разделам справки
function showHelpSection(sectionId) {
    // Обновляем активную кнопку
    document.querySelectorAll('.help-nav-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-blue-100', 'dark:bg-slate-700', 'text-blue-700', 'dark:text-blue-400', 'font-bold');
    });
    event.target.closest('.help-nav-btn').classList.add('active', 'bg-blue-100', 'dark:bg-slate-700', 'text-blue-700', 'dark:text-blue-400', 'font-bold');
    
    // Загружаем контент
    const content = document.getElementById('helpContent');
    content.innerHTML = getHelpSectionContent(sectionId);
    
    // Прокручиваем вверх
    content.parentElement.scrollTop = 0;
}

// Получение контента раздела
function getHelpSectionContent(sectionId) {
    const sections = {
        quickstart: `
            <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6 transition-colors">
                <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-rocket text-blue-600"></i>
                    Быстрый старт
                </h2>
                
                <div class="prose dark:prose-invert max-w-none">
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">🚀 Запуск за 2 минуты</h3>
                    
                    <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-4 mb-4">
                        <p class="font-bold text-blue-900 dark:text-blue-300 mb-2">Шаг 1: Вы уже в системе! ✅</p>
                        <p class="text-slate-700 dark:text-slate-400 text-sm">Вы уже вошли и можете начинать работу со складом.</p>
                    </div>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">📚 Основные операции</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                <i class="fas fa-plus-circle text-green-600"></i>
                                Добавить товар
                            </h4>
                            <ol class="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                                <li>Вкладка "Склад"</li>
                                <li>Кнопка "+ Товар"</li>
                                <li>Заполните форму</li>
                                <li>Нажмите "Создать"</li>
                            </ol>
                        </div>
                        
                        <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                <i class="fas fa-arrow-down text-green-600"></i>
                                Быстрый приход
                            </h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400">
                                В таблице склада нажмите 🟢 (зелёную стрелку вниз) возле нужного товара.
                            </p>
                        </div>
                        
                        <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                <i class="fas fa-arrow-up text-red-600"></i>
                                Быстрое списание
                            </h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400">
                                В таблице склада нажмите 🔴 (красную стрелку вверх) возле нужного товара.
                            </p>
                        </div>
                        
                        <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                <i class="fas fa-project-diagram text-blue-600"></i>
                                Создать проект
                            </h4>
                            <ol class="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                                <li>Вкладка "Проекты"</li>
                                <li>Кнопка "+ Проект"</li>
                                <li>Заполните данные</li>
                                <li>Нажмите "Создать"</li>
                            </ol>
                        </div>
                    </div>
                    
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-600 p-4 mt-6">
                        <p class="font-bold text-yellow-900 dark:text-yellow-300 mb-2">💡 Совет</p>
                        <p class="text-slate-700 dark:text-slate-400 text-sm">Регулярно делайте резервные копии через Настройки → "Скачать базу (Backup)"</p>
                    </div>
                </div>
            </div>
        `,
        
        warehouse: `
            <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6 transition-colors">
                <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-boxes text-blue-600"></i>
                    Управление складом
                </h2>
                
                <div class="prose dark:prose-invert max-w-none">
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">📦 Добавление товара</h3>
                    
                    <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border dark:border-slate-600 mb-4">
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-3">Заполните следующие поля:</p>
                        <ul class="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                            <li><strong class="text-slate-800 dark:text-white">Наименование</strong> — название товара</li>
                            <li><strong class="text-slate-800 dark:text-white">Производитель</strong> — бренд или производитель</li>
                            <li><strong class="text-slate-800 dark:text-white">Категория</strong> — группа товара (создаётся автоматически)</li>
                            <li><strong class="text-slate-800 dark:text-white">Начальный остаток</strong> — количество на складе</li>
                            <li><strong class="text-slate-800 dark:text-white">Единица измерения</strong> — шт., п.м., уп., кг</li>
                            <li><strong class="text-slate-800 dark:text-white">Цена</strong> — стоимость за единицу</li>
                            <li><strong class="text-slate-800 dark:text-white">Характеристики</strong> — дополнительное описание</li>
                            <li><strong class="text-slate-800 dark:text-white">Фото URL</strong> — ссылка на изображение</li>
                            <li><strong class="text-slate-800 dark:text-white">Файл URL</strong> — ссылка на документ/паспорт</li>
                        </ul>
                    </div>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">✏️ Редактирование товара</h3>
                    <p class="text-slate-600 dark:text-slate-400 mb-4">
                        Кликните на строку товара в таблице. Откроется карточка с двумя вкладками:
                    </p>
                    <ul class="text-sm text-slate-600 dark:text-slate-400 space-y-2 mb-4">
                        <li><strong class="text-slate-800 dark:text-white">Инфо</strong> — редактирование основных данных</li>
                        <li><strong class="text-slate-800 dark:text-white">История</strong> — операции и использование в проектах</li>
                    </ul>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">🔍 Поиск и фильтрация</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2">Поиск</h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400">Введите название или производителя в строку поиска</p>
                        </div>
                        <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2">Категории</h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400">Выберите категорию в правой панели</p>
                        </div>
                        <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2">Сортировка</h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400">Кликните на заголовок колонки</p>
                        </div>
                    </div>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">📄 Пагинация</h3>
                    <p class="text-slate-600 dark:text-slate-400 mb-2">Выберите режим отображения:</p>
                    <ul class="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                        <li><strong class="text-slate-800 dark:text-white">20</strong> — по 20 товаров на странице</li>
                        <li><strong class="text-slate-800 dark:text-white">100</strong> — по 100 товаров</li>
                        <li><strong class="text-slate-800 dark:text-white">Все</strong> — показать все товары</li>
                    </ul>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">🗑️ Массовое удаление</h3>
                    <ol class="text-sm text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside">
                        <li>Включите в <strong>Настройках</strong> → "Массовый выбор"</li>
                        <li>Выберите товары чекбоксами в таблице</li>
                        <li>Нажмите кнопку <strong>"Удалить выбранные"</strong></li>
                    </ol>
                </div>
            </div>
        `,
        
        movements: `
            <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6 transition-colors">
                <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-exchange-alt text-blue-600"></i>
                    Работа со складом
                </h2>
                
                <div class="prose dark:prose-invert max-w-none">
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">⬇️ Операция прихода</h3>
                    <ol class="text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside mb-4">
                        <li>Откройте выпадающее меню <strong>"Ещё"</strong> в навигации и выберите <strong>"Работа со складом"</strong></li>
                        <li>Начните вводить название товара (появится выпадающий список)</li>
                        <li>Выберите товар из списка</li>
                        <li>Введите количество</li>
                        <li>Укажите номер накладной (опционально)</li>
                        <li>Нажмите зелёную кнопку <strong>"Приход"</strong></li>
                    </ol>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">⬆️ Операция расхода</h3>
                    <p class="text-slate-600 dark:text-slate-400 mb-4">
                        Процесс аналогичен приходу, но нажимайте красную кнопку <strong>"Списание"</strong>.
                    </p>
                    
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-600 p-4 mb-4">
                        <p class="font-bold text-yellow-900 dark:text-yellow-300 mb-2">⚠️ Важно</p>
                        <p class="text-slate-700 dark:text-slate-400 text-sm">При списании система проверяет наличие товара на складе. Если недостаточно — операция будет отменена.</p>
                    </div>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">📜 История операций</h3>
                    <p class="text-slate-600 dark:text-slate-400 mb-4">
                        В нижней части экрана отображаются последние 50 операций. Каждую операцию можно отменить, нажав на кнопку 🗑️.
                    </p>
                    
                    <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-4">
                        <p class="font-bold text-blue-900 dark:text-blue-300 mb-2">💡 Совет</p>
                        <p class="text-slate-700 dark:text-slate-400 text-sm">Используйте быстрые операции (стрелки в таблице склада) для моментального прихода/списания без перехода на другую вкладку.</p>
                    </div>
                </div>
            </div>
        `,
        
        projects: `
            <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6 transition-colors">
                <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-project-diagram text-blue-600"></i>
                    Управление проектами
                </h2>
                
                <div class="prose dark:prose-invert max-w-none">
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">➕ Создание проекта</h3>
                    <ol class="text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside mb-4">
                        <li>Перейдите на вкладку <strong>"Проекты"</strong></li>
                        <li>Нажмите кнопку <strong>"+ Проект"</strong></li>
                        <li>Заполните данные проекта</li>
                        <li>Нажмите <strong>"Создать"</strong></li>
                    </ol>
                    
                    <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border dark:border-slate-600 mb-4">
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-3 font-bold">Поля проекта:</p>
                        <ul class="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                            <li><strong>Год</strong> — год выполнения проекта</li>
                            <li><strong>Номер заявки</strong> — уникальный номер</li>
                            <li><strong>Наименование</strong> — название проекта</li>
                            <li><strong>Описание</strong> — подробное описание</li>
                            <li><strong>Заказчик</strong> — имя клиента</li>
                            <li><strong>Дата начала</strong> — старт проекта</li>
                            <li><strong>Срок сдачи</strong> — дедлайн</li>
                            <li><strong>Бюджет</strong> — плановая стоимость</li>
                        </ul>
                    </div>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">📝 Работа с проектом</h3>
                    <p class="text-slate-600 dark:text-slate-400 mb-2">
                        Кликните на название проекта, чтобы открыть карточку с двумя вкладками:
                    </p>
                    <ul class="text-sm text-slate-600 dark:text-slate-400 space-y-2 mb-4">
                        <li><strong>Основная информация</strong> — редактирование данных проекта</li>
                        <li><strong>Спецификации</strong> — список всех спецификаций с суммами</li>
                    </ul>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">✅ Закрытие проекта</h3>
                    <ol class="text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside mb-4">
                        <li>В таблице проектов найдите нужный проект</li>
                        <li>Нажмите кнопку <strong>"Закрыть"</strong></li>
                        <li>Система проверит наличие товаров</li>
                        <li>Все товары из черновых спецификаций будут списаны автоматически</li>
                        <li>Проект перейдёт в статус "Закрыт"</li>
                    </ol>
                    
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-600 p-4 mb-4">
                        <p class="font-bold text-yellow-900 dark:text-yellow-300 mb-2">⚠️ Важно</p>
                        <p class="text-slate-700 dark:text-slate-400 text-sm">Закрытие проекта нельзя отменить! Убедитесь, что все спецификации готовы к списанию.</p>
                    </div>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">📋 Копирование проекта</h3>
                    <p class="text-slate-600 dark:text-slate-400 mb-2">
                        В карточке проекта нажмите кнопку <strong>"Копия"</strong>. Создастся полная копия проекта со всеми спецификациями.
                    </p>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">🗑️ Удаление проекта</h3>
                    <ol class="text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside">
                        <li>Включите в <strong>Настройках</strong> → "Удаление проектов"</li>
                        <li>В карточке проекта нажмите <strong>"Удалить проект"</strong></li>
                        <li>Подтвердите удаление</li>
                    </ol>
                </div>
            </div>
        `,
        
        specs: `
            <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6 transition-colors">
                <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-file-invoice text-blue-600"></i>
                    Спецификации
                </h2>
                
                <div class="prose dark:prose-invert max-w-none">
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">➕ Создание спецификации</h3>
                    <ol class="text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside mb-4">
                        <li>Перейдите на вкладку <strong>"Спецификации"</strong></li>
                        <li>Выберите проект в левой панели</li>
                        <li>Нажмите <strong>"+ Добавить спецификацию"</strong></li>
                        <li>Выберите вариант:
                            <ul class="ml-6 mt-2 space-y-1">
                                <li><strong>Создать новую</strong> — пустая спецификация</li>
                                <li><strong>Использовать существующую</strong> — копия из другого проекта</li>
                            </ul>
                        </li>
                    </ol>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">📦 Добавление товаров</h3>
                    <ol class="text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside mb-4">
                        <li>В поле поиска начните вводить название товара</li>
                        <li>Выберите товар из выпадающего списка</li>
                        <li>Укажите количество</li>
                        <li>Нажмите синюю кнопку <strong>"+"</strong></li>
                    </ol>
                    
                    <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-4 mb-4">
                        <p class="font-bold text-blue-900 dark:text-blue-300 mb-2">💡 Резервирование</p>
                        <p class="text-slate-700 dark:text-slate-400 text-sm">Когда вы добавляете товар в спецификацию, он автоматически резервируется! Свободный остаток = Всего - Резерв.</p>
                    </div>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">⚙️ Нестандартное изделие</h3>
                    <p class="text-slate-600 dark:text-slate-400 mb-2">
                        Нажмите желтую кнопку <strong>"+"</strong> и заполните:
                    </p>
                    <ul class="text-sm text-slate-600 dark:text-slate-400 space-y-2 mb-4">
                        <li>Наименование</li>
                        <li>Единицу измерения</li>
                        <li>Количество</li>
                        <li>Цену</li>
                    </ul>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">✖️ Множитель количества</h3>
                    <p class="text-slate-600 dark:text-slate-400 mb-4">
                        В верхней части спецификации есть поле <strong>"Количество"</strong>. Если вам нужно несколько одинаковых изделий, установите множитель:
                    </p>
                    <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border dark:border-slate-600 mb-4">
                        <p class="text-sm text-slate-600 dark:text-slate-400">
                            <strong>Пример:</strong> Спецификация на 1 шкаф содержит 10 винтов. Если нужно 5 шкафов — установите множитель 5. Итого будет зарезервировано 50 винтов.
                        </p>
                    </div>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">🖨️ Печать спецификации</h3>
                    <ul class="text-slate-600 dark:text-slate-400 space-y-2 mb-4">
                        <li><strong>"Печать"</strong> — с ценами (для офиса)</li>
                        <li><strong>"Печать для производства"</strong> — без цен (для цеха)</li>
                    </ul>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">✅ Списание спецификации</h3>
                    <ol class="text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside mb-4">
                        <li>Убедитесь, что все товары добавлены</li>
                        <li>Нажмите зеленую кнопку <strong>"Списать"</strong></li>
                        <li>Подтвердите операцию</li>
                        <li>Товары автоматически спишутся со склада</li>
                        <li>Спецификация перейдет в статус "Списана"</li>
                    </ol>
                    
                    <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 p-4">
                        <p class="font-bold text-red-900 dark:text-red-300 mb-2">⚠️ Внимание</p>
                        <p class="text-slate-700 dark:text-slate-400 text-sm">Списание спецификации нельзя отменить! Товары будут реально списаны со склада.</p>
                    </div>
                </div>
            </div>
        `,
        
        dashboard: `
            <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6 transition-colors">
                <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-chart-pie text-blue-600"></i>
                    Аналитический дашборд
                </h2>
                
                <div class="prose dark:prose-invert max-w-none">
                    <p class="text-slate-600 dark:text-slate-400 mb-6">
                        Дашборд показывает ключевые метрики и помогает быстро оценить состояние склада и проектов.
                    </p>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">📊 Основные метрики</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-600">
                            <h4 class="font-bold text-blue-900 dark:text-blue-300 mb-2">💰 Стоимость склада</h4>
                            <p class="text-sm text-slate-700 dark:text-slate-400">Общая стоимость всех товаров на складе. Рассчитывается как сумма (цена × количество) для каждого товара.</p>
                        </div>
                        
                        <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-600">
                            <h4 class="font-bold text-green-900 dark:text-green-300 mb-2">✅ Активные проекты</h4>
                            <p class="text-sm text-slate-700 dark:text-slate-400">Количество проектов в работе и их совокупный бюджет.</p>
                        </div>
                        
                        <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-l-4 border-red-600">
                            <h4 class="font-bold text-red-900 dark:text-red-300 mb-2">⚠️ Мало товара</h4>
                            <p class="text-sm text-slate-700 dark:text-slate-400">Товары с отрицательным свободным остатком (зарезервировано больше, чем есть на складе).</p>
                        </div>
                        
                        <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border-l-4 border-orange-600">
                            <h4 class="font-bold text-orange-900 dark:text-orange-300 mb-2">🔥 Горят сроки</h4>
                            <p class="text-sm text-slate-700 dark:text-slate-400">Проекты со сроком сдачи в течение ближайших 7 дней.</p>
                        </div>
                    </div>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">📈 Виджеты</h3>
                    
                    <div class="space-y-4">
                        <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2">
                                <i class="fas fa-clock text-orange-500 mr-2"></i>Срочные проекты
                            </h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400">Список проектов с ближайшими дедлайнами. Показывается количество дней до сдачи.</p>
                        </div>
                        
                        <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2">
                                <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>Требуют внимания
                            </h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400">Товары с критическими остатками. Необходимо пополнить запасы или скорректировать резервы.</p>
                        </div>
                        
                        <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2">
                                <i class="fas fa-history text-blue-500 mr-2"></i>Последние операции
                            </h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400">Последние 5 движений товаров. Можно быстро отменить операцию, если была допущена ошибка.</p>
                        </div>
                    </div>
                    
                    <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-4 mt-6">
                        <p class="font-bold text-blue-900 dark:text-blue-300 mb-2">💡 Совет</p>
                        <p class="text-slate-700 dark:text-slate-400 text-sm">Начинайте рабочий день с просмотра дашборда — это позволит сразу увидеть проблемные места и приоритетные задачи.</p>
                    </div>
                </div>
            </div>
        `,
        
        settings: `
            <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6 transition-colors">
                <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-cog text-blue-600"></i>
                    Настройки
                </h2>
                
                <div class="prose dark:prose-invert max-w-none">
                    <p class="text-slate-600 dark:text-slate-400 mb-6">
                        Настройки доступны через кнопку ⚙️ в правом верхнем углу.
                    </p>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">🔘 Переключатели функций</h3>
                    
                    <div class="space-y-4 mb-6">
                        <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2">Массовый выбор (удаление)</h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                Включает чекбоксы в таблице склада для массового удаления товаров.
                            </p>
                            <p class="text-xs text-slate-500 dark:text-slate-500">По умолчанию: выключено (для безопасности)</p>
                        </div>
                        
                        <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2">Удаление проектов</h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                Разрешает удаление проектов из карточки проекта.
                            </p>
                            <p class="text-xs text-slate-500 dark:text-slate-500">По умолчанию: выключено (для безопасности)</p>
                        </div>
                    </div>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">💾 Резервное копирование</h3>
                    
                    <div class="space-y-4 mb-6">
                        <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-600">
                            <h4 class="font-bold text-green-900 dark:text-green-300 mb-2">Скачать базу (Backup)</h4>
                            <p class="text-sm text-slate-700 dark:text-slate-400">
                                Экспортирует все данные в JSON файл. Рекомендуется делать регулярные резервные копии (раз в неделю или после важных изменений).
                            </p>
                        </div>
                        
                        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-600">
                            <h4 class="font-bold text-blue-900 dark:text-blue-300 mb-2">Загрузить базу (JSON)</h4>
                            <p class="text-sm text-slate-700 dark:text-slate-400">
                                Импортирует данные из ранее сохраненной резервной копии. Полностью заменяет текущие данные!
                            </p>
                        </div>
                        
                        <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border-l-4 border-orange-600">
                            <h4 class="font-bold text-orange-900 dark:text-orange-300 mb-2">Импорт из старого CSV</h4>
                            <p class="text-sm text-slate-700 dark:text-slate-400">
                                Миграция данных из устаревших CSV-файлов в формат приложения.
                            </p>
                        </div>
                    </div>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">📊 Экспорт в Excel</h3>
                    <p class="text-slate-600 dark:text-slate-400 mb-4">
                        Кнопка <strong>"Экспорт в Excel (CSV)"</strong> выгружает текущий список товаров в CSV формат, который можно открыть в Excel или Google Sheets.
                    </p>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">🌓 Тема оформления</h3>
                    <p class="text-slate-600 dark:text-slate-400 mb-2">
                        Кнопка 🌙/☀️ в шапке переключает между светлой и тёмной темами. Выбор сохраняется в браузере.
                    </p>
                    
                    <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 p-4 mt-6">
                        <p class="font-bold text-red-900 dark:text-red-300 mb-2">⚠️ Важно</p>
                        <p class="text-slate-700 dark:text-slate-400 text-sm">При импорте данных текущая база будет полностью заменена. Обязательно сделайте backup перед импортом!</p>
                    </div>
                </div>
            </div>
        `,
        
        tips: `
            <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6 transition-colors">
                <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-lightbulb text-blue-600"></i>
                    Полезные фишки
                </h2>
                
                <div class="prose dark:prose-invert max-w-none">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-5 rounded-lg border-l-4 border-blue-600">
                            <h4 class="font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                                <i class="fas fa-lock"></i>Автоматическое резервирование
                            </h4>
                            <p class="text-sm text-slate-700 dark:text-slate-400">
                                Товары в черновых спецификациях автоматически резервируются. Свободный остаток показывает, сколько товара доступно для новых проектов.
                            </p>
                        </div>
                        
                        <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-5 rounded-lg border-l-4 border-green-600">
                            <h4 class="font-bold text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
                                <i class="fas fa-times"></i>Множитель количества
                            </h4>
                            <p class="text-sm text-slate-700 dark:text-slate-400">
                                Создайте спецификацию на 1 изделие, а затем установите множитель. Все позиции автоматически умножатся.
                            </p>
                        </div>
                        
                        <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-5 rounded-lg border-l-4 border-purple-600">
                            <h4 class="font-bold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                                <i class="fas fa-palette"></i>Цветовая индикация
                            </h4>
                            <ul class="text-sm text-slate-700 dark:text-slate-400 space-y-1 mt-2">
                                <li>🔵 <strong>Синий</strong> — всё хорошо</li>
                                <li>🟠 <strong>Оранжевый</strong> — мало (< 5)</li>
                                <li>🔴 <strong>Красный</strong> — критично</li>
                            </ul>
                        </div>
                        
                        <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-5 rounded-lg border-l-4 border-yellow-600">
                            <h4 class="font-bold text-yellow-900 dark:text-yellow-300 mb-2 flex items-center gap-2">
                                <i class="fas fa-copy"></i>Копирование проекта
                            </h4>
                            <p class="text-sm text-slate-700 dark:text-slate-400">
                                В карточке проекта есть кнопка "Копия". Создаёт полный дубликат проекта со всеми спецификациями — удобно для повторяющихся заказов.
                            </p>
                        </div>
                        
                        <div class="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-5 rounded-lg border-l-4 border-red-600">
                            <h4 class="font-bold text-red-900 dark:text-red-300 mb-2 flex items-center gap-2">
                                <i class="fas fa-print"></i>Печать без цен
                            </h4>
                            <p class="text-sm text-slate-700 dark:text-slate-400">
                                При печати спецификации выберите "Печать для производства" — уберёт цены из документа для передачи в цех.
                            </p>
                        </div>
                        
                        <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-5 rounded-lg border-l-4 border-indigo-600">
                            <h4 class="font-bold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-2">
                                <i class="fas fa-search"></i>Умный поиск
                            </h4>
                            <p class="text-sm text-slate-700 dark:text-slate-400">
                                Поиск ищет как по названию, так и по производителю. Можно вводить часть слова — система найдёт совпадения.
                            </p>
                        </div>
                    </div>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">⚡ Быстрые операции</h3>
                    <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border dark:border-slate-600 mb-4">
                        <ul class="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                            <li><strong>🟢 Зелёная стрелка вниз</strong> — быстрый приход товара прямо из таблицы</li>
                            <li><strong>🔴 Красная стрелка вверх</strong> — быстрое списание товара</li>
                            <li><strong>Клик на товар</strong> — открытие полной карточки с историей</li>
                            <li><strong>Клик на проект</strong> — открытие карточки с редактированием</li>
                        </ul>
                    </div>
                    
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-3">💾 Синхронизация</h3>
                    <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border dark:border-slate-600 mb-4">
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            Кнопка синхронизации (круглая в правом нижнем углу) меняет цвет:
                        </p>
                        <ul class="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                            <li><strong class="text-red-600">🔴 Красная</strong> — есть несохранённые изменения, нажмите для сохранения в облако</li>
                            <li><strong class="text-blue-600">🔵 Синяя</strong> — всё синхронизировано</li>
                        </ul>
                    </div>
                    
                    <div class="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600 p-4">
                        <p class="font-bold text-green-900 dark:text-green-300 mb-2">✅ Лучшие практики</p>
                        <ul class="text-slate-700 dark:text-slate-400 text-sm space-y-1">
                            <li>• Делайте backup раз в неделю</li>
                            <li>• Проверяйте дашборд каждое утро</li>
                            <li>• Используйте категории для группировки товаров</li>
                            <li>• Добавляйте характеристики к товарам</li>
                            <li>• Прикрепляйте фото и документы</li>
                        </ul>
                    </div>
                </div>
            </div>
        `,
        
        faq: `
            <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6 transition-colors">
                <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-question text-blue-600"></i>
                    Часто задаваемые вопросы
                </h2>
                
                <div class="prose dark:prose-invert max-w-none">
                    <div class="space-y-4">
                        <div class="bg-slate-50 dark:bg-slate-700 p-5 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                <i class="fas fa-database text-blue-600"></i>
                                Где хранятся данные?
                            </h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400">
                                В <strong>демо-режиме</strong> данные хранятся в браузере (localStorage). При использовании <strong>Firebase</strong> — в облачной базе данных с автоматической синхронизацией.
                            </p>
                        </div>
                        
                        <div class="bg-slate-50 dark:bg-slate-700 p-5 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                <i class="fas fa-wifi text-blue-600"></i>
                                Можно работать без интернета?
                            </h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                Да! В <strong>демо-режиме</strong> интернет не нужен вообще. При использовании Firebase после первой загрузки данные кешируются локально, и можно работать оффлайн.
                            </p>
                            <p class="text-xs text-slate-500 dark:text-slate-500">
                                Примечание: для синхронизации изменений потребуется подключение к интернету.
                            </p>
                        </div>
                        
                        <div class="bg-slate-50 dark:bg-slate-700 p-5 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                <i class="fas fa-undo text-blue-600"></i>
                                Как восстановить удалённый товар?
                            </h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400">
                                Используйте резервную копию (Настройки → Загрузить базу). Поэтому важно регулярно делать backup!
                            </p>
                        </div>
                        
                        <div class="bg-slate-50 dark:bg-slate-700 p-5 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                <i class="fas fa-users text-blue-600"></i>
                                Можно работать с нескольких компьютеров?
                            </h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400">
                                Да, при использовании <strong>Firebase</strong>. Войдите с тем же аккаунтом на любом компьютере — данные синхронизируются через облако.
                            </p>
                        </div>
                        
                        <div class="bg-slate-50 dark:bg-slate-700 p-5 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                <i class="fas fa-tools text-blue-600"></i>
                                Что такое "нестандартное изделие"?
                            </h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400">
                                Это товар, которого нет на складе, но нужно добавить в спецификацию (например, услуга, работа или разовая закупка). У него свои цена и название, и он не списывается со склада.
                            </p>
                        </div>
                        
                        <div class="bg-slate-50 dark:bg-slate-700 p-5 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                <i class="fas fa-exclamation-triangle text-orange-600"></i>
                                Почему свободный остаток красный/отрицательный?
                            </h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                Это означает, что в спецификациях зарезервировано больше товара, чем есть на складе. Нужно либо:
                            </p>
                            <ul class="text-xs text-slate-500 dark:text-slate-500 space-y-1 ml-4">
                                <li>• Пополнить запас товара</li>
                                <li>• Уменьшить количество в спецификациях</li>
                                <li>• Удалить лишние резервы</li>
                            </ul>
                        </div>
                        
                        <div class="bg-slate-50 dark:bg-slate-700 p-5 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                <i class="fas fa-sync-alt text-blue-600"></i>
                                Не загружаются данные, что делать?
                            </h4>
                            <ol class="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                                <li>Проверьте интернет-соединение (для Firebase)</li>
                                <li>Очистите кеш браузера (Ctrl+Shift+Del)</li>
                                <li>Попробуйте демо-режим для тестирования</li>
                                <li>Проверьте консоль браузера (F12) на ошибки</li>
                            </ol>
                        </div>
                        
                        <div class="bg-slate-50 dark:bg-slate-700 p-5 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                <i class="fas fa-tachometer-alt text-blue-600"></i>
                                Приложение медленно работает
                            </h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">Попробуйте следующее:</p>
                            <ul class="text-xs text-slate-500 dark:text-slate-500 space-y-1 ml-4">
                                <li>• Используйте пагинацию (20-100 товаров)</li>
                                <li>• Закройте лишние вкладки браузера</li>
                                <li>• Обновите браузер до последней версии</li>
                                <li>• Очистите кеш браузера</li>
                            </ul>
                        </div>
                        
                        <div class="bg-slate-50 dark:bg-slate-700 p-5 rounded-lg border dark:border-slate-600">
                            <h4 class="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                <i class="fas fa-key text-blue-600"></i>
                                Забыл пароль от Firebase
                            </h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400">
                                Используйте демо-режим для доступа к локальным данным, или восстановите пароль через Firebase Authentication.
                            </p>
                        </div>
                        
                        <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-4 mt-6">
                            <p class="font-bold text-blue-900 dark:text-blue-300 mb-2">📞 Нужна помощь?</p>
                            <p class="text-slate-700 dark:text-slate-400 text-sm">
                                Если вы не нашли ответ на свой вопрос, обратитесь к полной документации в файлах README.md и TECHNICAL.md в корневой папке проекта.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `
    };
    
    return sections[sectionId] || sections.quickstart;
}

// Инициализация справки при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем раздел "Быстрый старт" по умолчанию
    if (document.getElementById('helpContent')) {
        showHelpSection('quickstart');
    }
});





