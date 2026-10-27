/* ==========================================================================
   Iris client — one way to ask, for the Mac, the iPhone and Iris everywhere
   --------------------------------------------------------------------------
   With APP_CONFIG.IRIS_ENDPOINT set (a deployed api/iris.js), a language
   model answers any question, grounded in the whole info bank, the passages
   found here and what the visitor is looking at. Without it — or when it's
   busy or out of free-tier tokens — the in-browser engine answers
   (js/apps/iris-brain.js). Sources always come from the local index.

   When the visitor asks to open something, the answer carries an action:
   { app, target } with `app` from a fixed list and `target` a name to look
   up (a project, a place). Each version decides how to run it.
   ========================================================================== */

window.IrisClient = (() => {
    const APPS = new Set(['about', 'resume', 'projects', 'maps', 'mail', 'photos', 'notes', 'music', 'camera', 'games', 'weather', 'settings']);
    const DEICTIC = /\b(this|that|it|these|here|this one|that one)\b/i;

    /** "What does this do?" while looking at a project means that project. */
    function withSubject(question, screen) {
        return screen && screen.subject && DEICTIC.test(question) ? `${question} (${screen.subject})` : question;
    }

    function validAction(a) {
        if (!a || typeof a !== 'object' || !APPS.has(String(a.app))) return null;
        return { app: String(a.app), target: a.target ? String(a.target).slice(0, 80) : null };
    }

    async function askModel(question, history, screen) {
        const endpoint = window.APP_CONFIG && window.APP_CONFIG.IRIS_ENDPOINT;
        if (!endpoint) return null;
        const context = window.IrisBrain ? IrisBrain.contextFor(withSubject(question, screen), 4) : [];
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 20000);   // room for the proxy to fall back to Gemini
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...history.slice(-6), { role: 'user', content: question }],
                    context,
                    screen: screen ? screen.describe : ''
                }),
                signal: ctrl.signal
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data.reply ? { text: data.reply, action: validAction(data.action) } : null;
        } catch (e) {
            return null;   // offline, blocked or slow: the local engine answers
        } finally {
            clearTimeout(timer);
        }
    }

    /**
     * @param {string} question
     * @param {{ history?: {role:'user'|'assistant', content:string}[], screen?: {app:string, subject?:string, describe:string} }} opts
     * @returns {Promise<{ text:string, sources:object[], card?:object, action?:{app:string,target:?string}, viaModel:boolean }>}
     */
    async function ask(question, { history = [], screen = null } = {}) {
        const q = String(question || '').trim();
        const local = window.IrisBrain ? IrisBrain.respond(withSubject(q, screen)) : { text: 'I can’t reach my knowledge base right now.', sources: [] };
        const model = await askModel(q, history, screen);
        if (model) return { text: model.text, sources: local.outOfScope ? [] : local.sources || [], action: model.action, viaModel: true };
        return { ...local, viaModel: false };
    }

    const hasModel = () => Boolean(window.APP_CONFIG && window.APP_CONFIG.IRIS_ENDPOINT);

    return { ask, hasModel, withSubject };
})();
