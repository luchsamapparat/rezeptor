type TouchMoveSwiper = {
  allowTouchMove: boolean;
  params: {
    allowTouchMove?: boolean;
  };
};

export const setSwiperTouchEnabled = (swiper: TouchMoveSwiper, enabled: boolean) => {
  swiper.params.allowTouchMove = enabled;
  swiper.allowTouchMove = enabled;
};
