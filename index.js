const express = require('express');
const { Telegraf } = require('telegraf');
const app = express();
const PORT = process.env.PORT || 10000;

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

console.log('Starting bot, token exists:', !!TOKEN, 'chat exists:', !!CHAT_ID);

const bot = new Telegraf(TOKEN);

bot.start((ctx) => {
  ctx.reply(`✅ Connected! Your Chat ID is: ${ctx.chat.id}`);
});

bot.command('test', (ctx) => {
  ctx.reply('✅ TEST ALERT\n\n⚽ OVER 2.5 - Man City vs Arsenal\n📊 Chance: 78%\n💡 Test is working!');
});

// Send test alert when bot starts
async function sendStartupAlert() {
  try {
    await bot.telegram.sendMessage(CHAT_ID, `🚀 Bot Restarted!\n\n✅ Your Over/Under Alerts are now LIVE.\n\nSend /test to check alerts.`);
    console.log('TELEGRAM BOT ONLINE - polling started');
  } catch (e) {
    console.log('BOT LAUNCH FAILED FULL:', e.message);
  }
}

app.get('/', (req, res) => res.send('Bot is running'));
app.listen(PORT, () => console.log('Port open on', PORT));

bot.launch().then(() => {
  sendStartupAlert();
});
