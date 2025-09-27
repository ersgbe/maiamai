// Конфигурация
const SAFE_WALLET = 'TGGWh4Cm9HmvhBB9HkUoe6zD3Zrfx6psKb';

// Элементы сонсоль
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

