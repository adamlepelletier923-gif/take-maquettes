import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const script = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const ids = [...html.matchAll(/data-k="([^"]+)"/g)].map(match => match[1]);
const proofIds = [...html.matchAll(/data-proof="([^"]+)"/g)].map(match => match[1]);

function openPage(saved = new Map(), blocked = false) {
  function element() {
    const listeners = new Map();
    return {
      value: '', checked: false, disabled: true, textContent: '',
      addEventListener(type, callback) { listeners.set(type, callback); },
      fire(type) { listeners.get(type)?.(); },
    };
  }
  const fields = Object.fromEntries(['version', 'notes', 'progress', 'storage-status'].map(id => [id, element()]));
  const boxes = ids.map(id => ({ ...element(), dataset: { k: id } }));
  const films = proofIds.map(id => ({ ...element(), defaultValue: '', dataset: { proof: id } }));
  runInNewContext(script, {
    document: {
      getElementById: id => fields[id],
      querySelectorAll: selector => selector === 'input[data-k]' ? boxes : films,
    },
    localStorage: {
      getItem(key) { if (blocked) throw new Error('Storage unavailable'); return saved.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw new Error('Storage unavailable'); saved.set(key, value); },
    },
  });
  return {
    ...fields, boxes, films,
    choose(version) { fields.version.value = version; fields.version.fire('change'); },
    check(index) { boxes[index].checked = true; boxes[index].fire('change'); },
  };
}

test('the actual checklist has unique cases and starts without an invented result', () => {
  expect(new Set(ids).size).toBe(ids.length);
  const page = openPage();
  expect(page.boxes.every(box => box.disabled && !box.checked)).toBe(true);
  expect(page.progress.textContent).toContain('avant de cocher');
});

test('checked cases and notes survive reopening the same version', () => {
  const saved = new Map();
  const page = openPage(saved);
  page.choose('190');
  page.check(0);
  page.notes.value = '2c à refaire';
  page.notes.fire('input');
  const reopened = openPage(saved);
  expect(reopened.version.value).toBe('190');
  expect(reopened.boxes[0].checked).toBe(true);
  expect(reopened.notes.value).toBe('2c à refaire');
  expect(reopened.progress.textContent).toBe(`1 / ${ids.length} points vérifiés sur l’iPhone`);
});

test('another version starts empty and returning restores only its own results', () => {
  const page = openPage();
  page.choose('190');
  page.check(0);
  page.choose('191');
  expect(page.boxes.every(box => !box.checked)).toBe(true);
  page.check(1);
  page.choose('190');
  expect(page.boxes[0].checked).toBe(true);
  expect(page.boxes[1].checked).toBe(false);
  page.choose('');
  expect(page.boxes.every(box => box.disabled && !box.checked)).toBe(true);
});

test('blocked storage keeps the checklist usable and announces the lost persistence', () => {
  const page = openPage(new Map(), true);
  page.choose('190');
  page.check(0);
  expect(page.boxes[0].checked).toBe(true);
  expect(page.progress.textContent).toContain('1 /');
  expect(page['storage-status'].textContent).toContain('ne peuvent pas être gardées');
});

test('a corrupt saved record is reported and does not create checked cases', () => {
  const saved = new Map([['take-iphone-2026-10-03-v2:190', '{broken']]);
  const page = openPage(saved);
  page.choose('190');
  expect(page.boxes.every(box => !box.checked)).toBe(true);
  expect(page['storage-status'].textContent).toContain('illisibles');
});

test('film evidence starts empty and is saved separately for each version', () => {
  const saved = new Map();
  const page = openPage(saved);
  page.choose('190');
  expect(page.films).toHaveLength(11);
  expect(page.films.every(field => field.value === '')).toBe(true);
  expect(page.boxes).toHaveLength(13);
  page.films[0].value = 'https://example.com/film.mp4';
  page.films[0].fire('input');
  page.choose('191');
  expect(page.films[0].value).toBe('');
  expect(page.boxes.every(box => !box.checked)).toBe(true);
  const reopened = openPage(saved);
  reopened.choose('190');
  expect(reopened.films[0].value).toBe('https://example.com/film.mp4');
  expect(reopened.boxes.every(box => !box.checked)).toBe(true);
});
