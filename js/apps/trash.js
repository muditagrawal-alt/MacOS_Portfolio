/* ==========================================================================
   Trash.app Controller: Discarded Items Toast & Memory Recycle
   ========================================================================== */

function showTrashItemInfo(name, desc) {
    const toast = document.getElementById('trash-item-toast');
    if (toast) {
        toast.textContent = `${name}: ${desc}`;
        toast.classList.remove('hidden');
        setTimeout(() => { toast.classList.add('hidden'); }, 3000);
    }
}

let trashSnapshot = null;

function emptyTrash() {
    const container = document.getElementById('trash-content-area');
    // Snapshot so Restore can put things back. It used to call
    // location.reload(), which restarted the entire desktop (and replayed the
    // boot animation) just to undo one action.
    if (container && trashSnapshot === null) trashSnapshot = container.innerHTML;
    const title = document.getElementById('trash-title');
    const trashImg = document.getElementById('dock-trash-img');
    if (trashImg) {
        trashImg.src = 'assets/icons/trash.png';
    }
    if (container) {
        container.innerHTML = `
            <div style="text-align:center;color:#aaa;padding:40px;">
                <i class="fas fa-check-circle fa-3x" style="color:#27c93f;margin-bottom:12px;"></i>
                <div style="font-size:16px;color:#fff;font-weight:600;">Trash is Empty</div>
                <p style="font-size:12px;margin-top:6px;">All discarded experiments have been recycled into clean memory.</p>
                <button type="button" class="app-pill-btn" onclick="restoreTrash()" style="margin-top:10px;"><i class="fas fa-rotate-left"></i> Put Back</button>
            </div>
        `;
    }
    if (title) title.textContent = "Trash — 0 items";
}

function restoreTrash() {
    const container = document.getElementById('trash-content-area');
    const title = document.getElementById('trash-title');
    const trashImg = document.getElementById('dock-trash-img');

    if (container && trashSnapshot !== null) {
        container.innerHTML = trashSnapshot;
        trashSnapshot = null;
    }
    if (trashImg) trashImg.src = 'assets/icons/trash-full.png';
    if (title) title.textContent = 'Trash — 2 items';
}
