import * as path from 'path';

/**
 * From a controller .java path, return where its sibling .http should live.
 *
 * Rule: replace the nearest `src/main/java` segment with `src/main/resources`,
 * drop the package path, and emit `{ControllerClassName}.http` directly in that
 * resources root. Falls back to placing the file next to the .java if no
 * `src/main/java` segment exists.
 */
export function resolveHttpFilePath(controllerJavaPath: string, className: string): string {
  const norm = controllerJavaPath.split(path.sep).join('/');
  const idx = norm.indexOf('/src/main/java/');
  if (idx >= 0) {
    const resourcesRoot = norm.slice(0, idx) + '/src/main/resources';
    return path.normalize(path.join(resourcesRoot, `${className}.http`));
  }
  return path.normalize(path.join(path.dirname(controllerJavaPath), `${className}.http`));
}
