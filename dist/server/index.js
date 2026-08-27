const HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cat Club</title>
    <meta
      name="description"
      content="A hand-drawn Cat Club website inspired by the paper mockup, ready for more details later."
    />
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <main class="page">
      <section class="poster" aria-label="Cat Club website draft">
        <header class="masthead">
          <div class="logo-mark" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <h1 class="club-sign" aria-label="Cat Club">
            <span class="club-sign-title">CATCLUB</span>
            <span class="club-sign-mark" aria-hidden="true">C ⚡ C</span>
          </h1>
        </header>

        <section class="layout">
          <aside class="side-notes side-notes-left" aria-label="Club notes">
            <div class="note note-signup cat-box">
              <p class="note-title">Sign up</p>
              <div class="heart" aria-hidden="true"></div>
              <p class="note-copy">Name, class, or club: CatClub!</p>
            </div>

            <div class="note note-message cat-box">
              <p class="note-title">Message</p>
              <p class="note-copy">Drop announcements, reminders, or links here.</p>
              <p class="note-small">oliviayx@icloud.com</p>
              <p class="note-small">ebshukis@icloud.com</p>
              <p class="note-small">h.e.zhao@icloud.com</p>
              <p class="note-small">isabellazhang520@gmail.com</p>
              <a class="chat-button" href="sms:" aria-label="Chat here in Messages">Chat here</a>
            </div>
          </aside>

          <section class="board" aria-label="Main content area">
            <div class="board-header">
              <p class="eyebrow">Welcome to the club</p>
              <p class="subhead">This page follows the sketch and leaves room for future details.</p>
            </div>

            <div class="board-body">
              <div class="placeholder-panel cat-box" aria-label="Main content area"></div>
            </div>

            <div class="board-doodle" aria-hidden="true">
              <svg viewBox="0 0 900 220" role="presentation" focusable="false">
                <path d="M75 160c24-38 69-56 121-48 37 6 66 26 86 53" />
                <path d="M78 159c10-22 21-45 32-67" />
                <path d="M122 155c12-25 30-48 53-70" />
                <path d="M228 165c7-42 17-69 31-85 18-19 43-29 77-30 38-1 70 9 95 29 19 16 36 40 48 73" />
                <path d="M246 88c-7-18-11-31-11-41 0-18 8-33 24-45" />
                <path d="M300 74c0-24 6-44 19-59" />
                <path d="M478 161c18-33 43-53 74-60 29-7 62 0 96 20 28 17 50 40 66 69" />
                <path d="M531 84c12-20 27-36 46-49" />
                <path d="M588 88c10-18 23-33 39-46" />
                <path d="M664 164c18-8 32-17 42-29 13-15 20-35 23-60" />
                <path d="M707 75c8 10 16 16 24 19 14 5 28 4 42-4" />
                <path d="M786 149c18-18 32-31 43-40" />
                <path d="M730 114l-18 34 32-2-16 34 42-30-28-1 14-29z" />
              </svg>
            </div>

            <div class="board-footer">
              <div class="member-card member-card-primary cat-box">
                <p class="card-title">Members</p>
                <ul class="member-list">
                  <li>Izzy</li>
                  <li>Lexi</li>
                  <li>Olivia</li>
                  <li>Eve</li>
                  <li>Alison</li>
                </ul>
              </div>

              <div class="member-card member-card-secondary cat-box">
                <p class="card-title">New members</p>
                <ul class="member-list">
                  <li>Elise</li>
                  <li>Audrey</li>
                </ul>
              </div>
            </div>
          </section>
        </section>
      </section>
    </main>

    <script src="./script.js"></script>
  </body>
</html>`;

const CSS = `@import url("https://fonts.googleapis.com/css2?family=Amatic+SC:wght@700&family=Caveat:wght@700&family=Patrick+Hand&family=Shrikhand&display=swap");

