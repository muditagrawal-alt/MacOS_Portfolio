/* ==========================================================================
   App Store.app Controller: Category Filtering & Real-time Search
   Category and query are ANDed through one code path so the two filters
   can't silently cancel each other out.
   ========================================================================== */

let appStoreCategory = 'all';
let appStoreQuery = '';

function applyAppStoreFilters() {
    const q = appStoreQuery.toLowerCase().trim();
    let visible = 0;

    document.querySelectorAll('.app-card').forEach(card => {
        const matchesCat = appStoreCategory === 'all' || card.getAttribute('data-cat') === appStoreCategory;
        const matchesQuery = !q || card.textContent.toLowerCase().includes(q);
        const show = matchesCat && matchesQuery;
        card.style.display = show ? 'flex' : 'none';
        if (show) visible++;
    });

    const empty = document.getElementById('appstore-empty-state');
    if (empty) empty.style.display = visible === 0 ? 'block' : 'none';
}

function filterAppStoreCategory(category, element) {
    document.querySelectorAll('.appstore-sidebar .sidebar-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');
    appStoreCategory = category;
    applyAppStoreFilters();
}

function filterAppStoreProjects(query) {
    appStoreQuery = query || '';
    applyAppStoreFilters();
}
