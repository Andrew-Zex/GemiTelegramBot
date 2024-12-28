const os = require('os');
const fs = require('fs');
const path = require('path');
const { bot_version, codename } = require('../config.json');
const { version } = require('../node_modules/telegraf/package.json'); // Для получения версии telegraf
const db = require('../database'); // Импортируем базу данных
const commandsFolder = path.join(__dirname); // Папка с командами

module.exports = {
  name: 'botinfo',
  handler: async (ctx) => {
    const chatId = ctx.chat.id;
    const username = ctx.message.from.username;

    // Проверка премиум-статуса
    db.get('SELECT * FROM users WHERE chat_id = ?', [chatId], (err, row) => {
      if (err) {
        console.error('Ошибка при проверке статуса пользователя:', err.message);
        return ctx.reply('*⚠️ Произошла ошибка при проверке статуса.*', { parse_mode: 'Markdown' });
      }

      const isPremium = row && row.is_premium ? '✅ Да' : '❌ Нет'; // Проверяем премиум-статус

      // Информация о памяти
      const totalMemory = (os.totalmem() / 1024 / 1024).toFixed(2); // В МБ
      const freeMemory = (os.freemem() / 1024 / 1024).toFixed(2); // В МБ
      const usedMemory = (totalMemory - freeMemory).toFixed(2);

      // Информация о процессоре
      const cpus = os.cpus();
      const cpuModel = cpus[0].model;
      const cpuCores = cpus.length;

      // Подсчет использования CPU
      const getCpuLoad = () => {
        const cpuInfo = os.cpus();

        // Получаем общее и активное время для всех ядер
        const cpuTimes = cpuInfo.reduce(
          (acc, cpu) => {
            acc.total += Object.values(cpu.times).reduce((a, b) => a + b, 0);
            acc.idle += cpu.times.idle;
            return acc;
          },
          { total: 0, idle: 0 }
        );

        return { total: cpuTimes.total, idle: cpuTimes.idle };
      };

      const startCpuLoad = getCpuLoad();
      setTimeout(() => {
        const endCpuLoad = getCpuLoad();

        const totalDiff = endCpuLoad.total - startCpuLoad.total;
        const idleDiff = endCpuLoad.idle - startCpuLoad.idle;
        const cpuUsage = ((1 - idleDiff / totalDiff) * 100).toFixed(2); // Вычисляем нагрузку

        // Количество команд
        const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));
        const commandCount = commandFiles.length;

        // Количество пользователей
        const usersPath = path.join(__dirname, '../users.json'); // Если у вас есть файл с пользователями
        let userCount = 0;
        if (fs.existsSync(usersPath)) {
          const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
          userCount = Object.keys(users).length;
        }

        // Версии
        const nodeVersion = process.version;

        // Формируем ответ
        const message = `
*📊 Информация о боте:*

*🖥 ОЗУ:*
  - Занято: ${usedMemory} МБ
  - Свободно: ${freeMemory} МБ
  - Всего: ${totalMemory} МБ

*⚙️ ЦП:*
  - Модель: ${cpuModel}
  - Количество ядер: ${cpuCores}
  - Нагрузка: ${cpuUsage}%

*👥 Пользователи:*
  - Количество: ${userCount}

*⚡ Команды:*
  - Всего: ${commandCount}

*📦 Версии:*
  - Node.js: ${nodeVersion}
  - Telegraf: ${version}
  - Бот: ${bot_version} (${codename})

*🎖 Премиум статус: ${isPremium}*
        `;

        // Отправляем сообщение
        ctx.reply(message, {
          parse_mode: 'Markdown',
        });
      }, 1000); // Ждем 1 секунду, чтобы собрать нагрузку CPU
    });
  },
};