:root {
  color-scheme: light;
  --paper: #f5efe3;
  --paper-deep: #eadfc9;
  --wood: #b78747;
  --wood-dark: #8c6232;
  --ink: #3c342f;
  --ink-soft: rgba(60, 52, 47, 0.72);
  --line: #4c4238;
  --cream: rgba(255, 251, 243, 0.86);
  --shadow: rgba(66, 45, 18, 0.18);
  --orange: #f5a623;
  --coral: #ed6a4d;
  --blue: #b4c8ce;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
}

body {
  font-family: "Patrick Hand", "Trebuchet MS", sans-serif;
  color: var(--ink);
  background:
    radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.45), transparent 22%),
    radial-gradient(circle at 82% 12%, rgba(255, 236, 194, 0.36), transparent 28%),
    linear-gradient(145deg, #d39a52 0%, #c68a45 22%, #b47836 58%, #a46b2f 100%);
  overflow-x: hidden;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.07), transparent 40%),
    repeating-linear-gradient(
      90deg,
      rgba(104, 68, 24, 0.08) 0 2px,
      transparent 2px 86px
    ),
    repeating-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.03) 0 1px,
      transparent 1px 92px
    );
  opacity: 0.65;
  mix-blend-mode: soft-light;
}

.page {
  min-height: 100vh;
  padding: clamp(1rem, 2vw, 2rem);
}

.poster {
  position: relative;
  min-height: calc(100vh - 2rem);
  padding: clamp(1rem, 2.2vw, 2rem);
  border-radius: 28px;
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.55), transparent 28%),
    linear-gradient(180deg, var(--paper), var(--paper-deep));
  border: 1px solid rgba(68, 51, 36, 0.14);
  box-shadow:
    0 24px 60px var(--shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  overflow: hidden;
}

.poster::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 12% 14%, rgba(255, 255, 255, 0.2), transparent 18%),
    radial-gradient(circle at 86% 22%, rgba(248, 229, 184, 0.28), transparent 16%),
    radial-gradient(circle at 28% 76%, rgba(255, 255, 255, 0.12), transparent 20%);
  pointer-events: none;
}

.masthead {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: 0.35rem;
  text-align: center;
  padding-top: 0.25rem;
}

.logo-mark {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: -0.2rem;
}

.logo-mark span {
  display: block;
  width: 1rem;
  height: 1rem;
  border: 0.2rem solid var(--line);
  border-radius: 50%;
  border-left-color: transparent;
  border-right-color: transparent;
  transform: rotate(12deg);
}

.logo-mark span:nth-child(2) {
  width: 1.3rem;
  height: 1.3rem;
}

.club-sign {
  margin: 0;
  padding: 0.2rem 1.1rem 0.3rem;
  border: 0.22rem solid var(--line);
  border-radius: 999px;
  display: grid;
  justify-items: center;
  gap: 0.05rem;
  font-family: "Amatic SC", "Patrick Hand", cursive;
  color: var(--ink);
  background: rgba(255, 253, 247, 0.82);
  box-shadow: inset 0 -0.15rem 0 rgba(0, 0, 0, 0.06);
  transform: rotate(-1deg);
}

.club-sign-title {
  font-size: clamp(2.4rem, 4.6vw, 4.8rem);
  line-height: 0.9;
  letter-spacing: 0.08em;
}

.club-sign-mark {
  font-size: clamp(1.1rem, 1.8vw, 1.55rem);
  line-height: 1;
  letter-spacing: 0.16em;
}

.layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(8rem, 14rem) minmax(0, 1fr);
  gap: clamp(1rem, 2.5vw, 2.5rem);
  align-items: start;
  margin-top: clamp(1rem, 2vw, 1.6rem);
}

.side-notes {
  display: grid;
  gap: 1rem;
  align-content: start;
  padding-top: 11rem;
}

.note {
  position: relative;
  border: 0.24rem solid var(--line);
  border-radius: 30% 30% 22% 22% / 18% 18% 18% 18%;
  padding: 1rem 1rem 0.9rem;
  color: var(--ink);
  transform: rotate(-2deg);
  background: rgba(255, 250, 241, 0.82);
  box-shadow:
    0 12px 24px rgba(68, 51, 36, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.76);
  overflow: visible;
}

