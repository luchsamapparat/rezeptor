import { cookbooks } from '~/useCases/cookbooks/server/persistence';
import { recipes } from '~/useCases/recipes/server/persistence';
import { initApplicationContext } from './application/applicationContext';

export const applicationContext = await initApplicationContext(process.env, {
  cookbooks,
  recipes,
});

export type ApplicationContext = typeof applicationContext;
