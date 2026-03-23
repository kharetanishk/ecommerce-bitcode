export function formatPrice(amount: number | string): string {
  const n =
    typeof amount === "string" ? Number.parseFloat(amount) : (amount ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

export function slugify(value: string): string {
  return (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    // Replace whitespace/underscores with hyphens
    .replace(/[\s_]+/g, "-")
    // Remove anything that's not alphanumeric or hyphen
    .replace(/[^a-z0-9-]/g, "")
    // Collapse consecutive hyphens
    .replace(/-+/g, "-")
    // Trim leading/trailing hyphens
    .replace(/^-|-$/g, "");
}

