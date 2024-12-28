const db = require('../database'); // Импорт базы данных

module.exports = {
  name: 'premium',
  handler: async (ctx) => {
    const adminUsername = 'tcd3v'; // Здесь замените на имя пользователя администратора
    const isAdmin = ctx.message.from.username === adminUsername;

    if (!isAdmin) {
      return ctx.reply('*⚠️ Эта команда доступна только администратору.*', { parse_mode: 'Markdown' });
    }

    const userInput = ctx.message.text.replace('/premium', '').trim();

    if (!userInput || !userInput.startsWith('@')) {
      return ctx.reply('*❗ Пожалуйста, укажите username пользователя, которому нужно выдать премиум статус (например, @tcd3v).*', {
        parse_mode: 'Markdown',
      });
    }

    const username = userInput.substring(1); // Убираем '@' из начала

    // Проверяем, существует ли пользователь в базе данных
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        console.error('Ошибка при поиске пользователя в базе данных:', err.message);
        return ctx.reply('*⚠️ Произошла ошибка при работе с базой данных.*', { parse_mode: 'Markdown' });
      }

      if (!row) {
        return ctx.reply(`*⚠️ Пользователь с username @${username} не найден в базе данных.*`, { parse_mode: 'Markdown' });
      }

      // Обновляем статус пользователя на премиум
      db.run('UPDATE users SET is_premium = 1 WHERE username = ?', [username], (err) => {
        if (err) {
          console.error('Ошибка при обновлении премиум-статуса:', err.message);
          return ctx.reply('*⚠️ Произошла ошибка при выдаче премиума.*', { parse_mode: 'Markdown' });
        }

        // Подтверждение успешного обновления
        return ctx.reply(`*🎉 Премиум статус успешно выдан пользователю @${username}!*`, { parse_mode: 'Markdown' });
      });
    });
  },
};
