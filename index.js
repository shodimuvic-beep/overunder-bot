const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const PORT = process.env.PORT || 10000;

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const API_KEY = process.env.API_BASKETBALL_KEY;

console.log("Starting bot, token exists:", !!TOKEN, "chat exists:", !!CHAT_ID, "api key exists:", !!API_KEY);

const bot = new TelegramBot(TOKEN, { polling: true });

http.createServer((req, res) => { res.end('Bot is running'); }).listen(PORT, () => console.log(`Port open on ${PORT}`));

// /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `✅ Connected! Your Chat ID is: ${msg.chat.id}`);
});

// /test
bot.onText(/\/test/, (msg) => {
  bot.sendMessage(msg.chat.id, `✅ TEST ALERT\n\n⚽ OVER 2.5 - Man City vs Arsenal\n📊 Chance: 78%\n💡 Test is working!`);
});

// /analyze Lakers vs Celtics 80 60 70 50 60 70
// numbers = diff, last5Home, H2H, last5Away, paceHome, paceAway
bot.onText(/\/analyze (.+)/, (msg, match) => {
  try {
    const text = match[1].trim();
    const nums = text.match(/\d+/g)?.map(Number) || [];
    if (nums.length < 6) {
      return bot.sendMessage(msg.chat.id, `Use like this:\n/analyze Lakers vs Celtics 80 60 70 50 60 70\n\nOrder: Difficulty, Last5Home, H2H, Last5Away, PaceHome, PaceAway`);
    }
    const [diff, last5H, h2h, last5A, paceH, paceA] = nums;

    const teamPart = text.split(/\d/)[0].trim() || "Match";

    const avgTotal = (last5H + last5A + h2h) / 3;
    const paceAvg = (paceH + paceA) / 2;

    let score = 50;
    score += (diff - 50) * 0.6;
    score += (avgTotal - 155) * 0.4;
    score += (paceAvg - 100) * 0.2;
    score = Math.min(92, Math.max(25, Math.round(score)));

    const line = avgTotal >= 156 ? "OVER 155.5" : "UNDER 155.5";
    const verdict = score >= 68 ? "✅ PLAY - Strong Edge" : score >= 58 ? "⚠️ SMALL PLAY" : "❌ SKIP - Low Edge";

    const out = `🏀 V2 ANALYSIS\n\n${teamPart}\n\n${line}\nChance: ${score}%\nDifficulty: ${diff}%\nLast5 Home: ${last5H}\nH2H Avg: ${h2h}\nLast5 Away: ${last5A}\nPace Avg: ${paceAvg}\nAvg Total: ${avgTotal.toFixed(1)}\n\n${verdict}\n\nAPI Key Active: ${API_KEY ? "Yes ✅" : "No ❌"}`;

    bot.sendMessage(msg.chat.id, out);
  } catch (e) {
    bot.sendMessage(msg.chat.id, "Error: " + e.message);
  }
});
