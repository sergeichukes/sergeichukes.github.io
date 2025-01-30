let logsData = [];
let sortDirection = 'desc';
let readFromEnd = true;
let fileContent = ''; // Сохраняем содержимое файла
let currentPosition = 0; // Текущая позиция в массиве строк
const BATCH_SIZE = 1000; // Количество записей на странице
let searchText = ''; // Добавляем переменную для хранения текста поиска

// Добавим функции для управления лоадером
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
    document.querySelector('.table-container').classList.add('loading');
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
    document.querySelector('.table-container').classList.remove('loading');
}

// Добавляем обработчик изменения направления чтения
document.getElementById('readFromEnd').addEventListener('change', function(e) {
    readFromEnd = e.target.checked;
});

// Добавляем обработчик для кнопки поиска
document.getElementById('searchButton').addEventListener('click', function() {
    searchText = document.getElementById('searchInput').value.toLowerCase();
    if (fileContent) {
        currentPosition = 0;
        logsData = [];
        processNextBatch();
    }
});

// Добавляем обработчик для поиска по Enter
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('searchButton').click();
    }
});

// Обновляем обработчик файла
document.getElementById('fileInput').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    showLoader();
    try {
        fileContent = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e);
            reader.readAsText(file);
        });

        // Сбрасываем текущую позицию и данные
        currentPosition = 0;
        logsData = [];
        
        // Загружаем первую порцию данных
        await processNextBatch();
        
        hideLoader();
    } catch (e) {
        console.error('Error processing file:', e);
        hideLoader();
        alert('Ошибка при обработке файла');
    }
});

// Добавляем обработчик для кнопки "Загрузить еще"
document.getElementById('loadMoreBtn').addEventListener('click', async function() {
    this.disabled = true;
    showLoader();
    await processNextBatch();
    hideLoader();
    this.disabled = false;
});

async function processNextBatch() {
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    const totalLines = lines.length;
    
    let linesToProcess;
    if (readFromEnd) {
        const startPos = Math.max(totalLines - currentPosition - BATCH_SIZE, 0);
        const endPos = totalLines - currentPosition;
        linesToProcess = lines.slice(startPos, endPos).reverse();
    } else {
        linesToProcess = lines.slice(currentPosition, currentPosition + BATCH_SIZE);
    }

    let processedLogs = 0;
    let filteredLogs = 0;
    const maxFilteredLogs = BATCH_SIZE;

    // Обрабатываем строки небольшими порциями для UI
    const UI_BATCH_SIZE = 50;
    outerLoop:
    for (let i = 0; i < linesToProcess.length; i += UI_BATCH_SIZE) {
        const batch = linesToProcess.slice(i, i + UI_BATCH_SIZE);
        
        await new Promise(resolve => setTimeout(resolve, 0));
        
        for (const line of batch) {
            processedLogs++;
            
            // Проверяем, содержит ли строка текст поиска
            if (searchText && !line.toLowerCase().includes(searchText)) {
                continue;
            }

            try {
                let logEntry = null;
                // Пробуем парсить как JSON
                if (line.trim().startsWith('{')) {
                    const jsonLog = JSON.parse(line);
                    logEntry = {
                        timestamp: jsonLog.ts ? new Date(jsonLog.ts) : null,
                        type: jsonLog.logger || 'JSON',
                        level: (jsonLog.level || '').trim().toLowerCase(),
                        thread: jsonLog.thread || '',
                        logger: jsonLog.logger || '',
                        application: jsonLog.application?.name || '',
                        version: jsonLog.application?.version || '',
                        id: jsonLog.id || '',
                        message: jsonLog.msg || jsonLog.message || '',
                        additionalInfo: formatAdditionalInfo(jsonLog),
                        raw: jsonLog
                    };
                }
                // Парсим GC логи
                else if (line.match(/^\[\d{4}-\d{2}-\d{2}T/)) {
                    const gcMatch = line.match(/^\[(.+?)\]\[(.+?)\]\s*(.*)/);
                    if (gcMatch) {
                        logEntry = {
                            timestamp: new Date(gcMatch[1]),
                            type: 'GC',
                            level: gcMatch[2].trim().toLowerCase(),
                            thread: '',
                            logger: '',
                            application: '',
                            version: '',
                            id: '',
                            message: gcMatch[3],
                            additionalInfo: '',
                            raw: line
                        };
                    }
                }
                // Все остальные строки
                else {
                    logEntry = {
                        timestamp: null,
                        type: 'OTHER',
                        level: '',
                        thread: '',
                        logger: '',
                        application: '',
                        version: '',
                        id: '',
                        message: line,
                        additionalInfo: '',
                        raw: line
                    };
                }

                if (logEntry) {
                    logsData.push(logEntry);
                    filteredLogs++;
                    if (filteredLogs >= maxFilteredLogs) {
                        break outerLoop;
                    }
                }
            } catch (e) {
                console.error('Error processing line:', e);
                console.error('Problematic line:', line);
                logsData.push({
                    timestamp: null,
                    type: 'ERROR',
                    level: 'error',
                    thread: '',
                    logger: '',
                    application: '',
                    version: '',
                    id: '',
                    message: `Error parsing log: ${e.message}\nOriginal line: ${line}`,
                    additionalInfo: '',
                    raw: line
                });
            }
        }
    }

    // Обновляем позицию с учетом обработанных строк
    currentPosition += processedLogs;

    // Проверяем оставшиеся строки на наличие совпадений с фильтром
    let hasMoreMatchingLogs = false;
    if (currentPosition < totalLines) {
        const remainingLines = lines.slice(currentPosition);
        for (const line of remainingLines) {
            if (!searchText || line.toLowerCase().includes(searchText)) {
                hasMoreMatchingLogs = true;
                break;
            }
        }
    }

    // Показываем/скрываем кнопку "Загрузить еще" в зависимости от наличия подходящих записей
    document.getElementById('loadMoreBtn').style.display = 
        hasMoreMatchingLogs ? 'block' : 'none';

    // Сортируем и отображаем данные
    logsData.sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return sortDirection === 'asc' 
            ? a.timestamp - b.timestamp 
            : b.timestamp - a.timestamp;
    });

    displayLogs();
}

