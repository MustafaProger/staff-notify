import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
	// ─── Роли ────────────────────────────────────────
	const [adminRole, employeeRole] = await Promise.all([
		prisma.role.upsert({
			where: { name: "admin" },
			update: {},
			create: { name: "admin" },
		}),
		prisma.role.upsert({
			where: { name: "employee" },
			update: {},
			create: { name: "employee" },
		}),
	]);

	// ─── Отделы ──────────────────────────────────────
	const [itDept, salesDept, hrDept, financeDept] = await Promise.all([
		prisma.department.upsert({
			where: { name: "IT" },
			update: {},
			create: { name: "IT" },
		}),
		prisma.department.upsert({
			where: { name: "Sales" },
			update: {},
			create: { name: "Sales" },
		}),
		prisma.department.upsert({
			where: { name: "HR" },
			update: {},
			create: { name: "HR" },
		}),
		prisma.department.upsert({
			where: { name: "Finance" },
			update: {},
			create: { name: "Finance" },
		}),
	]);

	// ─── Пароли ──────────────────────────────────────
	const adminPass = await bcrypt.hash("Admin123!", 10);
	const userPass = await bcrypt.hash("User123!", 10);

	// ─── Пользователи (15 шт.) ───────────────────────
	const users = [
		{
			email: "admin@corp.local",
			fullName: "System Admin",
			passwordHash: adminPass,
			roleId: adminRole.id,
			departmentId: itDept.id,
		},
		// IT
		{
			email: "alice.it@corp.local",
			fullName: "Alice Ivanova",
			passwordHash: userPass,
			roleId: employeeRole.id,
			departmentId: itDept.id,
		},
		{
			email: "bob.it@corp.local",
			fullName: "Bob Petrov",
			passwordHash: userPass,
			roleId: employeeRole.id,
			departmentId: itDept.id,
		},
		{
			email: "dmitry.it@corp.local",
			fullName: "Dmitry Loginov",
			passwordHash: userPass,
			roleId: employeeRole.id,
			departmentId: itDept.id,
		},
		// Sales
		{
			email: "kate.sales@corp.local",
			fullName: "Ekaterina Sales",
			passwordHash: userPass,
			roleId: employeeRole.id,
			departmentId: salesDept.id,
		},
		{
			email: "max.sales@corp.local",
			fullName: "Max Sidorov",
			passwordHash: userPass,
			roleId: employeeRole.id,
			departmentId: salesDept.id,
		},
		{
			email: "oleg.sales@corp.local",
			fullName: "Oleg Tarasov",
			passwordHash: userPass,
			roleId: employeeRole.id,
			departmentId: salesDept.id,
		},
		// HR
		{
			email: "olga.hr@corp.local",
			fullName: "Olga HR",
			passwordHash: userPass,
			roleId: employeeRole.id,
			departmentId: hrDept.id,
		},
		{
			email: "irina.hr@corp.local",
			fullName: "Irina Recruiter",
			passwordHash: userPass,
			roleId: employeeRole.id,
			departmentId: hrDept.id,
		},
		{
			email: "natalia.hr@corp.local",
			fullName: "Natalia Smirnova",
			passwordHash: userPass,
			roleId: employeeRole.id,
			departmentId: hrDept.id,
		},
		// Finance
		{
			email: "ivan.fin@corp.local",
			fullName: "Ivan Accountant",
			passwordHash: userPass,
			roleId: employeeRole.id,
			departmentId: financeDept.id,
		},
		{
			email: "pavel.fin@corp.local",
			fullName: "Pavel Kruglov",
			passwordHash: userPass,
			roleId: employeeRole.id,
			departmentId: financeDept.id,
		},
		{
			email: "sofia.fin@corp.local",
			fullName: "Sofia Belova",
			passwordHash: userPass,
			roleId: employeeRole.id,
			departmentId: financeDept.id,
		},
		// Смешанные
		{
			email: "maria.it@corp.local",
			fullName: "Maria DevOps",
			passwordHash: userPass,
			roleId: employeeRole.id,
			departmentId: itDept.id,
		},
		{
			email: "timur.sales@corp.local",
			fullName: "Timur Orlov",
			passwordHash: userPass,
			roleId: employeeRole.id,
			departmentId: salesDept.id,
		},
	];

	for (const u of users) {
		await prisma.user.upsert({
			where: { email: u.email },
			update: {},
			create: u,
		});
	}

	console.log("✅ Users created.");

	// ─── Ссылочные пользователи для таргетинга ─────────────────────────
	const admin = await prisma.user.findUniqueOrThrow({
		where: { email: "admin@corp.local" },
	});

	const [alice, bob, mariaIt, ivanFin, olgaHr] = await Promise.all([
		prisma.user.findUniqueOrThrow({ where: { email: "alice.it@corp.local" } }),
		prisma.user.findUniqueOrThrow({ where: { email: "bob.it@corp.local" } }),
		prisma.user.findUniqueOrThrow({ where: { email: "maria.it@corp.local" } }),
		prisma.user.findUniqueOrThrow({ where: { email: "ivan.fin@corp.local" } }),
		prisma.user.findUniqueOrThrow({ where: { email: "olga.hr@corp.local" } }),
	]);

	// ─── Объявления (20 шт.) ─────────────────────────
	const announcements = [
		// Общие
		{
			title: "Добро пожаловать в систему уведомлений",
			body: "Это тестовое объявление для всех сотрудников.",
			targets: [{ roleId: employeeRole.id }],
		},
		{
			title: "Общее собрание компании",
			body: "Пятница, 11:00, общий зал. Повестка: итоги квартала.",
			targets: [{ roleId: employeeRole.id }],
		},

		// IT
		{
			title: "IT: Обновление VPN",
			body: "Сегодня в 22:00 обновление VPN. Возможны перерывы.",
			targets: [{ departmentId: itDept.id }],
		},
		{
			title: "IT: Перенос GitLab",
			body: "В субботу миграция GitLab. Окно 20:00–23:00.",
			targets: [{ departmentId: itDept.id }],
		},
		{
			title: "IT: Семинар по безопасности",
			body: "В четверг митап по кибербезопасности.",
			targets: [{ departmentId: itDept.id }],
		},

		// Sales
		{
			title: "Sales: Новый прайс-лист",
			body: "Загружен новый прайс-лист. Проверьте в CRM.",
			targets: [{ departmentId: salesDept.id }],
		},
		{
			title: "Sales: План продаж",
			body: "Обновлён план на ноябрь. Ознакомьтесь.",
			targets: [{ departmentId: salesDept.id }],
		},
		{
			title: "Sales: Бонусная программа",
			body: "В декабре стартует новая бонусная программа.",
			targets: [{ departmentId: salesDept.id }],
		},

		// HR
		{
			title: "HR: Изменение графика отпусков",
			body: "Проверьте новые даты отпусков.",
			targets: [{ departmentId: hrDept.id }],
		},
		{
			title: "HR: Курсы по стресс-менеджменту",
			body: "Запись открыта до конца недели.",
			targets: [{ departmentId: hrDept.id }],
		},

		// Finance
		{
			title: "Finance: Новый шаблон отчёта",
			body: "Используем обновлённый шаблон с 1 числа.",
			targets: [{ departmentId: financeDept.id }],
		},
		{
			title: "Finance: Проверка платежей",
			body: "Пожалуйста, подтвердите все транзакции за октябрь.",
			targets: [{ departmentId: financeDept.id }],
		},

		// Кросс-отдел
		{
			title: "Finance + HR: Отчётность по отпускам",
			body: "Финансы и HR готовят сводную таблицу.",
			targets: [{ departmentId: financeDept.id }, { departmentId: hrDept.id }],
		},
		{
			title: "IT + Sales: Совместный митап",
			body: "Встреча по обновлению CRM-интеграции.",
			targets: [{ departmentId: itDept.id }, { departmentId: salesDept.id }],
		},

		// Персональные
		{
			title: "Индивидуально: доступ к BI",
			body: "Ivan Accountant, вам открыт доступ к BI.",
			targets: [{ userId: ivanFin.id }],
		},
		{
			title: "Индивидуально: проверка данных",
			body: "Olga HR, проверьте корректность профилей.",
			targets: [{ userId: olgaHr.id }],
		},
		{
			title: "Индивидуально: тестирование приложения",
			body: "Alice, Bob, Maria — проверьте новый билд.",
			targets: [
				{ userId: alice.id },
				{ userId: bob.id },
				{ userId: mariaIt.id },
			],
		},

		// Общие доп.
		{
			title: "Проверка уведомлений",
			body: "Это тестовое системное сообщение.",
			targets: [{ roleId: employeeRole.id }],
		},
		{
			title: "Напоминание об опросе",
			body: "Пожалуйста, заполните анкету по корпоративной культуре.",
			targets: [{ roleId: employeeRole.id }],
		},
		{
			title: "Мероприятие выходного дня",
			body: "В субботу состоится корпоративный пикник!",
			targets: [{ roleId: employeeRole.id }],
		},
	];

	for (const a of announcements) {
		const ann = await prisma.announcement.create({
			data: { title: a.title, body: a.body, authorId: admin.id },
		});
		await prisma.announcementTarget.createMany({
			data: a.targets.map((t) => ({ announcementId: ann.id, ...t })),
		});
	}

	console.log(
		"✅ Seed done: roles, departments, 15 users, 20 announcements created."
	);
}

main()
	.catch((e) => {
		console.error("Seed error:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
