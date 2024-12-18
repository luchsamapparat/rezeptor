import { BookBookmark, Books, Camera, FunnelX, PencilSimple, Trash } from "@phosphor-icons/react";
import { ClientActionFunctionArgs, ClientLoaderFunctionArgs, Link, useFetcher, useLoaderData, useSearchParams } from "@remix-run/react";
import { isEmpty, isNull } from "lodash-es";
// import 'swiper/css';
// import 'swiper/css/effect-creative';
// import { EffectCreative } from 'swiper/modules';
// import { Swiper, SwiperSlide } from 'swiper/react';
import { getApiBaseUrl } from "~/environment";
import { authenticatedFetch } from "~/infrastructure/fetch";
import { Cookbook, RecipeDto, getRecipeMapper } from "~/model";
import classes from '~/styles/index.module.css';

export async function clientLoader({ request }: ClientLoaderFunctionArgs) {
  const requestUrl = new URL(request.url);

  const recipeQueryParams = new URLSearchParams();
  const cookbookId = requestUrl.searchParams.get('cookbookId');

  if (!isNull(cookbookId)) {
    recipeQueryParams.set('cookbookId', cookbookId);
  }

  const [recipeDtos, cookbooks] = await Promise.all([
    authenticatedFetch(`/getRecipes?${recipeQueryParams}`)
      .then(response => response.json() as Promise<RecipeDto[]>),

    authenticatedFetch(`/getCookbooks`)
      .then(response => response.json() as Promise<Cookbook[]>)
  ]);

  return recipeDtos.map(getRecipeMapper(cookbooks, getApiBaseUrl()));
}

export async function clientAction({ request }: ClientActionFunctionArgs) {
  await authenticatedFetch(`/removeRecipe`, {
    method: 'post',
    body: await request.formData()
  });
  return null;
}

export default function Index() {
  const [searchParams] = useSearchParams();
  const recipes = useLoaderData<typeof clientLoader>();

  const isFiltered = searchParams.size > 0;

  const fetcher = useFetcher();
  const submitting = fetcher.state === 'submitting';

  return (<>
    <nav className={classes.navigation}>
      {isFiltered ? (
        <Link to={`/`}><FunnelX /> alle anzeigen</Link>
      ) : null}
      <Link to="/cookbooks"><Books /> Kochbücher</Link>
      <Link to="/recipes/new"><BookBookmark /> Rezept merken</Link>
    </nav>
    <main>
      {/* <Swiper
        grabCursor={true}
        effect={'creative'}
        creativeEffect={{
          prev: {
            shadow: true,
            translate: [0, 0, -400],
          },
          next: {
            translate: ['100%', 0, 0],
          },
        }}
        modules={[EffectCreative]}
        className="mySwiper"
      > */}
      {recipes.map(recipe => (
        // <SwiperSlide key={recipe.id}>
        <article key={recipe.id} className={classes.recipe} style={{ backgroundImage: isNull(recipe.photoFileUrl) ? undefined : `url('${recipe.photoFileUrl}')` }}>
          <header>
            <h2>{isEmpty(recipe.title) ? 'ohne Titel' : recipe.title}</h2>
            <p>
              {recipe.cookbook.title}{isNull(recipe.pageNumber) ? null : (
                <>, Seite {recipe.pageNumber}</>
              )}
            </p>
          </header>

          <footer>
            <Link to={`/recipes/edit/${recipe.id}`}><PencilSimple /> bearbeiten</Link>
            <Link to={`/recipes/replacePhoto/${recipe.id}`}>
              <Camera />
              {(isNull(recipe.photoFileUrl)) ? "Foto hinzufügen" : "Foto ersetzen"}
            </Link>
            <fetcher.Form method="post">
              <button type="submit" name="id" value={recipe.id} disabled={submitting}><Trash /> löschen</button>
            </fetcher.Form>
          </footer>
        </article>
        // </SwiperSlide>

      ))}
      {/* </Swiper> */}
    </main>
  </>);
}
