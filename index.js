const { Telegraf } = require('telegraf');

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TOKEN) {
  console.log('Missing TELEGRAM_TOKEN');
  process.exit(1);
}

const bot = new Telegraf(TOKEN);

let targetChatId = CHAT_ID || null;

bot.start((ctx) => {
  targetChatId = ctx.chat.id.toString();
  console.log('New chat ID:', targetChatId);
  ctx.reply(`✅ OverUnder Bot connected!\n\nYour Chat ID is:\n${targetChatId}\n\nCopy this and put it in Render as TELEGRAM_CHAT_ID, then redeploy.`);
});

bot.command('test', async (ctx) => {
  await ctx.reply('✅ Test OK - Bot is working!\nOver/Under alerts will come here.');
});

bot.command('status', async (ctx) => {
  await ctx.reply('🟢 Bot is online and watching for Over/Under signals.');
});

// Send alert function - your Over/Under logic goes here
async function sendAlert(message) {
  if (!targetChatId) {
    console.log('No CHAT_ID yet - user must send /start first');
    return;
  }
  try {
    await bot.telegram.sendMessage(targetChatId, message);
    console.log('Alert sent:', message);
  } catch (e) {
    console.log('Send failed:', e.message);
  }
}

// Example: Test alert every 60 seconds until you add real logic
// Remove this later
setInterval(() => {
  console.log('Bot alive - waiting for signals...');
}, 60000);

bot.launch();
console.log('TELEGRAM BOT ONLINE');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
