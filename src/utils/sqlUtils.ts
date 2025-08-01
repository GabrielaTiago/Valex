interface UpdateQueryParams {
  object: Record<string, unknown>;
  offset?: number;
}

interface UpdateQueryResult {
  objectColumns: string;
  objectValues: unknown[];
}

export function mapObjectToUpdateQuery({ object, offset = 1 }: UpdateQueryParams): UpdateQueryResult {
  const objectColumns = Object.keys(object)
    .map((key, index) => `"${key}"=$${index + offset}`)
    .join(',');
  const objectValues = Object.values(object);

  return { objectColumns, objectValues };
}
