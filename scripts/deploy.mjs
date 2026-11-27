import { randomUUID } from 'node:crypto';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { once } from 'node:events';

const host = process.env.DEPLOY_HOST;
const base = '/genealogy';
const dist = '.next-deploy';
const stageOnly = process.argv.includes('--stage');
const sshOptions = ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10'];
const shellQuote = (value) => "'" + value.replaceAll("'", "'\"'\"'") + "'";

function successfulExit(child, name) {
  return once(child, 'close').then(([code, signal]) => {
    if (code !== 0) throw new Error(`${name} exited with ${code ?? signal}`);
  });
}

async function deploy() {
  if (!host || host.startsWith('-')) throw new Error('Set DEPLOY_HOST=user@host');
  if (!process.argv.includes('--dirty') &&
      execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()) {
    throw new Error('Commit the changes or pass --dirty to deploy the working tree');
  }
  const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  const release = `${new Date().toISOString().replace(/[^\d]/g, '')}-${commit}-${randomUUID().slice(0, 8)}`;

  rmSync(dist, { recursive: true, force: true });
  const prebuild = spawnSync(process.execPath, ['scripts/build-avatar-crops.mjs'], { stdio: 'inherit' });
  if (prebuild.error) throw prebuild.error;
  if (prebuild.status !== 0) throw new Error('Avatar crop build failed');
  const build = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
    stdio: 'inherit',
    env: { ...process.env, NEXT_PUBLIC_BASE_PATH: base, NEXT_DIST_DIR: dist },
  });
  if (build.error) throw build.error;
  if (build.status !== 0) throw new Error('Production build failed');

  const standalone = join(dist, 'standalone');
  if (!existsSync(join(standalone, 'server.js'))) throw new Error('Missing standalone server');
  cpSync(join(dist, 'static'), join(standalone, dist, 'static'), { recursive: true });
  cpSync('public', join(standalone, 'public'), { recursive: true });

  const remote = [
    'set -euo pipefail',
    stageOnly ? 'root="$HOME/.local/share/genealogy"' : 'root=/srv/genealogy',
    stageOnly ? 'mkdir -p "$root/releases"' : 'test -w "$root/releases" || { echo "Run deploy/server-setup.sh on the server first" >&2; exit 1; }',
    'exec 9>"$root/.deploy.lock"',
    'flock 9',
    `release=${release}`,
    'rel="$root/releases/$release"',
    'mkdir "$rel"',
    'tar -xzf - -C "$rel"',
    'test -f "$rel/server.js"',
    'previous=$(readlink "$root/current" || true)',
    'activate() { ln -sfn "$1" "$root/.current.new"; mv -Tf "$root/.current.new" "$root/current"; }',
    'activate "releases/$release"',
    ...(stageOnly ? [] : [
      'restart() {',
      '  pid=$(systemctl show -p MainPID --value genealogy.service)',
      '  if [ "${pid:-0}" != 0 ]; then kill -TERM "$pid"; fi',
      '}',
      'health() {',
      '  for attempt in $(seq 1 20); do',
      '    active=$(systemctl show -p MainPID --value genealogy.service)',
      '    if [ "$active" != "${pid:-0}" ] && [ -n "$active" ] &&',
      '       [ "$(readlink "/proc/$active/cwd" || true)" = "$rel" ] &&',
      '       curl --max-time 2 -fsS -o /dev/null http://127.0.0.1:3122/genealogy/logo.jpg &&',
      '       curl --max-time 2 -fsS -o /dev/null http://127.0.0.1/genealogy/en; then return 0; fi',
      '    sleep 1',
      '  done',
      '  return 1',
      '}',
      'restart',
      'if ! health; then',
      '  if [ -n "$previous" ]; then activate "$previous"; restart; fi',
      '  echo "Health check failed. See journalctl -u genealogy.service" >&2',
      '  exit 1',
      'fi',
    ]),
  ].join('\n');

  // Environment files are never part of the release archive.
  const tar = spawn('tar', ['--exclude=.env*', '-czf', '-', '.'], { cwd: standalone, stdio: ['ignore', 'pipe', 'inherit'] });
  const ssh = spawn('ssh', [...sshOptions, host, `bash -c ${shellQuote(remote)}`], { stdio: ['pipe', 'inherit', 'inherit'] });
  await Promise.all([pipeline(tar.stdout, ssh.stdin), successfulExit(tar, 'tar'), successfulExit(ssh, 'ssh')]);
  console.log(stageOnly ? `Staged ${release} on ${host}` : `Deployed ${release} at ${base}`);
}

try {
  await deploy();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
