document.addEventListener("DOMContentLoaded", () => {
  const poster = document.querySelector(".poster");

  if (!poster) {
    return;
  }

  poster.classList.add("is-ready");
});
