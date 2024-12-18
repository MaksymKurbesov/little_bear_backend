import doteEnv from "dotenv";
doteEnv.config();

//import { onRun, schedule } from 'firebase-functions/v2/scheduler';
import functions from 'firebase-functions/v2/scheduler';
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { initializeApp } from 'firebase-admin/app';
import TelegramBot from "node-telegram-bot-api";
//import serviceAccount from './serviceAccount.json'
//const serviceAccount = require("./serviceAccount.json");
const webAppUrl = process.env.WEB_APP_URL
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const serviceAccount = JSON.parse(
  await readFile(new URL('./serviceAccount.json', import.meta.url))
);

const app = initializeApp({
        credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateLeaderboard() {
    const usersSnapshot = await db.collection('users')
                                  .orderBy('points', 'desc')
                                  .limit(10) // Ограничиваем результат первыми 10 пользователями
                                  .get();

    let leaderboard = [];

    usersSnapshot.forEach(doc => {
        leaderboard.push({
            username: doc.data().username,
            points: doc.data().points,
            // любые другие поля, которые вам могут понадобиться
        });
    });

    // Сохранение лидеров в отдельную коллекцию или документ
    await db.collection('leaderboard').doc('current').set({ leaderboard });
}

updateLeaderboard().catch(console.error);

export const scheduledLeaderboardUpdate = functions.onSchedule('every 12 hours', (async (context) => {
      await updateLeaderboard();
      console.log('Leaderboard updated successfully.');
}));


// Listen for any kind of message. There are different kinds of
// messages.
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // send a message to the chat acknowledging receipt of their message
  if (text === "/start") {
    bot
      .sendMessage(
        chatId,
        "<b>Hello! Welcome to The Little Bear 🐻\n\n</b>" +
          "You're now in the world of dancing bears that earn you crypto!\n" +
          "Tap the screen, collect coins, and boost your income with every dance.\n\n" +
          "Invite your friends, dance together, and earn even more coins!",
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Play in 1 click 🐻",
                  web_app: { url: `https://littlebear-app.online` },
                },
              ],
            ],
          },
          parse_mode: "HTML",
        },
      )
      .then(() => {
        console.log("sended");
      })
      .catch(() => {
        console.log("error");
      });
  }

  if (text === "/test_development") {
    bot
      .sendMessage(chatId, "Тест production", {
        reply_markup: {
                    inline_keyboard: [
            [
              {
                text: "Тест",
                web_app: { url: "https://ba9c-178-213-3-225.ngrok-free.app" },
              },
            ],
            [
              {
                text: "Test dev prod",
                web_app: { url: "https://littlebear-app.site" },
              },
            ],
          ],
        },
      })
      .then(() => {
        console.log("sended");
      })
      .catch((e) => {
        console.log(e, "error in test");
      });
  }
});

