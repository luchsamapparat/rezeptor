export type ModelId = string;

export type Model<T> = T & {
    id: ModelId;
}

export type WithoutModelId<T> = Omit<T, 'id'>;