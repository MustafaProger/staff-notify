import React from "react";
import { Stack } from "expo-router";

export default function Layout() {
	return (
		<Stack>
			<Stack.Screen
				name='index'
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name='login'
				options={{ title: "Вход" }}
			/>
			<Stack.Screen
				name='register'
				options={{ title: "Регистрация" }}
			/>
			<Stack.Screen
				name='feed'
				options={{ title: "Объявления" }}
			/>
		<Stack.Screen
			name='announcement/[id]'
			options={{ title: "Объявление" }}
		/>
		<Stack.Screen
			name='announcement/stats'
			options={{ title: "Статистика" }}
		/>
		<Stack.Screen
			name='announcements/create'
			options={{ title: "Новое объявление" }}
		/>
		</Stack>
	);
}
