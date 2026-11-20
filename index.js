const { Telegraf } = require('telegraf');
const express = require('express');
const app = express();
app.get('/', (req,res)=>res.send('OK'));
app.listen(process.env.PORT || 10000, ()=>console.log('Port open'));

console.log('Starting bot, token exists:', !!process.env.TELEGRAM_TOKEN);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.start((ctx)=>{
  console.log('Got /start from', ctx.chat.id);
  ctx.reply(`✅ Connected! Your Chat ID is: ${ctx.chat.id}`);
});

bot.launch().then(()=>{
  console.log('TELEGRAM BOT ONLINE - polling started');
}).catch((err)=>{
  console.log('BOT LAUNCH FAILED FULL:', JSON.stringify(err, null, 2));
  console.log('ERROR CODE:', err.code);
  console.log('ERROR STACK:', err.stack);
});
