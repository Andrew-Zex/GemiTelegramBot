const fs = require("fs");
const path = require("path");

module.exports = {
  name: "history",
  handler: (ctx) => {
    const chatId = ctx.chat.id;
    const historyPath = path.join(__dirname, `../history/${chatId}.md`);

    if (fs.existsSync(historyPath)) {
      return ctx.replyWithDocument(
        {
          source: historyPath,
          filename: `history_${chatId}.md`,
        },
        {
          caption: "📂 Вот ваша история чата:",
        }
      );
    }

    return ctx.reply("⚠️ История чата не найдена.");
  },
};

// Обработка callback_query для кнопки
module.exports.callbackHandler = (bot) => {
  bot.on("callback_query", async (ctx) => {
    const callbackData = ctx.callbackQuery.data;

    if (callbackData === "download_history") {
      const chatId = ctx.chat.id;
      const historyPath = path.join(__dirname, `../history/${chatId}.md`);

      if (fs.existsSync(historyPath)) {
        await ctx.answerCbQuery(); // Убирает "часики" с кнопки
        return ctx.replyWithDocument(
          {
            source: historyPath,
            filename: `history_${chatId}.md`,
          },
          {
            caption: "📂 Вот ваша история чата:",
          }
        );
      }

      await ctx.answerCbQuery(); // Убирает "часики" с кнопки
      return ctx.reply("⚠️ История чата не найдена.");
    }
  });
};
