// Authoring-only identifier transform shared by markers and new skills.
// This never changes stable stored IDs in existing creations.
export function captureAuthorSlugV1(value) {
  return String(value ?? "").normalize("NFKD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"").slice(0,64).replace(/-+$/g,"");
}
