const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
const { GeminiToken } = require("../config.json");
const genAI = new GoogleGenerativeAI(GeminiToken);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

module.exports = {
  name: 'gemini',
  handler: async (ctx) => {
    const userInput = ctx.message.text.replace('/gemini', '').trim();
    const username = ctx.message.from.username || 'Anonymous';
    const chatId = ctx.chat.id;
    const historyPath = path.join(__dirname, `../history/${chatId}.md`);
    const now = new Date();
    const timestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

    // Если пользователь не ввёл текст, показываем сообщение с кнопками
    if (!userInput) {
      return ctx.reply(
        '*❗ Пожалуйста, введите текст после команды `/gemini` для обработки.*\n\n_Или выберите одно из следующих действий:_',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📜 Скачать историю', callback_data: `history_${chatId}` },
                { text: '🗑️ Удалить историю', callback_data: `delete_history_${chatId}` },
              ],
            ],
          },
        }
      );
    }

    try {
      // Запрос к модели Gemini
      const response = await model.generateContent(userInput);
      const generatedText = response.response.text() || '⚠️ Извините, произошла ошибка при обработке запроса.';

      // Формируем красивый ответ
      const message = `
*💬 Вопрос:* ${userInput}

*🤖 Ответ от Gemini:*
${generatedText}

🌟 _Спасибо за использование бота!_
      `;

      // Сохраняем историю
      const historyEntry = `
[===@${username}===]
${timestamp} - ${userInput}
[===Gemini===]
${timestamp} - ${generatedText}

`;
      if (!fs.existsSync(path.dirname(historyPath))) {
        fs.mkdirSync(path.dirname(historyPath), { recursive: true });
      }
      fs.appendFileSync(historyPath, historyEntry);

      ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📜 Скачать историю', callback_data: `history_${chatId}` },
              { text: '🗑️ Удалить историю', callback_data: `delete_history_${chatId}` },
            ],
          ],
        },
      });
    } catch (error) {
      console.error('Ошибка при запросе к модели Gemini:', error);
      ctx.reply('*⚠️ Произошла ошибка!*\n_😔 Не удалось обработать ваш запрос. Попробуйте снова позже._', {
        parse_mode: 'Markdown',
      });
    }
  },
};
