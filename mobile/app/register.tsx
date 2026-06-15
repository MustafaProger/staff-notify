import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	TextInput,
	Alert,
	ActivityIndicator,
	ScrollView,
	TouchableOpacity,
	SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import {
	clearToken,
	Department,
	getApiErrorMessage,
	getDepartments,
	register as registerRequest,
} from "../lib/api";

function getPasswordErrors(password: string) {
	const errors: string[] = [];
	if (password.length < 8) errors.push("Пароль должен содержать минимум 8 символов");
	if (!/[A-Z]/.test(password)) errors.push("Нужна заглавная буква");
	if (!/[a-z]/.test(password)) errors.push("Нужна строчная буква");
	if (!/[0-9]/.test(password)) errors.push("Нужна цифра");
	return errors;
}

export default function RegisterScreen() {
	const router = useRouter();
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [departmentId, setDepartmentId] = useState<number | null>(null);
	const [departments, setDepartments] = useState<Department[]>([]);
	const [loadingDeps, setLoadingDeps] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const showError = (message: string) => {
		setErrorMessage(message);
		Alert.alert("Ошибка", message);
	};

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
				showError(
					getApiErrorMessage(err, "Не удалось загрузить список подразделений")
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
		setErrorMessage(null);

		if (!fullName.trim()) {
			showError("Укажите полное имя");
			return;
		}
		if (!email.trim()) {
			showError("Введите email");
			return;
		}
		const passwordErrors = getPasswordErrors(password);
		if (passwordErrors.length) {
			showError(passwordErrors.join("\n"));
			return;
		}
		if (departmentId === null) {
			showError("Выберите подразделение");
			return;
		}

		try {
			setSubmitting(true);
			const normalizedEmail = email.trim().toLowerCase();
			await registerRequest({
				email: normalizedEmail,
				password,
				fullName: fullName.trim(),
				departmentId,
			});
			await clearToken();
			router.replace({
				pathname: "/login",
				params: { email: normalizedEmail, registered: "1" },
			});
		} catch (err: any) {
			showError(getApiErrorMessage(err, "Не удалось зарегистрироваться"));
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
			<View
				style={{
					width: "100%",
					maxWidth: 720,
					alignSelf: "center",
					paddingTop: 12,
					paddingHorizontal: 16,
					paddingBottom: 8,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<TouchableOpacity onPress={() => router.back()}>
					<Text style={{ color: "#6366f1", fontWeight: "600", fontSize: 16 }}>
						Назад
					</Text>
				</TouchableOpacity>
				<Text
					style={{
						fontSize: 18,
						fontWeight: "700",
						color: "#0f172a",
					}}
				>
					Регистрация
				</Text>
				<View style={{ width: 48 }} />
			</View>

		<ScrollView
			contentContainerStyle={{
				flexGrow: 1,
				alignItems: "center",
				paddingHorizontal: 24,
				paddingVertical: 24,
				backgroundColor: "#f8fafc",
			}}
			keyboardShouldPersistTaps="handled"
		>
			<View
				style={{
					width: "100%",
					maxWidth: 640,
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
					{errorMessage && (
						<View
							style={{
								backgroundColor: "#fee2e2",
								borderColor: "#fecaca",
								borderRadius: 10,
								borderWidth: 1,
								padding: 12,
							}}
						>
							<Text style={{ color: "#991b1b", fontSize: 14, lineHeight: 20 }}>
								{errorMessage}
							</Text>
						</View>
					)}
					<View style={{ gap: 8 }}>
						<Text style={{ fontSize: 14, fontWeight: "600", color: "#475569" }}>
							ФИО
						</Text>
						<TextInput
							value={fullName}
							onChangeText={(value) => {
								setFullName(value);
								setErrorMessage(null);
							}}
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
							onChangeText={(value) => {
								setEmail(value);
								setErrorMessage(null);
							}}
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
							onChangeText={(value) => {
								setPassword(value);
								setErrorMessage(null);
							}}
							secureTextEntry
							placeholder="Admin123!"
							style={{
								borderWidth: 1.5,
								borderColor: "#e2e8f0",
								padding: 14,
								borderRadius: 10,
								fontSize: 16,
								backgroundColor: "#f8fafc",
							}}
						/>
						<Text style={{ color: "#64748b", fontSize: 12, lineHeight: 18 }}>
							Минимум 8 символов, заглавная и строчная буквы, цифра.
						</Text>
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
		</SafeAreaView>
	);
}
