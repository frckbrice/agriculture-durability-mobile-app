jest.mock('expo-constants', () => ({ default: {} }));

import { CHAPTERS, HOME_MENU, NAV_THEME } from '../constants';

describe('constants', () => {
  describe('NAV_THEME', () => {
    it('has light and dark themes', () => {
      expect(NAV_THEME.light).toBeDefined();
      expect(NAV_THEME.dark).toBeDefined();
    });

    it('light theme has required keys', () => {
      expect(NAV_THEME.light).toMatchObject({
        background: expect.any(String),
        border: expect.any(String),
        primary: expect.any(String),
        text: expect.any(String),
      });
    });

    it('dark theme has required keys', () => {
      expect(NAV_THEME.dark).toMatchObject({
        background: expect.any(String),
        border: expect.any(String),
        primary: expect.any(String),
        text: expect.any(String),
      });
    });
  });

  describe('CHAPTERS', () => {
    it('is a non-empty array', () => {
      expect(Array.isArray(CHAPTERS)).toBe(true);
      expect(CHAPTERS.length).toBeGreaterThan(0);
    });

    it('each chapter has name, icon, and route', () => {
      CHAPTERS.forEach((chapter) => {
        expect(chapter).toHaveProperty('name');
        expect(chapter).toHaveProperty('icon');
        expect(chapter).toHaveProperty('route');
        expect(typeof chapter.name).toBe('string');
        expect(typeof chapter.route).toBe('string');
      });
    });
  });

  describe('HOME_MENU', () => {
    it('is a non-empty array', () => {
      expect(Array.isArray(HOME_MENU)).toBe(true);
      expect(HOME_MENU.length).toBeGreaterThan(0);
    });

    it('each item has name and icon', () => {
      HOME_MENU.forEach((item) => {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('icon');
      });
    });
  });
});
