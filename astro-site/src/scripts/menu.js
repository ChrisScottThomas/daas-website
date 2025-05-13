document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const menuBtn = document.getElementById("menu-toggle");
  const panel = document.getElementById("menu-panel");
  const themeToggle = document.getElementById("theme-toggle");

  // Theme load
  const theme = localStorage.getItem("theme");
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  }

  // Toggle theme
  themeToggle?.addEventListener("click", () => {
    const isDark = root.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });

  // Toggle menu
  menuBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const expanded = menuBtn.getAttribute("aria-expanded") === "true";
    menuBtn.setAttribute("aria-expanded", String(!expanded));
    panel.classList.toggle("scale-y-0", expanded);
    panel.classList.toggle("scale-y-100", !expanded);
  });

  // Close menu on outside click
  document.addEventListener("click", (e) => {
    const target = e.target;
    const clickedInsideMenu = panel.contains(target);
    const clickedToggle = menuBtn.contains(target);

    if (!clickedInsideMenu && !clickedToggle) {
      if (!panel.classList.contains("scale-y-0")) {
        panel.classList.add("scale-y-0");
        panel.classList.remove("scale-y-100");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    }
  });

  // Close menu on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.classList.contains("scale-y-0")) {
      panel.classList.add("scale-y-0");
      panel.classList.remove("scale-y-100");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });
});
