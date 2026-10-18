import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper/types';
import type { RecipeDto } from '../api/client';
import placeholderRecipePhoto from './assets/placeholder-recipe-photo.webp';
import { setSwiperTouchEnabled } from './recipeCarouselState';
import styles from './RecipeCarousel.module.css';

type Props = {
  recipes: RecipeDto[];
  activeId: string;
  blocked: boolean;
  onActiveChange: (id: string) => void;
};

type RecipePhotoProps = {
  recipe: RecipeDto;
  eager: boolean;
  active: boolean;
};

function RecipePhoto({ recipe, eager, active }: RecipePhotoProps) {
  const [loaded, setLoaded] = useState(false);
  const displayRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const display = displayRef.current;
    if (display?.complete && display.naturalWidth > 0) setLoaded(true);
  }, [recipe.photoFileId]);

  if (recipe.photoFileId === null) {
    return <img className={clsx(styles.photo, styles.placeholder)} src={placeholderRecipePhoto} alt="" draggable={false} />;
  }

  const version = encodeURIComponent(recipe.photoFileId);
  const photoUrl = `/api/recipes/${recipe.id}/photo?v=${version}`;

  return (
    <>
      <img
        className={clsx(styles.photo, styles.preview)}
        src={`${photoUrl}&variant=preview`}
        alt=""
        aria-hidden="true"
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={active ? 'high' : 'auto'}
        draggable={false}
      />
      <img
        ref={displayRef}
        className={clsx(styles.photo, styles.display, { [styles.loaded]: loaded })}
        src={`${photoUrl}&variant=display`}
        alt={`Foto von ${recipe.title}`}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={active ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        draggable={false}
      />
    </>
  );
}

export function RecipeCarousel({ recipes, activeId, blocked, onActiveChange }: Props) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const index = Math.max(0, recipes.findIndex(recipe => recipe.id === activeId));
  const touchEnabled = !blocked && recipes.length > 1;

  useEffect(() => {
    const swiper = swiperRef.current;
    if (swiper && swiper.realIndex !== index) swiper.slideToLoop(index, 0);
  }, [index]);

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper) return;

    // Swiper React updates the parameter, but not the live instance property
    // consulted by the touch handlers.
    setSwiperTouchEnabled(swiper, touchEnabled);
  }, [touchEnabled]);

  return (
    <Swiper
      key={recipes.map(recipe => recipe.id).join(':')}
      className={styles.carousel}
      slidesPerView={1}
      initialSlide={index}
      loop={recipes.length >= 2}
      allowTouchMove={touchEnabled}
      noSwiping
      noSwipingClass="swiper-no-swiping"
      onSwiper={(swiper) => {
        swiperRef.current = swiper;
        setSwiperTouchEnabled(swiper, touchEnabled);
      }}
      onSlideChange={(swiper) => {
        const recipe = recipes[swiper.realIndex];
        if (recipe) onActiveChange(recipe.id);
      }}
    >
      {recipes.map((recipe, slideIndex) => (
        <SwiperSlide key={recipe.id} className={styles.slide}>
          <RecipePhoto
            key={recipe.photoFileId ?? 'placeholder'}
            recipe={recipe}
            eager={Math.abs(slideIndex - index) <= 1 || (recipes.length > 1 && (slideIndex === 0 || slideIndex === recipes.length - 1))}
            active={slideIndex === index}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
