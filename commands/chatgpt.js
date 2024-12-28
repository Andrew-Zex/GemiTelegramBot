const axios = require('axios');
const { OpenAIToken } = require("../config.json");

module.exports = {
  name: 'chatgpt',
  handler: async (ctx) => {
    const userInput = ctx.message.text.replace('/chatgpt', '').trim();

    // Если пользователь не ввёл текст, показываем сообщение
    if (!userInput) {
      return ctx.reply(
        '*❗ Пожалуйста, введите текст после команды `/chatgpt` для обработки.*',
        { parse_mode: 'Markdown' }
      );
    }

    let attemptCount = 0;  // Счётчик попыток

    const sendRequest = async () => {
      try {
        // Асинхронный запрос к ChatGPT через axios
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: userInput }],
          },
          {
            headers: {
              'Authorization': `Bearer ${OpenAIToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const generatedText = response.data.choices[0].message.content || '⚠️ Извините, произошла ошибка при обработке запроса.';

        const message = `
*💬 Вопрос:* ${userInput}

*🤖 Ответ от ChatGPT:*
${generatedText}

🌟 _Спасибо за использование бота!_
        `;

        ctx.reply(message, { parse_mode: 'Markdown' });

      } catch (error) {
        if (error.response && error.response.status === 429) {
          // Ошибка 429 - Превышен лимит запросов
          console.log('Превышен лимит запросов, пробуем снова...');
          attemptCount++; // Увеличиваем счётчик попыток

          if (attemptCount < 10) {
            // Задержка на 10 секунд перед повторной попыткой
            setTimeout(sendRequest, 10000); // Повторный запрос через 10 секунд
          } else {
            // Если попыток было 10, выводим сообщение об ошибке
            console.log('Достигнут лимит попыток, показываем ошибку');
            ctx.reply('*⚠️ Произошла ошибка!*\n_😔 Превышено количество попыток. Попробуйте снова позже._', {
              parse_mode: 'Markdown',
            });
          }
        } else {
          console.error('Ошибка при запросе к модели ChatGPT:', error);
          ctx.reply('*⚠️ Произошла ошибка!*\n_😔 Не удалось обработать ваш запрос. Попробуйте снова позже._', {
            parse_mode: 'Markdown',
          });
        }
      }
    };

    sendRequest();
  },
};
