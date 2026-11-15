import './style.css';

const topics = Object.freeze([
  {id: 'desktop', title: 'Desktop', heading: 'Use your desktop', paragraphs: [
    'Open APPs to launch an application. Each window keeps its own state.',
    'Drag a title bar to move a window, or its lower corner to resize it. Minimize keeps the application open; choose its task button to restore it.',
    'Use the numbered workspace buttons to switch workspaces. Save or discard document changes before closing an editor or signing out.'
  ]},
  {id: 'files', title: 'Account files', heading: 'Your account files', paragraphs: [
    'Sign in to access your account files. Files can create folders, upload, rename, move, download and delete files.',
    'A save is confirmed when the server acknowledges it. Sign into the same account in another browser to retrieve confirmed files.',
    'If a file changed elsewhere, refresh Files before opening it. Keep unsaved edits in the editor when a save reports a conflict.'
  ]},
  {id: 'documents', title: 'Documents', heading: 'Edit and save', paragraphs: [
    'Open a text file from Files to edit it in Text. Use WordCraft for formatted documents, including headings and lists.',
    'Save updates the opened account file. Save As creates a separate account file; choose a new path or name. PDF export creates a separate PDF.',
    'Wait for the account-save confirmation before closing. If a save fails, keep the editor open and review the message. Closing Files leaves document editors open.'
  ]}
]);

/** A static system guide, with one per-window state and one authorized operation path. */
export function mount({instanceId, sessionId, authority, authorize, signal}) {
  if (!instanceId || !sessionId || typeof authorize !== 'function') throw TypeError('Explicit Help instance, session and authorization required.');
  const element = document.createElement('div'), nav = document.createElement('nav'), content = document.createElement('article'), status = document.createElement('p');
  element.className = 'webos-help'; nav.setAttribute('aria-label', 'Help topics'); status.className = 'webos-help-status'; status.setAttribute('role', 'status');
  const events = new AbortController(), buttons = new Map(); let selected = 'desktop', disposed = false;
  const check = () => { if (disposed || signal?.aborted) throw new DOMException('Help view closed.', 'AbortError'); };
  const inspect = () => Object.freeze({instanceId, sessionId, resource: null, selected, disposed, topics: topics.map(({id, title}) => ({id, title}))});
  function render() {
    const topic = topics.find(value => value.id === selected), heading = document.createElement('h2'); heading.textContent = topic.heading;
    const paragraphs = topic.paragraphs.map(text => { const p = document.createElement('p'); p.textContent = text; return p; });
    content.replaceChildren(heading, ...paragraphs); content.dataset.topic = selected;
    for (const [id, button] of buttons) button.setAttribute('aria-pressed', String(id === selected));
  }
  async function execute(request, caller) {
    check();
    if (caller === undefined || caller === null) throw Error('Explicit Help caller required.');
    if (request?.instanceId !== instanceId || request.sessionId !== sessionId || request.resource !== null || !['select', 'inspect'].includes(request.operation)) throw Error('Exact Help instance, session and resource target required.');
    const operation = request.operation, section = operation === 'select' ? request.args?.section : selected;
    if (!topics.some(topic => topic.id === section)) throw TypeError('Unknown Help topic.');
    if (await authorize(caller, Object.freeze({instanceId, sessionId, resource: null, operation, section})) !== true) throw Error('Help operation denied.');
    check();
    if (operation === 'inspect' && selected !== section) throw Error('Help topic changed while authorization was pending.');
    if (operation === 'select') { selected = section; render(); }
    const topic = topics.find(value => value.id === section);
    return {...inspect(), topic: structuredClone(topic)};
  }
  for (const topic of topics) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = topic.title; button.dataset.topic = topic.id;
    button.addEventListener('click', () => execute({instanceId, sessionId, resource: null, operation: 'select', args: {section: topic.id}}, authority).catch(error => { if (!disposed) status.textContent = error.message; }), {signal: events.signal});
    buttons.set(topic.id, button); nav.append(button);
  }
  function dispose() { if (disposed) return; disposed = true; events.abort(); signal?.removeEventListener('abort', dispose); element.remove(); }
  element.append(nav, content, status); render(); signal?.addEventListener('abort', dispose, {once: true}); if (signal?.aborted) dispose();
  return Object.freeze({element, inspect, execute, dispose, ready: Promise.resolve()});
}
