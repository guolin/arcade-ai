import { parseArgs as nodeParseArgs } from 'node:util';

const COMMANDS = { init: 'init', dev: 'dev', check: 'check' };

export function parseArgs(argv) {
  const { values, positionals } = nodeParseArgs({
    args: argv,
    allowPositionals: true,
    strict: false,
    options: {
      tool: { type: 'string' },
      port: { type: 'string' },
      url: { type: 'string' },
    },
  });
  const [command, ...rest] = positionals;
  return { command, positionals: rest, options: values };
}

const HELP = `arcade-ai (aca)
用法:
  aca init [dir] [--tool claude|trae|agents]   起脚手架
  aca dev  [--port 8080]                        起本地 studio
  aca check [--url <makecode-url>]              自检 postMessage 协议`;

export async function run(argv) {
  const { command, positionals, options } = parseArgs(argv);
  if (!command) { console.log(HELP); return 0; }
  if (!COMMANDS[command]) { console.error(`未知命令: ${command}\n\n${HELP}`); return 1; }
  const mod = await import(`./commands/${command}.js`);
  return mod.default({ positionals, options });
}
