import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	TextInput,
	Button,
	Alert,
	ScrollView,
	ActivityIndicator,
	TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import {
	CreateAnnouncementPayload,
	Department,
	Role,
	createAnnouncement,
	getDepartments,
	getRoles,
} from "../../lib/api";

export default function CreateAnnouncementScreen() {
	const router = useRouter();
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [roles, setRoles] = useState<Role[]>([]);
	const [departments, setDepartments] = useState<Department[]>([]);
	const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
	const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
	const [userIdsRaw, setUserIdsRaw] = useState("");
	const [loadingMeta, setLoadingMeta] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		let active = true;
		const load = async () => {
			setLoadingMeta(true);
			try {
				const [rolesResp, depsResp] = await Promise.all([
					getRoles(),
					getDepartments(),
				]);
				if (!active) return;
				setRoles(rolesResp.items);
				setDepartments(depsResp.items);
			} catch (err: any) {
				Alert.alert(
					"Ошибка",
					err?.response?.data?.message ?? "Не удалось загрузить справочники"
				);
			} finally {
				if (active) setLoadingMeta(false);
			}
		};
		load();
		return () => {
			active = false;
		};
	}, []);

	const toggleRole = (id: number) => {
		setSelectedRoles((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		);
	};

	const toggleDepartment = (id: number) => {
		setSelectedDepartments((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		);
	};

	const onSubmit = async () => {
		if (!title.trim()) {
			Alert.alert("Ошибка", "Введите заголовок");
			return;
		}
		if (!body.trim()) {
			Alert.alert("Ошибка", "Введите текст объявления");
			return;
		}

		let usersFromInput: number[] = [];
		if (userIdsRaw.trim()) {
			const parts = userIdsRaw
				.split(",")
				.map((p) => p.trim())
				.filter(Boolean);
			const invalid = parts.find(
				(p) => Number.isNaN(Number(p)) || Number(p) <= 0
			);
			if (invalid) {
				Alert.alert("Ошибка", `Некорректный userId: ${invalid}`);
				return;
			}
			usersFromInput = parts.map((p) => Number(p));
		}

		const payload: CreateAnnouncementPayload = {
			title: title.trim(),
			body: body.trim(),
		};

		const targets: CreateAnnouncementPayload["targets"] = {};
		if (selectedRoles.length) targets.roles = selectedRoles;
		if (selectedDepartments.length) targets.departments = selectedDepartments;
		if (usersFromInput.length) targets.users = usersFromInput;
		if (
			targets.roles?.length ||
			targets.departments?.length ||
			targets.users?.length
		) {
			payload.targets = targets;
		}

		try {
			setSubmitting(true);
			await createAnnouncement(payload);
			Alert.alert("Готово", "Объявление опубликовано", [
				{
					text: "Ок",
					onPress: () => router.replace("/feed"),
				},
			]);
		} catch (err: any) {
			Alert.alert(
				"Ошибка",
				err?.response?.data?.message ?? "Не удалось создать объявление"
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<ScrollView
			contentContainerStyle={{
				padding: 20,
				gap: 24,
				backgroundColor: "#f8fafc",
			}}
			keyboardShouldPersistTaps="handled"
		>
			{/* Заголовок */}
			<View
				style={{
					backgroundColor: "#ffffff",
					borderRadius: 16,
					padding: 20,
					borderWidth: 1,
					borderColor: "#e2e8f0",
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 1 },
					shadowOpacity: 0.05,
					shadowRadius: 3,
				}}
			>
				<Text style={{ fontSize: 24, fontWeight: "700", color: "#1e293b" }}>
					Новое объявление
				</Text>
				<Text style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
					Заполните форму ниже
				</Text>
			</View>

			{/* Основная форма */}
			<View
				style={{
					backgroundColor: "#ffffff",
					borderRadius: 16,
					padding: 20,
					borderWidth: 1,
					borderColor: "#e2e8f0",
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 1 },
					shadowOpacity: 0.05,
					shadowRadius: 3,
				}}
			>
				<View style={{ gap: 16 }}>
					<View style={{ gap: 8 }}>
						<Text style={{ fontSize: 14, fontWeight: "600", color: "#475569" }}>
							Заголовок
						</Text>
						<TextInput
							value={title}
							onChangeText={setTitle}
							placeholder="Например: Срочное собрание"
							style={{
								borderWidth: 1.5,
								borderColor: "#e2e8f0",
								borderRadius: 10,
								padding: 14,
								fontSize: 16,
								backgroundColor: "#f8fafc",
							}}
						/>
					</View>

					<View style={{ gap: 8 }}>
						<Text style={{ fontSize: 14, fontWeight: "600", color: "#475569" }}>
							Текст
						</Text>
						<TextInput
							value={body}
							onChangeText={setBody}
							placeholder="Введите текст объявления"
							multiline
							numberOfLines={6}
							style={{
								borderWidth: 1.5,
								borderColor: "#e2e8f0",
								borderRadius: 10,
								padding: 14,
								textAlignVertical: "top",
								fontSize: 16,
								backgroundColor: "#f8fafc",
								minHeight: 120,
							}}
						/>
					</View>
				</View>
			</View>

			{/* Получатели */}
			<View
				style={{
					backgroundColor: "#ffffff",
					borderRadius: 16,
					padding: 20,
					borderWidth: 1,
					borderColor: "#e2e8f0",
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 1 },
					shadowOpacity: 0.05,
					shadowRadius: 3,
				}}
			>
				<Text
					style={{
						fontSize: 16,
						fontWeight: "600",
						color: "#1e293b",
						marginBottom: 16,
					}}
				>
					Кому отправить (необязательно)
				</Text>

				{loadingMeta ? (
					<View style={{ paddingVertical: 20 }}>
						<ActivityIndicator size="small" color="#6366f1" />
					</View>
				) : (
					<View style={{ gap: 20 }}>
						<View>
							<Text style={{ marginBottom: 12, fontWeight: "600", color: "#64748b" }}>
								Роли
							</Text>
							{roles.length ? (
								<View style={{ gap: 8 }}>
									{roles.map((role) => {
										const selected = selectedRoles.includes(role.id);
										return (
											<TouchableOpacity
												key={role.id}
												style={{
													padding: 14,
													borderRadius: 10,
													borderWidth: 1.5,
													borderColor: selected ? "#6366f1" : "#e2e8f0",
													backgroundColor: selected ? "#eef2ff" : "#f8fafc",
												}}
												onPress={() => toggleRole(role.id)}
											>
												<Text
													style={{
														fontWeight: "600",
														color: selected ? "#6366f1" : "#1e293b",
													}}
												>
													{role.name}
												</Text>
												<Text style={{ opacity: 0.6, fontSize: 12 }}>
													#{role.id}
												</Text>
											</TouchableOpacity>
										);
									})}
								</View>
							) : (
								<Text style={{ opacity: 0.6 }}>Роли не найдены</Text>
							)}
						</View>

						<View>
							<Text style={{ marginBottom: 12, fontWeight: "600", color: "#64748b" }}>
								Отделы
							</Text>
							{departments.length ? (
								<View style={{ gap: 8 }}>
									{departments.map((dep) => {
										const selected = selectedDepartments.includes(dep.id);
										return (
											<TouchableOpacity
												key={dep.id}
												style={{
													padding: 14,
													borderRadius: 10,
													borderWidth: 1.5,
													borderColor: selected ? "#6366f1" : "#e2e8f0",
													backgroundColor: selected ? "#eef2ff" : "#f8fafc",
												}}
												onPress={() => toggleDepartment(dep.id)}
											>
												<Text
													style={{
														fontWeight: "600",
														color: selected ? "#6366f1" : "#1e293b",
													}}
												>
													{dep.name}
												</Text>
												<Text style={{ opacity: 0.6, fontSize: 12 }}>
													#{dep.id}
												</Text>
											</TouchableOpacity>
										);
									})}
								</View>
							) : (
								<Text style={{ opacity: 0.6 }}>Отделы не найдены</Text>
							)}
						</View>
					</View>
				)}

				<View style={{ gap: 8, marginTop: 20 }}>
					<Text style={{ fontWeight: "600", color: "#475569" }}>
						Конкретные пользователи (ID через запятую)
					</Text>
					<TextInput
						value={userIdsRaw}
						onChangeText={setUserIdsRaw}
						placeholder="Например: 1, 7, 42"
						autoCapitalize="none"
						style={{
							borderWidth: 1.5,
							borderColor: "#e2e8f0",
							borderRadius: 10,
							padding: 14,
							fontSize: 16,
							backgroundColor: "#f8fafc",
						}}
					/>
					<Text style={{ opacity: 0.6, fontSize: 12, color: "#64748b" }}>
						Если оставить поля пустыми, объявление получат все, кто подходит по целевой
						аудитории (или все сотрудники при отсутствии фильтров).
					</Text>
				</View>
			</View>

			{/* Кнопка публикации */}
			<TouchableOpacity
				onPress={onSubmit}
				disabled={submitting || loadingMeta}
				style={{
					backgroundColor: submitting || loadingMeta ? "#94a3b8" : "#6366f1",
					paddingVertical: 16,
					borderRadius: 16,
					alignItems: "center",
				}}
			>
				<Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
					{submitting ? "Публикуем..." : "Опубликовать"}
				</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}
