import bcrypt from "bcryptjs";

async function run() {
  const password = "Admin123!";

  // Пользователь A
  const saltA = await bcrypt.genSalt(10);
  const hashA = await bcrypt.hash(password, saltA);

  // Пользователь B (тот же пароль, соль будет другая)
  const saltB = await bcrypt.genSalt(10);
  const hashB = await bcrypt.hash(password, saltB);

  console.log("Пароль:", password);
  console.log("\n--- Пользователь A ---");
  console.log("Соль A:", saltA);
  console.log("Хэш A:", hashA);

  console.log("\n--- Пользователь B ---");
  console.log("Соль B:", saltB);
  console.log("Хэш B:", hashB);

  // Проверка при «логине»
  const okA = await bcrypt.compare(password, hashA);
  const okB = await bcrypt.compare(password, hashB);

  console.log("\nПроверка сравнения:");
  console.log("compare(password, hashA) ->", okA); // true
  console.log("compare(password, hashB) ->", okB); // true

  // Показать, что соль «вшита» в хэш (первые ~29 символов)
  console.log("\nИзвлечённая соль из hashA:", hashA.slice(0, 29));
  console.log("Извлечённая соль из hashB:", hashB.slice(0, 29));
}

run().catch(console.error);