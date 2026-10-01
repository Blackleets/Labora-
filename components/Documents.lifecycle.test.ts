import { describe, expect, it, vi } from 'vitest';
import { createHookHarness, elementText, findElement } from '../services/testHookHarness';
import { UserRole } from '../types';

const prepared = { name: 'qa.pdf', dataUrl: 'data:application/pdf;base64,AA==', mimeType: 'application/pdf', sizeBytes: 1, contentHash: 'hash' };
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const setup = () => {
  const tasks: Array<{ resolve: (value: unknown) => void; signal: AbortSignal }> = [];
  let actor = { id: 'A', role: UserRole.RIDER, name: 'QA' };
  const addDocument = vi.fn(() => ({ id: 'doc', userId: actor.id })); const notice = vi.fn();
  const data = () => ({ currentUser: actor, documents: [], expenses: [], incomes: [], declarations: [], users: [], getFiscalSummary: () => null, addDocument, deleteIncome: vi.fn(), deleteDocument: vi.fn(), showNotification: notice });
  const harness = createHookHarness('components/Documents.tsx', {
    'lucide-react': new Proxy({}, { get: (_target, key) => key }),
    '../contexts/DataContext': { useData: data },
    '../services/deleteEligibility': {}, '../types': { UserRole },
    '../services/documentPreparation': { prepareDocumentFile: (_file: unknown, signal: AbortSignal) => new Promise(resolve => tasks.push({ resolve, signal })) }
  });
  harness.render();
  const render = () => harness.render();
  const open = () => {
    const button = findElement(render(), node => node.type === 'button' && elementText(node).trim() === 'Subir');
    if (!button) throw new Error('Upload action missing'); button.props.onClick();
  };
  const select = () => findElement(render(), node => node.type === 'input' && node.props.type === 'file').props.onChange({ target: { files: [{}], value: 'selected' } });
  const cancel = () => findElement(render(), node => node.type === 'button' && elementText(node) === 'Cancelar').props.onClick();
  return { render, open, select, cancel, tasks, addDocument, notice, unmount: harness.unmount, setActor: (id: string) => { actor = { ...actor, id }; render(); } };
};

describe('Documents actual handler lifecycle', () => {
  it('cancel/reopen cannot resurrect a prepared attachment from an old read', async () => {
    const ui = setup(); ui.open(); ui.select(); ui.cancel(); ui.open();
    expect(ui.tasks[0].signal.aborted).toBe(true);
    ui.tasks[0].resolve(prepared); await flush();
    expect(findElement(ui.render(), n => n.type === 'button' && n.props.type === 'submit').props.disabled).toBe(true);
    expect(ui.notice).not.toHaveBeenCalled(); expect(ui.addDocument).not.toHaveBeenCalled();
  });
  it('an old read cannot replace a newer attachment or clear its loading state', async () => {
    const ui = setup(); ui.open(); ui.select(); ui.select();
    ui.tasks[0].resolve(prepared); await flush();
    expect(findElement(ui.render(), n => n.type === 'button' && n.props.type === 'submit').props.disabled).toBe(true);
    ui.tasks[1].resolve({ ...prepared, name: 'second.pdf' }); await flush();
    expect(findElement(ui.render(), n => n.type === 'input' && n.props.id === 'labora-doc-name').props.value).toBe('second.pdf');
    expect(ui.notice).toHaveBeenCalledOnce();
  });
  it('a session change closes the form and ignores an old result', async () => {
    const ui = setup(); ui.open(); ui.select(); ui.setActor('B');
    ui.tasks[0].resolve(prepared); await flush();
    expect(findElement(ui.render(), n => n.type === 'form')).toBeUndefined(); expect(ui.tasks[0].signal.aborted).toBe(true);
    expect(ui.notice).not.toHaveBeenCalled();
  });
  it('leaving Documents invalidates the read without a success notification', async () => {
    const ui = setup(); ui.open(); ui.select(); ui.unmount(); ui.tasks[0].resolve(prepared); await flush();
    expect(ui.tasks[0].signal.aborted).toBe(true); expect(ui.notice).not.toHaveBeenCalled();
  });
  it('a failed save preserves the prepared file, chosen name and open form', async () => {
    const ui = setup(); ui.open(); ui.select(); ui.tasks[0].resolve(prepared); await flush();
    ui.addDocument.mockReturnValueOnce(undefined as any);
    findElement(ui.render(), n => n.type === 'form').props.onSubmit({ preventDefault: vi.fn() });
    const tree = ui.render(); expect(findElement(tree, n => n.type === 'input' && n.props.id === 'labora-doc-name').props.value).toBe('qa.pdf');
    expect(findElement(tree, n => n.type === 'button' && n.props.type === 'submit').props.disabled).toBe(false);
    expect(elementText(tree)).toContain('Conservamos el archivo');
  });
});
