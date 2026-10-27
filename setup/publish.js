/* ==========================================================================
   Publishing from the admin — commit and push the content, nothing else
   --------------------------------------------------------------------------
   The admin (`npm run admin`) saves the info bank and its files; "Publish"
   then commits exactly those files and pushes the current branch, so the
   owner never has to touch git. Only content paths are ever staged: code
   edits lying around in the working tree stay out of the commit.
   ========================================================================== */

const { spawnSync } = require('child_process');

// Everything the admin writes (setup/apply.js), and nothing else.
const CONTENT = ['js/data/profile.js', 'assets', 'index.html', 'ios.html', 'manifest.webmanifest', 'api/_owner.js', 'js/config/config.js'];

function git(root, args) {
    const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', timeout: 60000 });
    return { ok: r.status === 0, out: `${r.stdout || ''}${r.stderr || ''}`.trim() };
}

/** Where publishing would go, and which content files have unpublished changes. */
function status(root) {
    if (!git(root, ['rev-parse', '--is-inside-work-tree']).ok) return { repo: false };
    const branch = git(root, ['rev-parse', '--abbrev-ref', 'HEAD']).out;
    const remote = git(root, ['remote', 'get-url', 'origin']);
    const upstream = git(root, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
    const changed = git(root, ['status', '--porcelain', '--untracked-files=all', '--', ...CONTENT]).out
        .split('\n').filter(Boolean).map(l => l.slice(3).replace(/^"|"$/g, ''));
    const ahead = upstream.ok ? Number(git(root, ['rev-list', '--count', '@{u}..HEAD']).out) || 0 : 0;
    return { repo: true, branch, remote: remote.ok ? remote.out : null, upstream: upstream.ok ? upstream.out : null, changed, ahead };
}

/** Commits the content files and pushes the current branch. */
function publish(root, message = 'Update portfolio content') {
    const before = status(root);
    if (!before.repo) throw new Error('This folder isn’t a git repository, so there’s nowhere to publish to.');
    if (!before.remote) throw new Error('No GitHub remote (origin) is set up for this repository.');
    let commit = null;
    if (before.changed.length) {
        const add = git(root, ['add', '-A', '--', ...CONTENT]);
        if (!add.ok) throw new Error(add.out || 'git add failed');
        const done = git(root, ['commit', '-m', message, '--', ...CONTENT]);
        if (!done.ok) throw new Error(done.out || 'git commit failed');
        commit = git(root, ['rev-parse', '--short', 'HEAD']).out;
    } else if (!before.ahead) {
        return { published: false, branch: before.branch, files: [], message: 'Nothing new to publish.' };
    }
    const push = before.upstream ? git(root, ['push']) : git(root, ['push', '-u', 'origin', before.branch]);
    if (!push.ok) throw new Error(`Saved and committed${commit ? ` (${commit})` : ''}, but the push failed: ${push.out.split('\n').slice(-3).join(' ')}`);
    return { published: true, branch: before.branch, commit: commit || git(root, ['rev-parse', '--short', 'HEAD']).out, files: before.changed };
}

module.exports = { status, publish, CONTENT };
