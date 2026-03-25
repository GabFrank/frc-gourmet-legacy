import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';

let app: ElectronApplication;
let page: Page;

const rootDir = path.resolve(__dirname, '..');

test.beforeAll(async () => {
  // Remover ELECTRON_RUN_AS_NODE (puesto por VSCode/Cursor) para que Electron
  // se ejecute como app y no como Node puro
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;

  // --remote-debugging-port=0 debe ir PRIMERO porque el loader de Playwright
  // hace splice de argv hasta este flag, y si va al final remueve --serve
  app = await electron.launch({
    args: ['--remote-debugging-port=0', rootDir, '--serve'],
    env,
  });

  // La primera ventana suele ser DevTools, esperamos a la ventana de la app
  const firstWindow = await app.firstWindow();

  // Buscar la ventana que carga localhost:4201 (no DevTools)
  let appWindow = app.windows().find(w => w.url().includes('localhost:4201'));

  if (!appWindow) {
    // Si aún no se abrió, esperar el evento de nueva ventana
    appWindow = await app.waitForEvent('window', {
      predicate: (w) => w.url().includes('localhost') || !w.url().startsWith('devtools://'),
      timeout: 30000,
    });
  }

  page = appWindow;
  await page.waitForLoadState('domcontentloaded');
});

test.afterAll(async () => {
  if (app) {
    await app.close();
  }
});

test('la app se abre correctamente', async () => {
  const title = await page.title();
  console.log('Título de la ventana:', title);
  console.log('URL:', page.url());

  const isVisible = await app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0];
    return win.isVisible();
  });
  expect(isVisible).toBe(true);
});

test('la ventana tiene dimensiones correctas', async () => {
  const { width, height } = await app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0];
    const [w, h] = win.getSize();
    return { width: w, height: h };
  });

  expect(width).toBeGreaterThan(800);
  expect(height).toBeGreaterThan(600);
  console.log(`Dimensiones: ${width}x${height}`);
});

test('screenshot de la app', async () => {
  // Dar tiempo a que Angular renderice completamente
  await page.waitForTimeout(5000);

  await page.screenshot({ path: 'e2e/screenshots/app-home.png', fullPage: true });
  console.log('Screenshot guardado en e2e/screenshots/app-home.png');
});
