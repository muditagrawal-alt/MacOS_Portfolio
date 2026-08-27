/* ==========================================================================
   Resume.app Controller
   --------------------------------------------------------------------------
   Serves assets/MuditAgrawalResumeAugust2026.pdf directly.

   Previously this preferred a base64 copy of the PDF inlined into
   resume-data.js — which had drifted to an older January build, so the
   in-window Download button handed out a stale resume under the August
   filename. There is now exactly one resume file, and one path to it.
   ========================================================================== */

const RESUME_FILE = 'assets/MuditAgrawalResumeAugust2026.pdf';
const RESUME_DOWNLOAD_NAME = 'MuditAgrawalResumeAugust2026.pdf';

function openResumeWindow() {
    openWindow('resume-window');

    const downloadBtn = document.getElementById('resume-download-btn');
    if (downloadBtn) downloadBtn.style.display = 'block';
}

function downloadResume(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const link = document.createElement('a');
    link.href = RESUME_FILE;
    link.download = RESUME_DOWNLOAD_NAME;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