.cat-box::before,
.cat-box::after {
  content: "";
  position: absolute;
  top: -1.45rem;
  width: 1.7rem;
  height: 2.2rem;
  background: inherit;
  border: 0.24rem solid var(--line);
  border-bottom: 0;
  z-index: 0;
}

.cat-box::before {
  left: 1rem;
  border-radius: 70% 65% 0 0;
  transform: rotate(-20deg);
}

.cat-box::after {
  right: 1rem;
  border-radius: 65% 70% 0 0;
  transform: rotate(20deg);
}

.note-title {
  margin: 0 0 0.25rem;
  font-size: clamp(1.6rem, 2.5vw, 2rem);
  line-height: 0.95;
  font-weight: 700;
}

.note-copy,
.note-small {
  margin: 0;
  max-width: 12rem;
  font-size: clamp(1.05rem, 1.5vw, 1.2rem);
  line-height: 1.05;
}

.note-small {
  margin-top: 0.2rem;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
}

.chat-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.7rem;
  padding: 0.2rem 0.7rem 0.14rem;
  width: fit-content;
  border: 0.18rem solid var(--line);
  border-radius: 999px;
  background: rgba(255, 252, 245, 0.88);
  color: var(--ink);
  text-decoration: none;
  font-size: 1.05rem;
  line-height: 1;
  font-weight: 700;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
}

.chat-button:focus,
.chat-button:hover {
  transform: translateY(-1px);
  background: rgba(255, 247, 231, 0.96);
}

.heart {
  width: 4rem;
  height: 3.7rem;
  margin: 0.15rem 0 0.1rem 0.45rem;
  position: relative;
  background: #1d1b1b;
  transform: rotate(-45deg);
  border-radius: 0.5rem 0.5rem 0.25rem 0.25rem;
}

.heart::before,
.heart::after {
  content: "";
  position: absolute;
  width: 4rem;
  height: 3.7rem;
  background: #1d1b1b;
  border-radius: 50%;
}

.heart::before {
  top: -2rem;
  left: 0;
}

.heart::after {
  top: 0;
  left: 2rem;
}

.note-signup .note-copy {
  margin-top: 0.45rem;
}

.board {
  position: relative;
  display: grid;
  gap: clamp(1rem, 2vw, 1.4rem);
  min-height: min(68vh, 54rem);
}

.board-header {
  display: grid;
  gap: 0.2rem;
  padding-right: clamp(10rem, 14vw, 15rem);
}

.eyebrow,
.subhead {
  margin: 0;
  font-size: clamp(1.05rem, 1.5vw, 1.2rem);
  line-height: 1.05;
}

.eyebrow {
  font-weight: 700;
}

.subhead {
  color: var(--ink-soft);
  max-width: 34rem;
}

.board-body {
  position: relative;
  display: grid;
  align-items: start;
  min-height: 31rem;
}

.placeholder-panel {
  position: relative;
  min-height: 100%;
  border: 0.24rem solid var(--line);
  border-radius: 26% 26% 20% 20% / 16% 16% 18% 18%;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.08)),
    rgba(255, 255, 255, 0.22);
  box-shadow:
    0 10px 22px rgba(68, 51, 36, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  margin-right: clamp(8rem, 12vw, 14rem);
}

.placeholder-panel::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    linear-gradient(180deg, transparent 0 76%, rgba(255, 255, 255, 0.24) 100%),
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.18), transparent 62%);
  pointer-events: none;
  z-index: 0;
}

.board-doodle {
  display: grid;
  place-items: center;
  min-height: 8.5rem;
  margin: 0.1rem 0 0.3rem;
}

.board-doodle svg {
  width: min(100%, 48rem);
  height: auto;
  filter: saturate(1.08);
}

.board-doodle path {
  fill: none;
  stroke: #111;
  stroke-width: 7;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.98;
  mix-blend-mode: multiply;
}

.board-doodle path:nth-child(1) {
  stroke: #2f6f8f;
}

.board-doodle path:nth-child(2) {
  stroke: #ec6f66;
}

.board-doodle path:nth-child(3) {
  stroke: #f0ad3d;
}

