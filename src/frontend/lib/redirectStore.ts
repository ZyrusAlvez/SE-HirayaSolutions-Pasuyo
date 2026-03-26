let pendingRedirect: string | null = null;

export const setPendingRedirect = (path: string) => { pendingRedirect = path; };
export const consumePendingRedirect = () => { const r = pendingRedirect; pendingRedirect = null; return r; };
