(function () {
var nav = document.getElementById('nav');
var menuBtn = document.getElementById('menu-btn');
var navLinks = document.getElementById('nav-links');
var alwaysSolid = nav.classList.contains('is-solid');

function updateNav() {
    if (alwaysSolid) return;
    var open = document.body.classList.contains('menu-open');
    nav.classList.toggle('is-solid', window.scrollY > 50 || open);
}

window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    updateNav();
}

menuBtn.addEventListener('click', function () {
    setMenu(!document.body.classList.contains('menu-open'));
});

navLinks.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') setMenu(false);
});

// Stories on the home page, grouped by category (family, friends...)
var groupsEl = document.getElementById('stories-groups');
if (groupsEl && typeof storyList !== 'undefined') {
    var limit = window.matchMedia('(min-width: 1000px)').matches ? 6 : 4;
    var groups = [];
    storyList.forEach(function (item) {
        var group = groups.filter(function (g) { return g.name === item.category; })[0];
        if (!group) {
            group = { name: item.category, items: [] };
            groups.push(group);
        }
        group.items.push(item);
    });

    groups.forEach(function (group) {
        var groupEl = document.createElement('div');
        groupEl.className = 'story-group';

        // Group titles only matter once there is more than one group
        if (groups.length > 1) {
            var title = document.createElement('h3');
            title.className = 'story-group-title reveal';
            title.textContent = group.name;
            var count = document.createElement('span');
            count.textContent = '(' + group.items.length + ')';
            title.appendChild(count);
            groupEl.appendChild(title);
        }

        var list = document.createElement('ul');
        list.className = 'story-list';
        list.style.listStyle = 'none';
        group.items.forEach(function (item, i) {
            var story = stories[item.id];
            var li = document.createElement('li');
            li.className = 'story-item reveal' + (i >= limit ? ' is-hidden' : '');
            li.style.setProperty('--delay', ((i % 3) * 0.08) + 's');
            li.innerHTML =
                '<a>' +
                    '<figure><img loading="lazy" alt=""></figure>' +
                    '<div><h3></h3><span class="read-more">לקריאת הסיפור <i>&larr;</i></span></div>' +
                '</a>';
            li.querySelector('a').href = 'story.html?id=' + item.id;
            var img = li.querySelector('img');
            img.src = story.image;
            img.alt = item.author + ' ואיתמר';
            if (item.imagePosition) img.style.objectPosition = item.imagePosition;
            li.querySelector('h3').textContent = story.title;
            list.appendChild(li);
        });
        groupEl.appendChild(list);

        if (group.items.length > limit) {
            var more = document.createElement('button');
            more.className = 'stories-more';
            more.textContent = 'לעוד סיפורים (' + (group.items.length - limit) + ')';
            more.addEventListener('click', function () {
                var hidden = Array.prototype.filter.call(list.children, function (li) {
                    return li.classList.contains('is-hidden');
                });
                // Show the rest in their starting (faded, lowered) state, then let them rise in one after another
                hidden.forEach(function (li, i) {
                    li.classList.remove('is-hidden', 'is-visible');
                    li.style.setProperty('--delay', (i * 0.09) + 's');
                });
                void list.offsetHeight;
                requestAnimationFrame(function () {
                    hidden.forEach(function (li) { li.classList.add('is-visible'); });
                });
                more.classList.add('is-leaving');
                setTimeout(function () { more.hidden = true; }, 400);
            });
            groupEl.appendChild(more);
        }

        groupsEl.appendChild(groupEl);
    });
}

// Instagram + WhatsApp buttons: always visible, fading in once the hero intro has played.
// The WhatsApp button starts as an icon and opens up to show its label once the visitor scrolls.
var floating = document.getElementById('floating-links');
if (floating) {
    setTimeout(function () { floating.classList.add('is-shown'); }, document.querySelector('.hero') ? 1400 : 0);

    var whatsapp = floating.querySelector('.float-whatsapp');
    var expandWhatsapp = function () {
        if (window.scrollY > 120) {
            whatsapp.classList.add('is-expanded');
            window.removeEventListener('scroll', expandWhatsapp);
        }
    };
    window.addEventListener('scroll', expandWhatsapp, { passive: true });
    expandWhatsapp();
}

