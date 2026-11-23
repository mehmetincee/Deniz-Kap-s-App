import { Stack } from 'expo-router';

import { stackOptions } from '../../../components/navigation';
import { useT } from '../../../i18n';

export default function Layout() {
  const { t } = useT();
  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="index" options={{ title: t('tab.reservation') }} />
    </Stack>
  );
}
