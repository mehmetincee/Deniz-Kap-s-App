import { Stack } from 'expo-router';

import { stackOptions } from '../../../components/navigation';

export default function Layout() {
  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="index" options={{ title: 'Rezervasyon' }} />
    </Stack>
  );
}
