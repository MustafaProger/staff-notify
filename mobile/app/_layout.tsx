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
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name='register'
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name='feed'
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name='announcement/[id]'
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name='announcement/stats'
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name='announcements/create'
				options={{ headerShown: false }}
			/>
		</Stack>
	);
}
