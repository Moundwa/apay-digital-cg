/* Apay mode — atelier / maintenance.
   APAY_MAINTENANCE = false  → store ouvert (défaut)
   APAY_MAINTENANCE = true   → clients voient maintenance.html
   Bypass atelier : ajouter ?atelier=1 à l’URL (session)
*/
window.APAY_MAINTENANCE = false;
(function () {
  if (!window.APAY_MAINTENANCE) return;
  var file = (location.pathname.split("/").pop() || "index.html");
  if (file === "maintenance.html") return;
  try {
    if (/[?&]atelier=1/.test(location.search)) {
      sessionStorage.setItem("apay-atelier", "1");
      return;
    }
    if (sessionStorage.getItem("apay-atelier") === "1") return;
  } catch (e) {}
  location.replace("maintenance.html");
})();
