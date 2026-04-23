/**
 * Shared PDF export using html2pdf.js.
 * Call from any component to export rendered HTML content to PDF.
 */
export async function exportToPdf(
  elementId: string,
  filename: string,
): Promise<void> {
  const html2pdf = (await import("html2pdf.js")).default;
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);

  const opt = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: {
      unit: "mm" as const,
      format: "a4" as const,
      orientation: "portrait" as const,
    },
  };

  await html2pdf().set(opt).from(element).save();
}
