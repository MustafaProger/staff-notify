import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	TextInput,
	Button,
	Alert,
	ActivityIndicator,
	ScrollView,
	TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import {
	Department,
	getDepartments,
	me,
	register as registerRequest,
	saveToken,
} from "../lib/api";

export default function RegisterScreen() {
	const router = useRouter();
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [departmentId, setDepartmentId] = useState<number | null>(null);
	const [departments, setDepartments] = useState<Department[]>([]);
	const [loadingDeps, setLoadingDeps] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		let active = true;
		const load = async () => {
			setLoadingDeps(true);
			try {
				const { items } = await getDepartments();
				if (!active) return;
				setDepartments(items);
				if (items.length) {
					setDepartmentId(items[0].id);
				}
			} catch (err: any) {
				Alert.alert(
					"Ошибка",
					err?.response?.data?.message ??
						"Не удалось загрузить список подразделений"
				);
			} finally {
				if (active) setLoadingDeps(false);
			}
		};
		load();
		return () => {
			active = false;
		};
	}, []);

	const onSubmit = async () => {
		if (submitting) return;
		if (!fullName.trim()) {
			Alert.alert("Ошибка", "Укажите полное имя");
			return;
		}
		if (!email.trim()) {
			Alert.alert("Ошибка", "Введите email");
			return;
		}
		if (password.length < 8) {
			Alert.alert("Ошибка", "Пароль должен содержать минимум 8 символов");
			return;
		}
		if (departmentId === null) {
			Alert.alert("Ошибка", "Выберите подразделение");
			return;
		}

		try {
			setSubmitting(true);
			const { token } = await registerRequest({
				email: email.trim(),
				password,
				fullName: fullName.trim(),
				departmentId,
			});
			await saveToken(token);
			await me(); // проверяем токен
			router.replace("/feed");
		} catch (err: any) {
			Alert.alert(
				"Ошибка",
				err?.response?.data?.message ?? "Не удалось зарегистрироваться"
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<ScrollView
			contentContainerStyle={{ padding: 20, backgroundColor: "#f8fafc" }}
			keyboardShouldPersistTaps="handled"
		>
			<View
				style={{
					backgroundColor: "#ffffff",
					borderRadius: 16,
					padding: 24,
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.1,
					shadowRadius: 8,
				}}
			>
				<Text
					style={{
						fontSize: 28,
						fontWeight: "700",
						marginBottom: 8,
						color: "#1e293b",
					}}
				>
					Регистрация
				</Text>
				<Text style={{ fontSize: 16, color: "#64748b", marginBottom: 32 }}>
					Создайте новый аккаунт
				</Text>

				<View style={{ gap: 20 }}>
					<View style={{ gap: 8 }}>
						<Text style={{ fontSize: 14, fontWeight: "600", color: "#475569" }}>
							ФИО
						</Text>
						<TextInput
							value={fullName}
							onChangeText={setFullName}
							placeholder="Иван Иванов"
							style={{
								borderWidth: 1.5,
								borderColor: "#e2e8f0",
								padding: 14,
								borderRadius: 10,
								fontSize: 16,
								backgroundColor: "#f8fafc",
							}}
						/>
					</View>

					<View style={{ gap: 8 }}>
						<Text style={{ fontSize: 14, fontWeight: "600", color: "#475569" }}>
							Email
						</Text>
						<TextInput
							value={email}
							onChangeText={setEmail}
							autoCapitalize="none"
							keyboardType="email-address"
							placeholder="user@corp.local"
							style={{
								borderWidth: 1.5,
								borderColor: "#e2e8f0",
								padding: 14,
								borderRadius: 10,
								fontSize: 16,
								backgroundColor: "#f8fafc",
							}}
						/>
					</View>

					<View style={{ gap: 8 }}>
						<Text style={{ fontSize: 14, fontWeight: "600", color: "#475569" }}>
							Пароль
						</Text>
						<TextInput
							value={password}
							onChangeText={setPassword}
							secureTextEntry
							placeholder="Не менее 8 символов"
							style={{
								borderWidth: 1.5,
								borderColor: "#e2e8f0",
								padding: 14,
								borderRadius: 10,
								fontSize: 16,
								backgroundColor: "#f8fafc",
							}}
						/>
					</View>

					<View style={{ gap: 8 }}>
						<Text style={{ fontSize: 14, fontWeight: "600", color: "#475569" }}>
							Отдел
						</Text>
						{loadingDeps ? (
							<View style={{ paddingVertical: 16 }}>
								<ActivityIndicator size="small" color="#6366f1" />
							</View>
						) : departments.length ? (
							<View style={{ gap: 8 }}>
								{departments.map((dep) => {
									const selected = dep.id === departmentId;
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
											onPress={() => setDepartmentId(dep.id)}
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
							<Text style={{ opacity: 0.7, padding: 12 }}>
								Нет доступных подразделений. Обратитесь к администратору.
							</Text>
						)}
					</View>

					<TouchableOpacity
						onPress={onSubmit}
						disabled={submitting || loadingDeps}
						style={{
							backgroundColor:
								submitting || loadingDeps ? "#94a3b8" : "#6366f1",
							paddingVertical: 14,
							borderRadius: 10,
							alignItems: "center",
							marginTop: 8,
						}}
					>
						<Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
							{submitting ? "Отправляем..." : "Создать аккаунт"}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity onPress={() => router.back()} disabled={submitting}>
						<Text
							style={{
								color: "#6366f1",
								textAlign: "center",
								fontSize: 14,
								fontWeight: "500",
							}}
						>
							Уже есть аккаунт? Войти
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</ScrollView>
	);
}
