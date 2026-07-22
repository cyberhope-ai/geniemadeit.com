/*
 * Client-side Certificate of Authenticity — a printable PDF for any creation/record.
 * Lazy-imported (jsPDF + qrcode are heavy), so this module only loads when a user clicks "Certificate".
 */
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

async function toDataURL(url: string): Promise<string> {
  const r = await fetch(url);
  const b = await r.blob();
  return await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = rej;
    fr.readAsDataURL(b);
  });
}
function imgDims(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight });
    i.onerror = rej;
    i.src = dataUrl;
  });
}

export type CertOpts = {
  imageUrl?: string;
  owner: string;
  title?: string | null;
  date?: string;
  hash?: string | null;
  receiptId: string;
  verifyUrl: string;
  capability?: string;
};

export async function generateCertificate(o: CertOpts): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();   // ~595
  const H = doc.internal.pageSize.getHeight();  // ~842
  const M = 42;
  const INK: [number, number, number] = [11, 15, 22];
  const TEXT: [number, number, number] = [233, 238, 243];
  const MUTED: [number, number, number] = [150, 162, 178];
  const GOLD: [number, number, number] = [245, 196, 81];
  const BORDER: [number, number, number] = [40, 50, 63];

  // ground + double gold frame
  doc.setFillColor(...INK); doc.rect(0, 0, W, H, "F");
  doc.setDrawColor(...GOLD); doc.setLineWidth(1.4); doc.rect(M, M, W - 2 * M, H - 2 * M);
  doc.setLineWidth(0.4); doc.rect(M + 6, M + 6, W - 2 * M - 12, H - 2 * M - 12);

  // header
  doc.setTextColor(...GOLD); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.text("EVERVERIFY", W / 2, M + 44, { align: "center" });
  doc.setTextColor(...TEXT); doc.setFont("times", "bold"); doc.setFontSize(28);
  doc.text("Certificate of Authenticity", W / 2, M + 76, { align: "center" });
  doc.setTextColor(...MUTED); doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
  doc.text("This creation is registered on the public EverVerify registry — provably authentic and its owner's.", W / 2, M + 96, { align: "center" });

  let y = M + 120;

  // image (centered, aspect-preserved)
  const isVisual = o.imageUrl && !(o.capability || "").startsWith("video") && !(o.capability || "").startsWith("audio");
  if (isVisual) {
    try {
      const data = await toDataURL(o.imageUrl!);
      const d = await imgDims(data);
      const box = 250;
      const s = Math.min(box / d.w, box / d.h, 1.6);
      const iw = d.w * s, ih = d.h * s;
      const ix = (W - iw) / 2;
      doc.setDrawColor(...BORDER); doc.setLineWidth(1); doc.rect(ix - 5, y - 5, iw + 10, ih + 10);
      doc.addImage(data, "PNG", ix, y, iw, ih, undefined, "FAST");
      y += ih + 34;
    } catch { y += 10; }
  }

  // fields (centered)
  const field = (label: string, val: string) => {
    doc.setTextColor(...MUTED); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
    doc.text(label.toUpperCase(), W / 2, y, { align: "center" });
    doc.setTextColor(...TEXT); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.text(val || "—", W / 2, y + 17, { align: "center" });
    y += 40;
  };
  field("Owner", o.owner);
  if (o.title) field("Title", o.title);
  field("Registered", o.date ? new Date(o.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—");

  // fingerprint
  doc.setTextColor(...MUTED); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
  doc.text("CRYPTOGRAPHIC FINGERPRINT · SHA-256", W / 2, y, { align: "center" });
  doc.setTextColor(...TEXT); doc.setFont("courier", "normal"); doc.setFontSize(9);
  const hl = doc.splitTextToSize(o.hash || "—", W - 2 * M - 40);
  doc.text(hl, W / 2, y + 15, { align: "center" });
  y += 15 + hl.length * 11 + 24;

  // QR (centered)
  try {
    const qr = await QRCode.toDataURL(o.verifyUrl, { margin: 1, width: 320, color: { dark: "#0b0f16", light: "#ffffff" } });
    const qs = 116;
    doc.setFillColor(255, 255, 255); doc.roundedRect(W / 2 - qs / 2 - 6, y - 6, qs + 12, qs + 12, 6, 6, "F");
    doc.addImage(qr, "PNG", W / 2 - qs / 2, y, qs, qs);
    y += qs + 14;
    doc.setTextColor(...MUTED); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
    doc.text("Scan to verify this record independently", W / 2, y, { align: "center" });
  } catch { /* QR optional */ }

  // footer
  doc.setTextColor(...MUTED); doc.setFont("courier", "normal"); doc.setFontSize(7.5);
  doc.text(`Receipt  ${o.receiptId}`, W / 2, H - M - 34, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  doc.text("Verified by EverVerify  ·  Powered by CyberHopeAI  ·  eververify.org", W / 2, H - M - 20, { align: "center" });

  doc.save(`certificate-of-authenticity-${(o.receiptId || "creation").slice(0, 12)}.pdf`);
}
