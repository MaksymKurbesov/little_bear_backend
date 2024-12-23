import doteEnv from "dotenv";
import functions from "firebase-functions/v2/scheduler";
import admin from "firebase-admin";
import { readFile } from "fs/promises";
import { initializeApp } from "firebase-admin/app";
import TelegramBot from "node-telegram-bot-api";
import express from "express";
import cors from "cors";
import updateUserField from "./updateUserField.js";
import addSkinToUser from "./addSkinToUser.js";

doteEnv.config();

const webAppUrl = process.env.WEB_APP_URL;

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const serviceAccount = JSON.parse(
  await readFile(new URL("./serviceAccount.json", import.meta.url)),
);

const firebase = initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();

const expressApp = express();
const PORT = 3008;

expressApp.use(express.json());
expressApp.use(cors());

expressApp.post("/send_spin_invoice", (req, res) => {
  try {
    const { chatId, quantity } = req.body;
    const paymentToken = "";
    const payload = `spin_${quantity}`;
    const prices = [
      {
        label: "Donation",
        amount: 1 * quantity, // if you have a decimal price with . instead of ,
      },
    ];
    bot.sendInvoice(
      chatId,
      `${quantity} SPINS FOR WHEEL OF FORTUNE`,
      "Unlock your chance to spin the Wheel of Fortune! Purchase a spins and let luck decide your reward. 🎡✨",
      payload,
      paymentToken,
      "XTR",
      prices,
      {
        photo_url: "https://i.imgur.com/ujYHfXF.png",
      },
    ); // send invoice button to user

    res.send("Инвойс отправлен!");
  } catch (e) {
    console.log(e, "error");
  }
});

expressApp.post("/send_mickey_invoice", (req, res) => {
  try {
    const { chatId } = req.body;
    const paymentToken = "";
    const payload = "skin_mickey";
    const prices = [
      {
        label: "Donation",
        amount: 1, // if you have a decimal price with . instead of ,
      },
    ];
    bot.sendInvoice(
      chatId,
      `MAFIA BEAR`,
      "BUY MAFIA BEAR SKIN",
      payload,
      paymentToken,
      "XTR",
      prices,
      {
        photo_url: "https://i.imgur.com/VdZINOz.png",
      },
    ); // send invoice button to user

    res.send("Инвойс отправлен!");
  } catch (e) {
    console.log(e, "error");
  }
});

async function updateLeaderboard() {
  const usersSnapshot = await db
    .collection("users")
    .orderBy("points", "desc")
    .limit(10) // Ограничиваем результат первыми 10 пользователями
    .get();

  let leaderboard = [];

  usersSnapshot.forEach((doc) => {
    leaderboard.push({
      username: doc.data().username,
      points: doc.data().points,
      // любые другие поля, которые вам могут понадобиться
    });
  });

  // Сохранение лидеров в отдельную коллекцию или документ
  await db.collection("leaderboard").doc("current").set({ leaderboard });
}

updateLeaderboard().catch(console.error);

export const scheduledLeaderboardUpdate = functions.onSchedule(
  "every 12 hours",
  async (context) => {
    await updateLeaderboard();
    console.log("Leaderboard updated successfully.");
  },
);

// Listen for any kind of message. There are different kinds of
// messages.
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const strChatId = String(chatId);

  if (msg.successful_payment) {
    const invoicePayloadSplitted =
      msg.successful_payment.invoice_payload.split("_");
    const invoiceType = invoicePayloadSplitted[0];

    if (invoiceType === "spin") {
      const invoiceQuantity = parseInt(invoicePayloadSplitted[1]);

      await updateUserField(strChatId, invoiceQuantity);
    }

    if (invoiceType === "skin") {
      const invoiceSkin = invoicePayloadSplitted[1];

      await addSkinToUser(strChatId, invoiceSkin);
    }

    // Логика добавления товара пользователю
    bot.sendMessage(chatId, "Purchase successfully completed! 🎉");
  }

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

bot.on("pre_checkout_query", (msg) => {
  bot.answerPreCheckoutQuery(msg.id, true);
});

expressApp.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
