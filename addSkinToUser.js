import { db } from "./index.js";
import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export default async function addSkinToUser(userId, skin) {
  try {
    // Ссылка на документ пользователя
    const userRef = db.collection("users").doc(userId);

    // Обновление поля
    await userRef.update({
      ["skins"]: FieldValue.arrayUnion(skin),
    });

    console.log(`Скин ${skin} добавлен для пользователя с ID: ${userId}`);
  } catch (error) {
    console.error(`Ошибка обновления поля: ${error.message}`);
  }
}
