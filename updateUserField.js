import { db } from "./index.js";
import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export default async function addSpinsToUser(userId, value) {
  try {
    // Ссылка на документ пользователя
    const userRef = db.collection("users").doc(userId);

    // Обновление поля
    await userRef.update({
      ["spins"]: FieldValue.increment(parseInt(value)),
    });

    console.log(
      `Поле 'spins' успешно обновлено для пользователя с ID: ${userId}`,
    );
  } catch (error) {
    console.error(`Ошибка обновления поля: ${error.message}`);
  }
}
