// ux-kit · is-main.mjs — true when a module is the script Node was started with.
// Compares real paths: skill installers link folders (symlinks, Windows junctions), and Node
// resolves the link in import.meta.url but keeps it in process.argv[1].
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function isMain(moduleUrl) {
  try { return realpathSync(fileURLToPath(moduleUrl)) === realpathSync(process.argv[1]); } catch { return false; }
}
