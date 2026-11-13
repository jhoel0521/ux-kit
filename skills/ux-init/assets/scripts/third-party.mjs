// ux-kit · third-party.mjs — recognise libraries copied into a project by hand (not installed by a package manager),
// so detect.mjs and scan.mjs don't treat Bootstrap, jQuery UI or W3.CSS copies as the team's own code.
// Two signals: a library folder in the path, or a library banner at the top of the file (name + version + license/URL).

const LIBRARY_DIR = /^(?:jquery-ui[\w.-]*|bootstrap[\d.-]*|third[-_]?party|bower_components|font-?awesome[\w.-]*)$/i;
const BANNER = /^﻿?\s*\/\*[!*]?[^]{0,300}?\bv?\d+\.\d+(?:\.\d+)?\b[^]{0,300}?(?:licen[cs]e|copyright|\(c\)|https?:\/\/|\bby\s+[A-Z])/i;

// rel: path relative to the project, with "/". head: the first characters of the file ('' for folders).
export function thirdPartyReason(rel, head = '') {
  const dir = rel.split('/').slice(0, -1).find((s) => LIBRARY_DIR.test(s));
  if (dir) return `library folder ${dir}/`;
  if (BANNER.test(head.slice(0, 700))) return 'library banner (name, version, license)';
  return null;
}

// A folder that is itself a copied library (its manifest is the library's, e.g. Views/jquery-ui/package.json).
export const isLibraryFolder = (rel) => rel.split('/').some((s) => LIBRARY_DIR.test(s));
