const { Telegraf } = require('telegraf');
const express = require('express');

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

console.log('Starting bot, token exists:', !!TOKEN);

const bot = new Telegraf(TOKEN);

// Log EVERY message - so we can see in Render if Telegram reaches us
bot.on('message', (ctx) => {
  console.log('Got message:', ctx.message.text, 'from chat:', ctx.chat.id);
});

bot.start((ctx) => {
  console.log('START command from:', ctx.chat.id);
  return ctx.reply(`✅ OverUnder Bot connected!\n\nYour Chat ID is:\n${ctx.chat.id}\n\nCopy this and put it in Render as TELEGRAM_CHAT_ID`);
});

bot.command('test', (ctx) => {
  return ctx.reply('✅ Test OK - Bot is working!');
});

bot.launch({ dropPendingUpdates: true }).then(() => {
  console.log('TELEGRAM BOT ONLINE - polling started');
}).catch(e => console.log('Launch failed:', e.message));

// Keep Render port open
const app = express();
app.get('/', (req, res) => res.send('Bot is online'));
app.listen(process.env.PORT || 10000, () => console.log('Port open'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
