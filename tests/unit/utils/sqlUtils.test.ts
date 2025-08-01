import { describe, it, expect } from 'vitest';

import { mapObjectToUpdateQuery } from '@/utils/sqlUtils.js';

describe('mapObjectToUpdateQuery', () => {
  it('should map simple object with default offset', () => {
    const object = {
      name: 'John',
      age: 30,
      email: 'john@example.com',
    };

    const result = mapObjectToUpdateQuery({ object });

    expect(result.objectColumns).toBe('"name"=$1,"age"=$2,"email"=$3');
    expect(result.objectValues).toEqual(['John', 30, 'john@example.com']);
  });

  it('should map object with custom offset', () => {
    const object = {
      title: 'Test Title',
      content: 'Test Content',
    };

    const result = mapObjectToUpdateQuery({ object, offset: 3 });

    expect(result.objectColumns).toBe('"title"=$3,"content"=$4');
    expect(result.objectValues).toEqual(['Test Title', 'Test Content']);
  });

  it('should map empty object', () => {
    const object = {};

    const result = mapObjectToUpdateQuery({ object });

    expect(result.objectColumns).toBe('');
    expect(result.objectValues).toEqual([]);
  });

  it('should map object with a single field', () => {
    const object = {
      status: 'active',
    };

    const result = mapObjectToUpdateQuery({ object });

    expect(result.objectColumns).toBe('"status"=$1');
    expect(result.objectValues).toEqual(['active']);
  });

  it('should map object with values of different types', () => {
    const object = {
      id: 1,
      name: 'Test',
      active: true,
      score: 95.5,
      tags: ['tag1', 'tag2'],
      metadata: { key: 'value' },
    };

    const result = mapObjectToUpdateQuery({ object });

    expect(result.objectColumns).toBe('"id"=$1,"name"=$2,"active"=$3,"score"=$4,"tags"=$5,"metadata"=$6');
    expect(result.objectValues).toEqual([1, 'Test', true, 95.5, ['tag1', 'tag2'], { key: 'value' }]);
  });

  it('should map object with keys that contain special characters', () => {
    const object = {
      user_name: 'john_doe',
      created_at: '2023-01-01',
      is_active: true,
    };

    const result = mapObjectToUpdateQuery({ object });

    expect(result.objectColumns).toBe('"user_name"=$1,"created_at"=$2,"is_active"=$3');
    expect(result.objectValues).toEqual(['john_doe', '2023-01-01', true]);
  });

  it('should map object with offset zero', () => {
    const object = {
      name: 'Test',
      value: 42,
    };

    const result = mapObjectToUpdateQuery({ object, offset: 0 });

    expect(result.objectColumns).toBe('"name"=$0,"value"=$1');
    expect(result.objectValues).toEqual(['Test', 42]);
  });

  it('should map object with negative offset', () => {
    const object = {
      field1: 'value1',
      field2: 'value2',
    };

    const result = mapObjectToUpdateQuery({ object, offset: -1 });

    expect(result.objectColumns).toBe('"field1"=$-1,"field2"=$0');
    expect(result.objectValues).toEqual(['value1', 'value2']);
  });

  it('should map object with null and undefined values', () => {
    const object = {
      name: 'Test',
      description: null,
      optional: undefined,
    };

    const result = mapObjectToUpdateQuery({ object });

    expect(result.objectColumns).toBe('"name"=$1,"description"=$2,"optional"=$3');
    expect(result.objectValues).toEqual(['Test', null, undefined]);
  });

  it('should map object with boolean values', () => {
    const object = {
      is_active: true,
      is_deleted: false,
      is_verified: true,
    };

    const result = mapObjectToUpdateQuery({ object });

    expect(result.objectColumns).toBe('"is_active"=$1,"is_deleted"=$2,"is_verified"=$3');
    expect(result.objectValues).toEqual([true, false, true]);
  });

  it('should map object with numeric values', () => {
    const object = {
      count: 0,
      price: 99.99,
      rating: 4.5,
      quantity: 100,
    };

    const result = mapObjectToUpdateQuery({ object });

    expect(result.objectColumns).toBe('"count"=$1,"price"=$2,"rating"=$3,"quantity"=$4');
    expect(result.objectValues).toEqual([0, 99.99, 4.5, 100]);
  });

  it('should map object with empty strings', () => {
    const object = {
      name: '',
      description: '   ',
      notes: '',
    };

    const result = mapObjectToUpdateQuery({ object });

    expect(result.objectColumns).toBe('"name"=$1,"description"=$2,"notes"=$3');
    expect(result.objectValues).toEqual(['', '   ', '']);
  });

  it('should map object with empty arrays', () => {
    const object = {
      tags: [],
      permissions: [],
      history: [],
    };

    const result = mapObjectToUpdateQuery({ object });

    expect(result.objectColumns).toBe('"tags"=$1,"permissions"=$2,"history"=$3');
    expect(result.objectValues).toEqual([[], [], []]);
  });

  it('should map object with nested objects', () => {
    const object = {
      user: { id: 1, name: 'John' },
      settings: { theme: 'dark', notifications: true },
      metadata: { created: '2023-01-01', updated: '2023-01-02' },
    };

    const result = mapObjectToUpdateQuery({ object });

    expect(result.objectColumns).toBe('"user"=$1,"settings"=$2,"metadata"=$3');
    expect(result.objectValues).toEqual([
      { id: 1, name: 'John' },
      { theme: 'dark', notifications: true },
      { created: '2023-01-01', updated: '2023-01-02' },
    ]);
  });
});
