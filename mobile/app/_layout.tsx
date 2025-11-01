import React from "react";
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: "Вход" }} />
      <Stack.Screen name="feed" options={{ title: "Объявления" }} />
    </Stack>
  );
}