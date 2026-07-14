import { writeFile } from 'node:fs/promises'

const [debugPort, outputDir] = process.argv.slice(2)
const appUrl = 'http://127.0.0.1:5174/'
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()
const page = targets.find((entry) => entry.type === 'page')
if (!page) throw new Error('No Chrome page target found')

const socket = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

let nextId = 1
const pending = new Map()
const errors = []
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push(message.params.entry.text)
  if (!message.id || !pending.has(message.id)) return
  const handlers = pending.get(message.id)
  pending.delete(message.id)
  if (message.error) handlers.reject(new Error(message.error.message))
  else handlers.resolve(message.result)
})

function send(method, params = {}) {
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result.value
}

async function navigate(width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true })
  await send('Page.navigate', { url: appUrl })
  await wait(900)
}

async function screenshot(name) {
  const result = await send('Page.captureScreenshot', { format: 'png', fromSurface: true })
  await writeFile(`${outputDir}/${name}`, Buffer.from(result.data, 'base64'))
}

const helpers = `
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const clickButton = (text) => {
    const button = [...document.querySelectorAll('button')]
      .find((item) => (
        item.getAttribute('aria-label')?.includes(text)
        || item.textContent.replace(/\\s+/g, ' ').trim().includes(text)
      ));
    if (!button) throw new Error('Button not found: ' + text);
    button.click();
  };
  const dispatchStroke = async (points) => {
    const canvas = document.querySelector('canvas.drawing-canvas');
    const rect = canvas.getBoundingClientRect();
    const base = { bubbles: true, cancelable: true, pointerId: 77, pointerType: 'pen', isPrimary: true, pressure: .55 };
    const emit = (type, point) => canvas.dispatchEvent(new PointerEvent(type, {
      ...base,
      clientX: rect.left + point.x,
      clientY: rect.top + point.y,
    }));
    emit('pointerdown', points[0]);
    points.slice(1).forEach((point) => emit('pointermove', point));
    emit('pointerup', points.at(-1));
    await pause(25);
  };
  const activePathPoints = (fraction = .78, samples = 34) => {
    const active = document.querySelector('.stroke-start-active');
    const index = Math.max(0, Number(active?.textContent ?? 1) - 1);
    const path = document.querySelectorAll('.trace-path-dash')[index];
    if (!path) throw new Error('Active trace path not found at index ' + index);
    const canvas = document.querySelector('canvas.drawing-canvas');
    const rect = canvas.getBoundingClientRect();
    const width = rect.width * .84;
    const height = rect.height * .79;
    const scale = Math.min(width / 400, height / 400);
    const left = rect.width * .08 + (width - 400 * scale) / 2;
    const top = rect.height * .09 + (height - 400 * scale) / 2;
    const length = path.getTotalLength();
    return Array.from({ length: samples }, (_, sample) => {
      const point = path.getPointAtLength(length * fraction * sample / (samples - 1));
      return { x: left + point.x * scale, y: top + point.y * scale };
    });
  };
`

await send('Page.enable')
await send('Runtime.enable')
await send('Log.enable')

await navigate(1180, 820)
const interaction = await evaluate(`(async () => {
  ${helpers}
  clickButton('注音學習');
  await pause(80);
  clickButton('ㄉ');
  await pause(80);

  const canvas = document.querySelector('canvas.drawing-canvas');
  const firstPathPoint = activePathPoints(.01, 2)[0];
  await dispatchStroke([firstPathPoint]);
  const tap = {
    instruction: document.querySelector('.stroke-instruction').textContent.trim(),
    activeStroke: document.querySelector('.stroke-start-active')?.textContent,
    progress: Number(canvas.dataset.traceProgress),
    required: Number(canvas.dataset.traceRequired),
  };

  await dispatchStroke([{ x: 8, y: 8 }, { x: 100, y: 8 }, { x: 210, y: 8 }]);
  const outside = {
    instruction: document.querySelector('.stroke-instruction').textContent.trim(),
    activeStroke: document.querySelector('.stroke-start-active')?.textContent,
    progress: Number(canvas.dataset.traceProgress),
  };

  await dispatchStroke(activePathPoints());
  const validTrace = {
    instruction: document.querySelector('.stroke-instruction').textContent.trim(),
    activeStroke: document.querySelector('.stroke-start-active')?.textContent,
  };

  const buttons = [...document.querySelectorAll('.practice-action-bar button')]
    .map((button) => ({ text: button.textContent.trim(), rect: button.getBoundingClientRect().toJSON() }));
  return {
    tap,
    outside,
    validTrace,
    buttons,
    buttonsInsideViewport: buttons.every(({ rect }) => rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight),
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    verticalOverflow: document.documentElement.scrollHeight > innerHeight,
    touchAction: getComputedStyle(canvas).touchAction,
  };
})()`)
await screenshot('qa-ipad-landscape.png')

