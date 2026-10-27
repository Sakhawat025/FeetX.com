import api from "./api";

export async function getReports(filters, signal) {
  const response = await api.get("/admin/reports", {
    params: filters,
    signal,
    timeout: 30000,
  });

  return response.data;
}

export function downloadCSV(
  filename,
  headers,
  rows,
  metadata = []
) {
  function cell(value) {
    let text = value == null ? "" : String(value);

    // Prevent spreadsheet formula execution in text cells.
    if (
      typeof value === "string" &&
      /^[\s\uFEFF]*[=+@-]/.test(text)
    ) {
      text = "'" + text;
    }

    return '"' + text.replace(/"/g, '""') + '"';
  }

  const content =
    "\uFEFF" +
    [...metadata, headers, ...rows]
      .map((row) => row.map(cell).join(","))
      .join("\r\n");

  const url = URL.createObjectURL(
    new Blob([content], {
      type: "text/csv;charset=utf-8;",
    })
  );

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}