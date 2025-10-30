// server/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Роли
  const [adminRole, employeeRole] = await Promise.all([
    prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: { name: 'admin' },
    }),
    prisma.role.upsert({
      where: { name: 'employee' },
      update: {},
      create: { name: 'employee' },
    }),
  ]);

  // Отделы (пример)
  const [itDept, salesDept] = await Promise.all([
    prisma.department.upsert({
      where: { name: 'IT' },
      update: {},
      create: { name: 'IT' },
    }),
    prisma.department.upsert({
      where: { name: 'Sales' },
      update: {},
      create: { name: 'Sales' },
    }),
  ]);

  // Пароли → хэшируем
  const adminPass = await bcrypt.hash('Admin123!', 10);
  const userPass  = await bcrypt.hash('User123!', 10);

  // Пользователи
  await prisma.user.upsert({
    where: { email: 'admin@corp.local' },
    update: {},
    create: {
      email: 'admin@corp.local',
      fullName: 'System Admin',
      passwordHash: adminPass,
      roleId: adminRole.id,
      departmentId: itDept.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'user1@corp.local' },
    update: {},
    create: {
      email: 'user1@corp.local',
      fullName: 'First Employee',
      passwordHash: userPass,
      roleId: employeeRole.id,
      departmentId: salesDept.id,
    },
  });

  console.log('✅ Seed done: roles, departments, users created/updated.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });