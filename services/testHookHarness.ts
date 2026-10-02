// Executes component handlers/effects in Node; this is not a browser/visual test.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

export const createHookHarness = (path: string, modules: Record<string, unknown>, globals: Record<string, unknown> = {}, exportName = 'default') => {
  let cursor = 0;
  const slots: any[] = [];
  let effects: Array<() => void> = [];
  const same = (a?: unknown[], b?: unknown[]) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const element = (type: unknown, props: any, ...children: unknown[]) => ({ type, props: { ...props, ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}) } });
  const runtime = {
    createElement: element,
    useState: (initial: any) => {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial, set: (value: any) => { slots[index].value = typeof value === 'function' ? value(slots[index].value) : value; } };
      return [slots[index].value, slots[index].set];
    },
    useRef: (initial: any) => { const index = cursor++; return slots[index] ||= { current: initial }; },
    useMemo: (fn: () => unknown, deps: unknown[]) => {
      const index = cursor++;
      if (!same(slots[index]?.deps, deps)) slots[index] = { value: fn(), deps };
      return slots[index].value;
    },
    useEffect: (fn: () => (() => void) | void, deps?: unknown[]) => {
      const index = cursor++;
      if (!same(slots[index]?.deps, deps)) {
        const previous = slots[index];
        slots[index] = { deps, cleanup: previous?.cleanup };
        effects.push(() => { previous?.cleanup?.(); slots[index].cleanup = fn(); });
      }
    }
  };
  const output = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText;
  const exports: any = {};
  vm.runInNewContext(output, { exports, AbortController, DOMException, Error, console, ...globals, require: (name: string) => {
    if (name === 'react') return { default: runtime, ...runtime };
    if (!(name in modules)) throw new Error(`Missing test dependency: ${name}`);
    return modules[name];
  } });
  const component = exports[exportName] || exports.default || exports.Documents;
  return {
    render: (props: Record<string, unknown> = {}) => { cursor = 0; effects = []; const tree = component(props); const pending = effects; effects = []; pending.forEach(fn => fn()); return tree; },
    unmount: () => slots.forEach(slot => slot?.cleanup?.())
  };
};

export const findElement = (tree: any, predicate: (node: any) => boolean): any => {
  if (Array.isArray(tree)) { for (const item of tree) { const match = findElement(item, predicate); if (match) return match; } return; }
  if (!tree || typeof tree !== 'object') return;
  if (predicate(tree)) return tree;
  return findElement(tree.props?.children, predicate);
};
export const elementText = (node: any): string => Array.isArray(node) ? node.map(elementText).join('') : typeof node === 'string' ? node : node && typeof node === 'object' ? elementText(node.props?.children) : '';
