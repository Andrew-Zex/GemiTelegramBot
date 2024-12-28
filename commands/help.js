module.exports = {
  name: 'help',
  handler: async (ctx) => {
    const helpMessage = `
*📋 Доступные команды бота:*

1. **/help** - Получить список доступных команд.
2. **/botinfo** - Получить информацию о боте: его ресурсах, версиях и текущем состоянии.
3. **/history** - Скачать или удалить историю чатов Gemini.
4. **/gemini** - Получить ответ от модели Gemini, задав текст после команды.

_🌟 Все команды предназначены для упрощения общения с ботом и использования его возможностей._

❓ Если у вас есть вопросы, не стесняйтесь обращаться!
    `;

    ctx.reply(helpMessage, {
      parse_mode: 'Markdown', // Используем Markdown для форматирования
    });
  },
};