await navigate(1180, 820)
const fullZhuyin = await evaluate(`(async () => {
  ${helpers}
  clickButton('注音學習');
  await pause(60);
  const completed = [];
  for (let itemIndex = 0; itemIndex < 37; itemIndex++) {
    const word = document.querySelector('.word-name')?.textContent?.trim();
    const strokeCount = document.querySelectorAll('.stroke-hint-group').length;
    const strokeResults = [];
    for (let stroke = 0; stroke < strokeCount; stroke++) {
      await dispatchStroke(activePathPoints(.82, 38));
      const canvas = document.querySelector('canvas.drawing-canvas');
      strokeResults.push({
        stroke,
        activeAfter: document.querySelector('.stroke-start-active')?.textContent,
        progress: Number(canvas.dataset.traceProgress),
        required: Number(canvas.dataset.traceRequired),
        instruction: document.querySelector('.stroke-instruction').textContent.trim(),
      });
    }
    const done = document.querySelector('.stroke-instruction').textContent.includes('描寫完成');
    completed.push({ itemIndex, word, strokeCount, done, strokeResults });
    if (itemIndex < 36) {
      clickButton('下一題');
      await pause(20);
    }
  }
  return { count: completed.length, failed: completed.filter((item) => !item.done) };
})()`)

await navigate(1180, 820)
const numberTap = await evaluate(`(async () => {
  ${helpers}
  clickButton('數字學習');
  await pause(60);
  const canvas = document.querySelector('canvas.drawing-canvas');
  const rect = canvas.getBoundingClientRect();
  await dispatchStroke([{ x: rect.width * .5, y: rect.height * .5 }]);
  const afterTap = document.querySelector('.stroke-instruction').textContent.trim();
  await dispatchStroke(Array.from({ length: 20 }, (_, i) => ({
    x: rect.width * (.35 + i * .018),
    y: rect.height * (.35 + i * .012),
  })));
  return {
    afterTap,
    afterDrag: document.querySelector('.stroke-instruction').textContent.trim(),
  };
})()`)

await navigate(1180, 820)
const fullNumber = await evaluate(`(async () => {
  ${helpers}
  clickButton('數字學習');
  await pause(60);

  const initialVisible = [...document.querySelectorAll('.number-side-picker .picker-button')]
    .map((button) => button.textContent.trim());
  const canvas = document.querySelector('canvas.drawing-canvas');
  const rect = canvas.getBoundingClientRect();
  await dispatchStroke([{ x: 8, y: 8 }, { x: rect.width - 8, y: rect.height - 8 }]);
  const invalidTrace = {
    instruction: document.querySelector('.stroke-instruction').textContent.trim(),
    activeStroke: document.querySelector('.stroke-start-active')?.textContent,
    progress: Number(canvas.dataset.traceProgress),
  };

  const completed = [];
  for (let digit = 0; digit <= 9; digit++) {
    const strokeCount = document.querySelectorAll('.stroke-hint-group').length;
    for (let stroke = 0; stroke < strokeCount; stroke++) {
      await dispatchStroke(activePathPoints(.82, 42));
    }
    completed.push({
      digit,
      strokeCount,
      pathCount: document.querySelectorAll('.trace-path-dash').length,
      done: document.querySelector('.stroke-instruction').textContent.includes('描寫完成'),
    });
    if (digit < 9) {
      clickButton('下一題');
      await pause(35);
    }
  }

  const finalVisible = [...document.querySelectorAll('.number-side-picker .picker-button')]
    .map((button) => button.textContent.trim());
  const apples = document.querySelector('[aria-label="9 顆蘋果"]');
  const actionButtons = [...document.querySelectorAll('.practice-action-bar button')]
    .map((button) => button.getBoundingClientRect().toJSON());

  return {
    initialVisible,
    finalVisible,
    invalidTrace,
    completed,
    failed: completed.filter((item) => !item.done || item.strokeCount !== item.pathCount),
    appleCount: apples?.querySelectorAll('span').length ?? 0,
    buttonsInsideViewport: actionButtons.every((buttonRect) => (
      buttonRect.left >= 0
      && buttonRect.right <= innerWidth
      && buttonRect.top >= 0
      && buttonRect.bottom <= innerHeight
    )),
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    verticalOverflow: document.documentElement.scrollHeight > innerHeight,
    touchAction: getComputedStyle(document.querySelector('canvas.drawing-canvas')).touchAction,
  };
})()`)
await screenshot('qa-number-0-9.png')

await navigate(1180, 820)
await evaluate(`(async () => {
  ${helpers}
  clickButton('數字學習');
  await pause(60);
  document.querySelector('[aria-label="下一組數字"]')?.click();
  await pause(45);
  clickButton('9');
  await pause(350);
})()`)
await screenshot('qa-number-guide-9.png')

await navigate(820, 1180)
const portrait = await evaluate(`(() => ({
  horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
  viewport: { width: innerWidth, height: innerHeight },
}))()`)

console.log(JSON.stringify({ interaction, fullZhuyin, numberTap, fullNumber, portrait, errors }, null, 2))
socket.close()
