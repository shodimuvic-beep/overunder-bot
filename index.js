const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.log("Missing TELEGRAM_BOT_TOKEN");
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });
console.log("Bot is running...");

// ---------- HELPERS ----------
function analyzeFootball(home, away, h, d, a) {
  let pick = "", reason = "", confidence = "Medium";
  if (a < h && a < d) {
    pick = `AWAY WIN - ${away} @ ${a}`;
    reason = `${away} is favourite. Away odds lowest.`;
    confidence = a < 1.8 ? "High" : "Medium";
  } else if (h < a && h < d) {
    pick = `HOME WIN - ${home} @ ${h}`;
    reason = `${home} is favourite. Home odds lowest.`;
    confidence = h < 1.8 ? "High" : "Medium";
  } else {
    pick = `DRAW @ ${d} - Value pick`;
    reason = `Odds are very close, bookies expect a tight game.`;
    confidence = "Low";
  }

  // Safety tip for close odds
  let safety = "";
  if (Math.abs(h - a) < 0.8) {
    safety = `\n🛡️ Safety: Odds are close, consider Double Chance 1X or X2 instead of straight win.`;
  }

  return `⚽ ${home} vs ${away}\nOdds: ${h} / ${d} / ${a}\n\n🎯 Pick: ${pick}\n📊 Confidence: ${confidence}\n💡 Why: ${reason}${safety}\n⚠️ Avoid: Going all-in on 1X2 when odds are close.`;
}

function analyze2Way(home, away, h, a, emoji) {
  let fav = h < a ? home : away;
  let favOdd = Math.min(h, a);
  return `${emoji} ${home} vs ${away}\nOdds: ${h} / ${a}\n\n🎯 Pick: ${fav} WIN @ ${favOdd}\n📊 Confidence: ${favOdd < 1.70 ? "High" : "Medium"}\n💡 Why: ${fav} is favourite with lower odds.\n🛡️ Safety: If odds are 1.90 / 1.90,
