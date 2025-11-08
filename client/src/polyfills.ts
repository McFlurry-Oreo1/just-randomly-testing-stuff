
import { Buffer } from 'buffer';

// @ts-ignore
window.Buffer = Buffer;
// @ts-ignore
window.global = window;
// @ts-ignore
window.process = window.process || {};
// @ts-ignore
window.process.nextTick = window.process.nextTick || ((fn: Function, ...args: any[]) => {
  setTimeout(() => fn(...args), 0);
});
