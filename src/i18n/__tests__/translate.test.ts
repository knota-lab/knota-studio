import { describe, expect, it } from 'vitest';
import { interpolate, namespaceOf, resolveTranslation } from '../translate';
import type { CachedBundle } from '../types';

function makeBundle(
  namespace: string,
  locale: string,
  entries: Record<string, string>,
): CachedBundle {
  return { etag: '"test"', namespace, locale, fetchedAt: 0, entries };
}

const bundles = new Map([
  [
    'zh-CN::Common',
    makeBundle('Common', 'zh-CN', { save: '保存', cancel: '取消' }),
  ],
  [
    'en-US::Common',
    makeBundle('Common', 'en-US', { save: 'Save', cancel: 'Cancel' }),
  ],
  ['zh-CN::Login', makeBundle('Login', 'zh-CN', { title: '登录 {{name}}' })],
]);

describe('interpolate', () => {
  it('returns template unchanged when no params provided', () => {
    expect(interpolate('Hello {{name}}')).toBe('Hello {{name}}');
  });

  it('replaces a single placeholder', () => {
    expect(interpolate('Hello {{name}}', { name: 'World' })).toBe(
      'Hello World',
    );
  });

  it('replaces multiple placeholders', () => {
    expect(
      interpolate('{{greeting}} {{name}}', { greeting: 'Hi', name: 'Bob' }),
    ).toBe('Hi Bob');
  });

  it('replaces number values', () => {
    expect(interpolate('Count: {{n}}', { n: 42 })).toBe('Count: 42');
  });

  it('replaces null/undefined with literal placeholder text (visible bug)', () => {
    expect(interpolate('{{missing}}', {})).toBe('{{missing}}');
    expect(interpolate('{{x}}', { x: null })).toBe('{{x}}');
  });

  it('handles whitespace in placeholder', () => {
    expect(interpolate('{{ name }}', { name: 'Alice' })).toBe('Alice');
  });
});

describe('namespaceOf', () => {
  it('extracts namespace from key', () => {
    expect(namespaceOf('Common.save')).toBe('Common');
  });

  it('returns null for key without dot', () => {
    expect(namespaceOf('nons')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(namespaceOf('')).toBeNull();
  });

  it('returns null for leading dot', () => {
    expect(namespaceOf('.key')).toBeNull();
  });

  it('returns namespace for trailing dot (known: should be null per resolveTranslation)', () => {
    // namespaceOf does not check for trailing dot unlike resolveTranslation
    expect(namespaceOf('ns.')).toBe('ns');
  });
});

describe('resolveTranslation', () => {
  it('resolves from active locale bundle', () => {
    expect(resolveTranslation('Common.save', 'zh-CN', bundles)).toBe('保存');
  });

  it('falls back to base locale (zh-CN)', () => {
    expect(resolveTranslation('Common.save', 'ja-JP', bundles)).toBe('保存');
  });

  it('returns key when not found in any bundle', () => {
    expect(resolveTranslation('Common.delete', 'ja-JP', bundles)).toBe(
      'Common.delete',
    );
  });

  it('uses string fallback when key not found', () => {
    expect(
      resolveTranslation('Common.delete', 'en-US', bundles, 'Delete'),
    ).toBe('Delete');
  });

  it('interpolates params into resolved value', () => {
    expect(
      resolveTranslation('Login.title', 'zh-CN', bundles, { name: '小明' }),
    ).toBe('登录 小明');
  });

  it('returns malformed key as-is', () => {
    expect(resolveTranslation('nokey', 'en-US', bundles)).toBe('nokey');
  });
});
