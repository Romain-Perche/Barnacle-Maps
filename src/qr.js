// QR image for the phone link. The encoding comes from the qrcode-generator library (FR-009).
// Returns null when the QR area must not be shown (library missing or failing, FR-010).
export function qrImageSrc(factory, text) {
  if (typeof factory !== "function" || !text) return null;
  try {
    const qr = factory(0, "L");
    qr.addData(text);
    qr.make();
    return "data:image/svg+xml," + encodeURIComponent(qr.createSvgTag({ cellSize: 1, margin: 4, scalable: true }));
  } catch {
    return null;
  }
}
