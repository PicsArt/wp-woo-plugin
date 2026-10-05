(function () {
    'use strict';
    document.querySelectorAll('.picsart-collection').forEach(function (root) { var track = root.querySelector('.picsart-collection-track'), items = Array.from(track.children), status = root.querySelector('[aria-live]'), index = 0; function visible() { return items[index]; } function pause() { root.querySelectorAll('video').forEach(function (v) { v.pause(); }); } function announce() { if (status)
        status.textContent = (index + 1) + ' / ' + items.length; } function move(step) { pause(); index = Math.max(0, Math.min(items.length - 1, index + step)); visible().scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'start' }); announce(); } root.querySelectorAll('[data-step]').forEach(function (b) { b.addEventListener('click', function () { move(Number(b.dataset.step)); }); }); track.addEventListener('keydown', function (e) { if (e.target !== track)
        return; var rtl = getComputedStyle(track).direction === 'rtl'; if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        move((e.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1));
    } }); track.addEventListener('scroll', function () { var rect = track.getBoundingClientRect(), next = items.findIndex(function (item) { var r = item.getBoundingClientRect(); return r.left < rect.left + rect.width / 2 && r.right > rect.left + rect.width / 2; }); if (next >= 0 && next !== index) {
        pause();
        index = next;
        announce();
    } }, { passive: true }); root.querySelectorAll('video').forEach(function (v) { var start = Number(v.dataset.start) || 0, end = Number(v.dataset.end) || 0; v.addEventListener('loadedmetadata', function () { if (start < v.duration)
        v.currentTime = start; }); v.addEventListener('timeupdate', function () { if (end && v.currentTime >= end) {
        if (v.loop) {
            v.currentTime = start;
        }
        else {
            v.pause();
            v.currentTime = start;
        }
    } }); var observer = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (!entry.isIntersecting) {
        v.pause();
        return;
    } if (v.dataset.autoplay && !matchMedia('(prefers-reduced-motion: reduce)').matches && !(navigator.connection && navigator.connection.saveData)) {
        v.muted = true;
        v.play().catch(function () { });
    } }); }, { threshold: .6 }); observer.observe(v); }); announce(); });
})();