function formatAdditionalInfo(jsonLog) {
    const excludeFields = [
        'ts', 'timestamp', 'msg', 'message', 'level', 
        'logger', 'thread', 'id', 'application'
    ];
    
    const additionalInfo = Object.entries(jsonLog)
        .filter(([key]) => !excludeFields.includes(key))
        .map(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
                return `${key}: ${JSON.stringify(value, null, 2)}`;
            }
            return `${key}: ${value}`;
        });

    return additionalInfo.join('\n');
}

function unescapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

function processMessage(message) {
    // Пробуем определить, является ли строка экранированной
    if (message.includes('&quot;') || 
        message.includes('&lt;') || 
        message.includes('&gt;') || 
        message.includes('&amp;') ||
        message.includes('&#039;')) {
        return unescapeHtml(message);
    }
    return message;
}

function displayLogs() {
    const tbody = document.getElementById('logTableBody');
    tbody.innerHTML = '';

    logsData.forEach(log => {
        const row = document.createElement('tr');
        if (log.level) {
            row.classList.add(`level-${log.level.trim().toLowerCase()}`);
        }
        
        const highlightText = (text) => {
            if (!searchText || !text) return escapeHtml(text);
            const escapedText = escapeHtml(text);
            const searchRegex = new RegExp(escapeHtml(searchText), 'gi');
            return escapedText.replace(searchRegex, match => `<span class="highlight">${match}</span>`);
        };

        const message = processMessage(log.message);
        const additionalInfo = log.additionalInfo;
        
        row.innerHTML = `
            <td>${formatTimestamp(log.timestamp)}</td>
            <td class="message">${highlightText(message)}</td>
            <td>${escapeHtml(log.level)}</td>
            <td>${highlightText(log.logger)}</td>
            <td>${highlightText(log.id)}</td>
            <td class="additional-info"><pre>${highlightText(additionalInfo)}</pre></td>
        `;
        
        tbody.appendChild(row);
    });
}

function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    return timestamp.toISOString();
}

// Добавляем функцию для безопасного отображения HTML
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Обработка сортировки
document.querySelector('th[data-sort="timestamp"]').addEventListener('click', function() {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    
    logsData.sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        
        return sortDirection === 'asc' 
            ? a.timestamp - b.timestamp 
            : b.timestamp - a.timestamp;
    });
    
    displayLogs();
}); 