import { clsx } from 'clsx';
import { useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper/types';
import type { RecipeDto } from '../api/client';
import placeholderRecipePhoto from './assets/placeholder-recipe-photo.webp';
import styles from './RecipeCarousel.module.css';

type Props = {
  recipes: RecipeDto[];
  activeId: string;
  blocked: boolean;
  onActiveChange: (id: string) => void;
};

export function RecipeCarousel({ recipes, activeId, blocked, onActiveChange }: Props) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const index = Math.max(0, recipes.findIndex(recipe => recipe.id === activeId));

  useEffect(() => {
    const swiper = swiperRef.current;
    if (swiper && swiper.realIndex !== index) swiper.slideToLoop(index, 0);
  }, [index]);

  return (
    <Swiper
      key={recipes.map(recipe => recipe.id).join(':')}
      className={styles.carousel}
      slidesPerView={1}
      initialSlide={index}
      loop={recipes.length >= 2}
      allowTouchMove={!blocked && recipes.length > 1}
      noSwiping
      noSwipingClass="swiper-no-swiping"
      onSwiper={(swiper) => { swiperRef.current = swiper; }}
      onSlideChange={(swiper) => {
        const recipe = recipes[swiper.realIndex];
        if (recipe) onActiveChange(recipe.id);
      }}
    >
      {recipes.map((recipe, slideIndex) => (
        <SwiperSlide key={recipe.id} className={styles.slide}>
          <img
            className={clsx(styles.photo, { [styles.placeholder]: recipe.photoFileId === null })}
            src={recipe.photoFileId === null ? placeholderRecipePhoto : `/api/recipes/${recipe.id}/photo?v=${encodeURIComponent(recipe.photoFileId)}`}
            alt={recipe.photoFileId === null ? '' : `Foto von ${recipe.title}`}
            loading={Math.abs(slideIndex - index) <= 1 || (recipes.length > 1 && (slideIndex === 0 || slideIndex === recipes.length - 1)) ? 'eager' : 'lazy'}
            fetchPriority={slideIndex === index ? 'high' : 'auto'}
            draggable={false}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
