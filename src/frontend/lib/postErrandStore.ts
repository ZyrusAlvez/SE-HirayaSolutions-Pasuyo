type PostErrandResult = { expandId: string; tab: 'onsite' | 'remote' } | null;

let pending: PostErrandResult = null;

export const postErrandStore = {
  set: (val: PostErrandResult) => { pending = val; },
  consume: (): PostErrandResult => { const val = pending; pending = null; return val; },
};
