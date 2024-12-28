const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const {token} = require("./config.json")
const db = require('./database'); // Импортируем базу данных

// Создаем экземпляр бота
const bot = new Telegraf(token);

// Путь к папке с командами
const commandsDir = path.join(__dirname, 'commands');

// Логирование старта бота
console.log('Запуск бота...');

// Читаем все файлы в папке commands и загружаем их как модули
fs.readdirSync(commandsDir).forEach(file => {
  try {
    const command = require(path.join(commandsDir, file));
    
    // Проверяем, является ли файл командой и регистрируем ее
    if (command.name && command.handler) {
      bot.command(command.name, command.handler);
      console.log(`Загружена команда: ${command.name}`);
    } else {
      console.log(`Пропущен файл ${file}: отсутствуют обязательные параметры (name или handler)`);
    }
  } catch (err) {
    console.error(`Ошибка при загрузке команды из файла ${file}: ${err.message}`);
  }
});


bot.on('callback_query', async (ctx) => {
    try {
      const data = ctx.callbackQuery.data;
  
      if (data.startsWith('history_')) {
        // Скачивание истории
        const chatId = data.split('_')[1];
        const historyPath = path.join(__dirname, `history/${chatId}.md`);
  
        if (fs.existsSync(historyPath)) {
          await ctx.replyWithDocument({ source: historyPath, filename: `history_${chatId}.md` });
        } else {
          await ctx.answerCbQuery('❌ История не найдена!', { show_alert: true });
        }
      } else if (data.startsWith('delete_history_')) {
        // Удаление истории
        const chatId = data.split('_')[2];
        const historyPath = path.join(__dirname, `history/${chatId}.md`);
  
        if (fs.existsSync(historyPath)) {
          fs.unlinkSync(historyPath);
          await ctx.answerCbQuery('✅ История успешно удалена!', { show_alert: true });
        } else {
          await ctx.answerCbQuery('❌ История не найдена для удаления!', { show_alert: true });
        }
      } else {
        await ctx.answerCbQuery('⚠️ Неподдерживаемая кнопка!');
      }
    } catch (error) {
      console.error('Ошибка при обработке callback_query:', error);
      ctx.answerCbQuery('❌ Произошла ошибка!', { show_alert: true });
    }
  });

  bot.start(async (ctx) => {
    const chatId = ctx.chat.id;
    const username = ctx.message.from.username || 'Anonymous';
  
    db.get('SELECT * FROM users WHERE chat_id = ?', [chatId], (err, row) => {
      if (err) {
        console.error('Ошибка при проверке пользователя в базе данных:', err.message);
        return;
      }
  
      if (!row) {
        // Если пользователь не найден в базе данных, добавляем его
        db.run('INSERT INTO users (chat_id, username) VALUES (?, ?)', [chatId, username], (err) => {
          if (err) {
            console.error('Ошибка при добавлении пользователя в базу данных:', err.message);
          } else {
            console.log(`Пользователь ${username} добавлен в базу данных.`);
          }
        });
      }
    });
  
    ctx.reply('Привет! Вы успешно активировали бота.');
  });
// Логирование успешного запуска
bot.launch().then(() => {
  console.log('Бот успешно запущен!');
}).catch(err => {
  console.error('Ошибка при запуске бота:', err);
});

// Обработка ошибок
bot.on('error', (err) => {
  console.error('Ошибка бота:', err);
});
