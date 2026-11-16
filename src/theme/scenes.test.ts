import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { SCENE_PHOTO_COUNT, scenePhoto } from './scenes';

describe('scene photos', () => {
  it('has one photo per stop, 1–100', () => {
    expect(SCENE_PHOTO_COUNT).toBe(100);
    for (let n = 1; n <= 100; n++) {
      expect(scenePhoto(n)).toBeDefined();
      const file = join(
        __dirname,
        '../../assets/images/scenes',
        `${String(n).padStart(3, '0')}.webp`,
      );
      expect(existsSync(file)).toBe(true);
    }
    expect(scenePhoto(0)).toBeUndefined();
    expect(scenePhoto(101)).toBeUndefined();
  });
});