.board-doodle path:nth-child(4) {
  stroke: #5d8c63;
}

.board-doodle path:nth-child(5) {
  stroke: #7b6bd6;
}

.board-doodle path:nth-child(6) {
  stroke: #e06aa3;
}

.board-doodle path:nth-child(7) {
  stroke: #2f6f8f;
}

.board-doodle path:nth-child(8) {
  stroke: #ec6f66;
}

.board-doodle path:nth-child(9) {
  stroke: #f0ad3d;
}

.board-doodle path:nth-child(10) {
  stroke: #5d8c63;
}

.board-doodle path:nth-child(11) {
  stroke: #7b6bd6;
}

.board-doodle path:nth-child(12) {
  stroke: #e06aa3;
}

.board-doodle path:nth-child(13) {
  stroke: #111;
}

.board-doodle path:last-child {
  stroke: #111;
  fill: rgba(240, 173, 61, 0.16);
}

.board-footer {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(13rem, 0.8fr);
  gap: 1rem;
  margin-top: auto;
  align-items: end;
}

.member-card {
  position: relative;
  border: 0.24rem solid var(--line);
  border-radius: 32% 32% 22% 22% / 16% 16% 18% 18%;
  padding: 2rem 1.15rem 1.15rem;
  background: rgba(255, 250, 241, 0.9);
  box-shadow:
    0 12px 24px rgba(68, 51, 36, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.76);
  min-height: 14rem;
  overflow: visible;
}

.member-card-primary {
  background:
    linear-gradient(180deg, rgba(245, 166, 35, 0.98), rgba(243, 151, 25, 0.94)),
    var(--orange);
}

.member-card-secondary {
  background:
    linear-gradient(180deg, rgba(185, 202, 206, 0.98), rgba(166, 184, 189, 0.94)),
    var(--blue);
}

.card-title {
  margin: 0 auto 0.55rem;
  padding: 0 0.3rem;
  width: fit-content;
  font-family: "Caveat", "Patrick Hand", cursive;
  font-size: clamp(2rem, 3vw, 2.6rem);
  line-height: 1;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.52);
  border-radius: 0.2rem;
}

.member-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.08rem;
  font-size: clamp(1.55rem, 2.4vw, 2.2rem);
  line-height: 0.95;
  text-align: center;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.member-card-secondary .member-list {
  align-content: center;
  min-height: 8rem;
}

@media (max-width: 980px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .side-notes {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-top: 0;
    order: 2;
  }

  .board {
    order: 1;
  }

  .board-header {
    padding-right: 0;
  }

  .board-body {
    min-height: 28rem;
  }

  .placeholder-panel {
    margin-right: 0;
    margin-top: 3rem;
    min-height: 28rem;
  }

  .board-doodle {
    min-height: 7rem;
  }
}

@media (max-width: 720px) {
  .page {
    padding: 0.7rem;
  }

  .poster {
    min-height: calc(100vh - 1.4rem);
    padding: 0.9rem;
    border-radius: 22px;
  }

  .masthead h1 {
    padding-inline: 1rem;
  }

  .side-notes {
    grid-template-columns: 1fr;
  }

  .board-body {
    min-height: 24rem;
  }

  .placeholder-panel {
    min-height: 24rem;
  }

  .board-doodle {
    min-height: 6rem;
  }

  .board-footer {
    grid-template-columns: 1fr;
  }
}`;

const JS = `document.addEventListener("DOMContentLoaded", () => {
  const poster = document.querySelector(".poster");

  if (!poster) {
    return;
  }

  poster.classList.add("is-ready");
});`;

function response(body, contentType) {
  return new Response(body, {
    headers: {
      "content-type": contentType,
      "cache-control": "no-store",
    },
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return response(HTML, "text/html; charset=utf-8");
    }

    if (url.pathname === "/styles.css") {
      return response(CSS, "text/css; charset=utf-8");
    }

    if (url.pathname === "/script.js") {
      return response(JS, "application/javascript; charset=utf-8");
    }

    return new Response("Not found", { status: 404 });
  },
};`;
