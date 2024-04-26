/** @scope * */
export type ModelId = string;

/** @scope * */
export type Model<T> = T & {
  id: ModelId;
};

/** @scope * */
export type WithoutModelId<T> = Omit<T, 'id'>;
