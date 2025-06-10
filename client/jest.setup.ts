// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify({})),
  })
) as jest.Mock;


// You can add other global mocks or setup here if needed.
// For example, mocking navigation:
/*
jest.mock('wouter', () => ({
  ...jest.requireActual('wouter'), // import and retain default behavior
  useLocation: jest.fn(() => ['/', jest.fn()]), // Mock useLocation
  Link: jest.fn(({ children, href }) => <a href={href}>{children}</a>), // Mock Link
  Redirect: jest.fn(({ to }) => `Redirected to ${to}`), // Mock Redirect
}));
*/

console.log('Client Jest setup file loaded.');
