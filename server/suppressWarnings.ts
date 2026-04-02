const originalWarn = console.warn;
console.warn = function(...args: any[]) {
  const message = args[0]?.toString() || '';
  if (message.includes('PostCSS plugin') && message.includes('from')) {
    return;
  }
  originalWarn.apply(console, args);
};