// Fade elements in as they scroll into view
var revealed = document.querySelectorAll('.reveal, .reveal-img');
if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -10% 0px' });
    revealed.forEach(function (el) { observer.observe(el); });
} else {
    revealed.forEach(function (el) { el.classList.add('is-visible'); });
}

// Photo strip: scrolls continuously, eases to a stop on hover, pauses while off-screen
var marquee = document.querySelector('.marquee');
if (marquee && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var baseSpeed = 40; // px per second
    var speed = baseSpeed;
    var targetSpeed = baseSpeed;
    var offset = 0;
    var lastTime = null;
    var loopWidth = 0;
    var running = false;

    var measure = function () {
        var gap = parseFloat(getComputedStyle(marquee).columnGap) || 0;
        loopWidth = (marquee.scrollWidth + gap) / 2;
    };
    window.addEventListener('load', measure);
    window.addEventListener('resize', measure);
    marquee.querySelectorAll('img').forEach(function (img) { img.addEventListener('load', measure); });
    measure();

    marquee.addEventListener('mouseenter', function () { targetSpeed = 0; });
    marquee.addEventListener('mouseleave', function () { targetSpeed = baseSpeed; });

    var step = function (time) {
        if (!running) { lastTime = null; return; }
        if (lastTime !== null && loopWidth > 0) {
            var dt = Math.min((time - lastTime) / 1000, 0.1);
            speed += (targetSpeed - speed) * (1 - Math.exp(-dt * 3));
            offset = (offset + speed * dt) % loopWidth;
            marquee.style.transform = 'translate3d(' + -offset + 'px, 0, 0)';
        }
        lastTime = time;
        requestAnimationFrame(step);
    };

    var start = function () {
        if (running) return;
        running = true;
        requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) start(); else running = false;
        }).observe(marquee);
    } else {
        start();
    }
}

// Expand / collapse buttons (song story and lyrics)
document.querySelectorAll('.toggle-btn').forEach(function (btn) {
    var target = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', open);
        btn.textContent = open ? btn.dataset.open : btn.dataset.closed;
        target.classList.toggle('is-open', open);
    });
});

// Song player
var audio = document.getElementById('audio');
if (audio) {
    var player = document.getElementById('player');
    var playBtn = document.getElementById('play-btn');
    var progress = document.getElementById('progress');
    var progressFill = document.getElementById('progress-fill');
    var timeCurrent = document.getElementById('time-current');
    var timeTotal = document.getElementById('time-total');

    var formatTime = function (s) {
        if (!isFinite(s)) return '';
        s = Math.floor(s);
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    };

    playBtn.addEventListener('click', function () {
        if (audio.paused) audio.play(); else audio.pause();
    });
    audio.addEventListener('play', function () {
        player.classList.add('is-playing');
        playBtn.setAttribute('aria-label', 'עצור');
    });
    audio.addEventListener('pause', function () {
        player.classList.remove('is-playing');
        playBtn.setAttribute('aria-label', 'נגן את השיר');
    });
    audio.addEventListener('loadedmetadata', function () {
        timeTotal.textContent = formatTime(audio.duration);
    });
    audio.addEventListener('timeupdate', function () {
        timeCurrent.textContent = formatTime(audio.currentTime);
        progressFill.style.width = (audio.currentTime / audio.duration * 100 || 0) + '%';
    });
    progress.addEventListener('click', function (e) {
        if (!isFinite(audio.duration)) return;
        var rect = progress.getBoundingClientRect();
        audio.currentTime = (e.clientX - rect.left) / rect.width * audio.duration;
    });
}

window.siteReady = true;
})();
