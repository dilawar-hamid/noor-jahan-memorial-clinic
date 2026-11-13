// Prints one DOM element (a slip) on its own, so the rest of the app
// (sidebar, forms, tables) never ends up on the 80mm thermal paper.
export function printSlip(element) {
  if (!element) return;

  // Copy the page's CSS into the print frame so the slip looks the same.
  const css = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
      } catch {
        return "";
      }
    })
    .join("\n");

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>Slip</title>
<style>${css}</style>
<style>
  @page { size: 80mm auto; margin: 2mm; }
  html, body { min-width: 0 !important; width: 100% !important; margin: 0 !important;
    padding: 0 !important; background: #fff !important; display: block !important; }
  .svc-slip { max-width: none !important; border: 0 !important; margin: 0 !important; }
</style></head><body>${element.outerHTML}</body></html>`);
  doc.close();

  const remove = () => setTimeout(() => iframe.remove(), 500);
  setTimeout(() => {
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) return;
    frameWindow.onafterprint = remove;
    frameWindow.focus();
    frameWindow.print();
    setTimeout(() => iframe.remove(), 60000);
  }, 300);
}
