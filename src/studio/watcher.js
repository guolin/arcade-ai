import chokidar from 'chokidar';

export function createWatcher(gameDir, onChange) {
  let pausedUntil = 0;
  let timer = null;
  const watcher = chokidar.watch(gameDir, { ignoreInitial: true, ignored: /\.aca-status$/ });
  const fire = () => {
    if (Date.now() < pausedUntil) return;
    clearTimeout(timer);
    timer = setTimeout(() => { if (Date.now() >= pausedUntil) onChange(); }, 200);
  };
  watcher.on('add', fire).on('change', fire);
  return {
    pause(ms) { pausedUntil = Date.now() + ms; },
    async close() { clearTimeout(timer); await watcher.close(); },
  };
}
