import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

class Element extends EventTarget {
  children = []; dataset = {}; attributes = new Map();
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  remove() {}
}
async function fixture(policy) {
  const authority = {}, decisions = [], context = vm.createContext({document: {createElement: () => new Element()}, AbortController, DOMException, structuredClone});
  const module = new vm.SourceTextModule(await readFile(new URL('../webos/index.mjs', import.meta.url), 'utf8'), {context});
  await module.link(name => {assert.equal(name, './style.css'); return new vm.SyntheticModule([], () => {}, {context});}); await module.evaluate();
  const mount = id => module.namespace.mount({instanceId: id, sessionId: 'session-1', authority,
    authorize: (caller, request) => { decisions.push(request); return policy ? policy(caller, request, authority) : caller === authority; }});
  const view = mount('help-1');
  const request = (operation, section) => ({instanceId: 'help-1', sessionId: 'session-1', resource: null, operation, args: {section}});
  return {view, mount, authority, decisions, request};
}

test('mouse control and explicit command use the same selected topic', async t => {
  const f = await fixture(); t.after(() => f.view.dispose());
  const button = f.view.element.children[0].children.find(node => node.dataset.topic === 'files');
  button.dispatchEvent(new Event('click')); await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.view.inspect().selected, 'files'); assert.equal(f.decisions[0].operation, 'select');
  const state = await f.view.execute(f.request('inspect'), f.authority);
  assert.equal(state.topic.id, 'files'); assert.equal(f.view.element.children[1].dataset.topic, state.topic.id);
});

test('missing credentials, wrong target and denied caller cannot select a topic', async t => {
  const f = await fixture(); t.after(() => f.view.dispose());
  await assert.rejects(f.view.execute(f.request('select', 'files')), /caller/i);
  await assert.rejects(f.view.execute(f.request('select', 'files'), {}), /denied/i);
  await assert.rejects(f.view.execute({...f.request('select', 'files'), instanceId: 'help-other'}, f.authority), /target/i);
  await assert.rejects(f.view.execute({...f.request('select', 'files'), sessionId: 'other-session'}, f.authority), /target/i);
  await assert.rejects(f.view.execute({...f.request('select', 'files'), resource: 'other'}, f.authority), /target/i);
  assert.equal(f.view.inspect().selected, 'desktop');
});

test('two Help instances retain independent selections', async t => {
  const f = await fixture(), other = f.mount('help-2'); t.after(() => { f.view.dispose(); other.dispose(); });
  await f.view.execute(f.request('select', 'documents'), f.authority);
  assert.equal(f.view.inspect().selected, 'documents'); assert.equal(other.inspect().selected, 'desktop');
  f.view.dispose(); assert.equal(other.inspect().disposed, false);
});

test('pending authorization cannot be retargeted by changing caller arguments', async t => {
  let approve, entered; const waiting = new Promise(resolve => { entered = resolve; });
  const f = await fixture(async () => { entered(); return new Promise(resolve => { approve = resolve; }); }); t.after(() => f.view.dispose());
  const request = f.request('select', 'files'), pending = f.view.execute(request, f.authority); await waiting;
  request.args.section = 'documents'; approve(true); const state = await pending;
  assert.equal(state.selected, 'files'); assert.equal(state.topic.id, 'files');
});

test('disposal cancels pending commands and detaches the buttons', async () => {
  let approve, entered; const waiting = new Promise(resolve => { entered = resolve; });
  const f = await fixture(async () => { entered(); return new Promise(resolve => { approve = resolve; }); });
  const pending = f.view.execute(f.request('select', 'files'), f.authority); await waiting;
  f.view.dispose(); approve(true); await assert.rejects(pending, error => error.name === 'AbortError');
  const decisions = f.decisions.length;
  f.view.element.children[0].children[1].dispatchEvent(new Event('click')); await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.decisions.length, decisions); assert.equal(f.view.inspect().selected, 'desktop');
});
