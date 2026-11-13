// Parse a pasted catalogue where a price is only recognized after an explicit
// separator. A trailing number without a separator remains part of the name.
export function parseCatalogLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.*?)(?:\s*,\s*|\s*\|\s*|\s*:\s*|\t+|\s+-\s+)(\d+(?:,\d{3})*(?:\.\d+)?)\s*$/);
      return match
        ? { name: match[1].trim(), price: Number(match[2].replaceAll(",", "")) }
        : { name: line, price: 0 };
    })
    .filter((item) => item.name);
}
