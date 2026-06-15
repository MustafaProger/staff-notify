import React, { useEffect, useState } from "react";
import { View, Text, TextInput, ScrollView, Alert, TouchableOpacity, SafeAreaView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getApiErrorMessage, login, saveToken, me } from "../lib/api";

export default function LoginScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ email?: string; registered?: string }>();
	const initialEmail = typeof params.email === "string" ? params.email : "user1@corp.local";
	const initialPassword = typeof params.email === "string" ? "" : "User123!";
	const [email, setEmail] = useState(initialEmail);
	const [password, setPassword] = useState(initialPassword);
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const registered = params.registered === "1";

	useEffect(() => {
		if (typeof params.email !== "string") return;
		setEmail(params.email);
		setPassword("");
		setErrorMessage(null);
	}, [params.email]);

	const showError = (message: string) => {
		setErrorMessage(message);
		Alert.alert("Ошибка", message);
	};

	const onLogin = async () => {
		if (loading) return;
		setErrorMessage(null);
		if (!email.trim()) {
			showError("Введите email");
			return;
		}
		if (!password) {
			showError("Введите пароль");
			return;
		}

		try {
			setLoading(true);
			const resp = await login({ email: email.trim().toLowerCase(), password });
			await saveToken(resp.token);
			await me(); // проверка токена
			router.replace("/feed");
		} catch (e: any) {
			showError(getApiErrorMessage(e, "Не удалось войти"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
			<ScrollView
				contentContainerStyle={{
					flexGrow: 1,
					justifyContent: "center",
					alignItems: "center",
					paddingHorizontal: 24,
					paddingVertical: 32,
				}}
				keyboardShouldPersistTaps="handled"
			>
				<View
					style={{
						width: "100%",
						maxWidth: 520,
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
					Добро пожаловать
				</Text>
				<Text style={{ fontSize: 16, color: "#64748b", marginBottom: 32 }}>
					Войдите в свой аккаунт
				</Text>

				<View style={{ gap: 20 }}>
					{registered && !errorMessage && (
						<View
							style={{
								backgroundColor: "#dcfce7",
								borderColor: "#bbf7d0",
								borderRadius: 10,
								borderWidth: 1,
								padding: 12,
							}}
						>
							<Text style={{ color: "#166534", fontSize: 14, lineHeight: 20 }}>
								Аккаунт создан. Введите пароль и войдите.
							</Text>
						</View>
					)}
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

					<TouchableOpacity
						onPress={onLogin}
						disabled={loading}
						style={{
							backgroundColor: loading ? "#94a3b8" : "#6366f1",
							paddingVertical: 14,
							borderRadius: 10,
							alignItems: "center",
							marginTop: 8,
						}}
					>
						<Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
							{loading ? "Входим..." : "Войти"}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						onPress={() => router.push({ pathname: "/register" })}
						disabled={loading}
						style={{ marginTop: 8 }}
					>
						<Text
							style={{
								color: "#6366f1",
								textAlign: "center",
								fontSize: 14,
								fontWeight: "500",
							}}
						>
							Нет аккаунта? Зарегистрируйтесь
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</ScrollView>
		</SafeAreaView>
	);
}
