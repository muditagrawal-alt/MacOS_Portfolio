/* ==========================================================================
   Runtime Configuration — SAFE TO COMMIT, CONTAINS NO SECRETS
   --------------------------------------------------------------------------
   Iris talks to a serverless proxy that holds the model API key server-side.
   Nothing here is sensitive: the endpoint is public by design.

   To enable the live model, deploy /api/iris.js (see api/README.md) and set
   IRIS_ENDPOINT to its URL. Leave it null and Iris still works — it answers
   from the local portfolio corpus instead of a hosted model.
   ========================================================================== */

window.APP_CONFIG = {
    // e.g. '/api/iris' on Vercel/Netlify. null = offline knowledge-base mode.
    IRIS_ENDPOINT: null,

    // Serverless RSS aggregator for Medium/Substack (see api/feeds.js).
    // null = those sections are simply omitted; GitHub still works, since
    // the browser fetches api.github.com directly.
    FEEDS_ENDPOINT: null,

    // Web3Forms access keys are public submission tokens by design (they only
    // permit posting to the form owner's inbox). Safe to ship client-side.
    WEB3FORMS_ACCESS_KEY: '0026fd18-ff07-44f8-9879-c8e521298f9a'
};
