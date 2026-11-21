const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
console.log("Bot running...");

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Send: Team vs Team - Odds\nExample: Rans vs Persipura - 2.90 / 3.60 / 2.24");
});bot.on('message', (msg) => {
  if (!msg.text) return;
  let t = msg.text.trim();
  if (t.startsWith('/')) return;
  if (!t.toLowerCase().includes('vs')) return;
  let p = t.split('-');
  let teams = p[0].split(/vs/i);
  let home = teams[0].trim();
  let away = teams[1].trim();
  let o = p[1].split('/').map(x => parseFloat(x.trim()));
  let pick = "";
  if (o.length === 3) {
    if (o[2] < o[0]) pick = "AWAY WIN - " + away + " @ " + o[2];
    else if (o[0] < o[2]) pick = "HOME WIN - " + home + " @ " + o[0];
    else pick = "DRAW @ " + o[1];
  } else {
    pick = (o[0] < o[1] ? home : away) + " WIN @ " + Math.min(o[0], o[1]);
  }
  bot.sendMessage(msg.chat.id, "MANUAL PICK\n\n" + home + " vs " + away + "\nOdds: " + p[1].trim() + "\n\nPick: " + pick + "\n\nSend next game.");
});
const http = require('http');
http.createServer((req,res)=>{res.end('Bot is running');}).listen(process.env.PORT || 10000);
