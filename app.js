
const SID4 = '0211';
const STORAGE_KEY = `focustasks_${SID4}`;


function createStore(storageKey) {
 
  let state = [];

 
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) state = JSON.parse(raw) || [];
  } catch (e) {
    state = [];
  }

  function persist() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function list() {
   
    return state.map(item => ({ ...item }));
  }

  function add(item) {
    
    state = state.concat([{ id: item.id, title: item.title, done: !!item.done }]);
    persist();
    return list();
  }

  function toggle(id) {
    // Use map only for transform (no for/while/forEach)
    state = state.map(t => (t.id === id ? { ...t, done: !t.done } : t));
    persist();
    return list();
  }

  function remove(id) {
   
    state = state.filter(t => t.id !== id);
    persist();
    return list();
  }

  return { add, toggle, remove, list };
}

/* Create the store instance (store doesn't expose internal array) */
const store = createStore(STORAGE_KEY);


function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


const analyticsEl = document.getElementById('analytics');
const addForm = document.getElementById('add-form');
const inputEl = document.getElementById('task-input');
const errorEl = document.getElementById('error');
const listsWrapper = document.getElementById('lists-wrapper');
const activeListEl = document.getElementById('active-list');
const doneListEl = document.getElementById('done-list');


function makeId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}
function isBlank(s) {
  return !s || s.trim().length === 0;
}
function showError(msg) {
  errorEl.textContent = msg || '';
}
function clearError() {
  errorEl.textContent = '';
}


function summarize(tasks) {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const active = total - done;
  const pct = total === 0 ? 0 : Math.round((done / total) * 1000) / 10;
  return { active, done, pct };
}


function createTaskListItem(task) {
  const li = document.createElement('li');
  li.dataset.id = task.id;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-toggle';
  checkbox.checked = !!task.done;
  checkbox.setAttribute('aria-label', task.title);

  const span = document.createElement('span');
  span.className = 'task-title';
  
  span.textContent = task.title;

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'task-delete';
  del.textContent = 'Delete';

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(del);

  return li;
}

function buildFragment(items) {
 
  return items
    .map(createTaskListItem)
    .reduce((frag, node) => {
      frag.appendChild(node);
      return frag;
    }, document.createDocumentFragment());
}


function rerender() {
  const tasks = store.list();
  const { active, done, pct } = summarize(tasks);
  analyticsEl.textContent = `Active: ${active} · Done: ${done} · Done %: ${pct.toFixed(1)}%`;

  const activeTasks = tasks.filter(t => !t.done);
  const doneTasks = tasks.filter(t => t.done);

  const activeFrag = buildFragment(activeTasks);
  const doneFrag = buildFragment(doneTasks);

  activeListEl.replaceChildren();
  activeListEl.appendChild(activeFrag);

  doneListEl.replaceChildren();
  doneListEl.appendChild(doneFrag);
}


addForm.addEventListener('submit', function (ev) {
  ev.preventDefault();
  const raw = inputEl.value;
  if (isBlank(raw)) {
    showError('Please enter a non-empty task title.');
    return;
  }
  const title = raw.trim();
  const id = makeId();
  // add to store, then rerender
  store.add({ id, title, done: false });
  inputEl.value = '';
  clearError();
  rerender();
});


listsWrapper.addEventListener('click', function (ev) {
  const target = ev.target;

  
  if (target.matches('button.task-delete')) {
    const li = target.closest('li');
    if (!li) return;
    const id = li.dataset.id;
    store.remove(id);
    rerender();
    return;
  }

  if (target.matches('input.task-toggle')) {
    const li = target.closest('li');
    if (!li) return;
    const id = li.dataset.id;
    store.toggle(id);
    rerender();
    return;
  }
});


listsWrapper.addEventListener('change', function (ev) {
  const target = ev.target;
  if (target.matches('input.task-toggle')) {
    const li = target.closest('li');
    if (!li) return;
    const id = li.dataset.id;
    store.toggle(id);
    rerender();
  }
});


document.addEventListener('DOMContentLoaded', function () {
  // sanity: ensure SID4 appears in title (minimal check)
  const titleEl = document.getElementById('app-title');
  if (titleEl && !titleEl.textContent.includes(SID4)) {
    titleEl.textContent = `FocusTasks ${SID4}`;
  }
  rerender();
});

