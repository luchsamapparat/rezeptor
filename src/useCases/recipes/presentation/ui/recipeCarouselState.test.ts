import { describe, expect, it } from 'vitest';
import { setSwiperTouchEnabled } from './recipeCarouselState';

describe('recipe carousel state', () => {
  it('should synchronize the configured and live touch state', () => {
    const swiper = {
      allowTouchMove: false,
      params: { allowTouchMove: false },
    };

    setSwiperTouchEnabled(swiper, true);

    expect(swiper).toMatchObject({
      allowTouchMove: true,
      params: { allowTouchMove: true },
    });
  });
});
