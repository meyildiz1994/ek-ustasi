/** Shares a postcard: Skia snapshot → PNG in the cache folder → system share sheet. Native only. */
import type { CanvasRef } from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export const canShare = Platform.OS !== 'web';

export async function shareSnapshot(canvas: CanvasRef, name: string, title: string): Promise<void> {
  if (!canShare || !(await Sharing.isAvailableAsync())) return;
  const image = await canvas.makeImageSnapshotAsync();
  const file = new File(Paths.cache, `${name}.png`);
  if (file.exists) file.delete();
  file.create();
  file.write(image.encodeToBytes());
  await Sharing.shareAsync(file.uri, { mimeType: 'image/png', dialogTitle: title });
}
