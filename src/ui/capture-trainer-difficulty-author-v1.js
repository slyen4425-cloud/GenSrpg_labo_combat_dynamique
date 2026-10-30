// Single owner: Combat Lab. This form edits only a versioned, explicit author
// policy; it does not apply game rules, create a combat engine or write saves.
import {normalizeCaptureTrainerDifficultyPolicyV1} from "../adapters/input/capture/capture-trainer-difficulty-policy-v1.js";

export function normalizeCaptureTrainerDifficultyAuthorFieldsV1(rows) {
  if (!Array.isArray(rows) || rows.length !== 4) {
    throw new RangeError("Quatre niveaux de difficulté PNJ sont requis.");
  }
  const levels = rows.map((row, index) => {
    if (!row || typeof row !== "object") throw new TypeError("Ligne de difficulté invalide.");
    const hpText = String(row.hpMultiplier ?? "").trim();
    const damageText = String(row.outgoingDamagePctBonus ?? "").trim();
    if (!hpText || !damageText) {
      throw new RangeError("Renseigne PV et dégâts pour les quatre niveaux avant export.");
    }
    return {
      level: index + 1,
      hpMultiplier: Number(hpText),
      outgoingDamagePctBonus: Number(damageText)
    };
  });
  return normalizeCaptureTrainerDifficultyPolicyV1({
    schema: "capture-trainer-difficulty-policy-v1",
    version: 1,
    levels
  });
}

export function mountCaptureTrainerDifficultyAuthorV1({
  root, documentRef = globalThis.document,
  urlApi = globalThis.URL, BlobType = globalThis.Blob
} = {}) {
  if (!root || typeof root.querySelectorAll !== "function") {
    throw new TypeError("Le panneau natif de difficulté PNJ est requis.");
  }
  const rows = [...root.querySelectorAll("[data-trainer-difficulty-row]")];
  if (rows.length !== 4) throw new RangeError("Quatre lignes auteur PNJ sont requises.");
  const fields = rows.map(row => {
    const hp = row.querySelector("[data-trainer-difficulty-hp]");
    const damage = row.querySelector("[data-trainer-difficulty-damage]");
    if (!hp || !damage) throw new TypeError("Champs auteur PNJ manquants.");
    return {hp, damage};
  });
  const exportButton = root.querySelector("[data-trainer-difficulty-export]");
  const importInput = root.querySelector("[data-trainer-difficulty-import]");
  const replaceInput = root.querySelector("[data-trainer-difficulty-replace]");
  const status = root.querySelector("[data-trainer-difficulty-status]");
  if (!exportButton || !importInput || !replaceInput || !status) {
    throw new TypeError("Commandes auteur PNJ incomplètes.");
  }
  let disposed = false;
  const read = () => normalizeCaptureTrainerDifficultyAuthorFieldsV1(
    fields.map(({hp,damage}) => ({
      hpMultiplier: hp.value,
      outgoingDamagePctBonus: damage.value
    }))
  );
  const hasEdits = () => fields.some(({hp,damage}) =>
    String(hp.value).trim() || String(damage.value).trim()
  );
  function apply(policy, {replace = false} = {}) {
    if (disposed) throw new Error("Panneau auteur PNJ fermé.");
    if (hasEdits() && !replace) {
      throw new Error("Coche le remplacement explicite avant d'importer sur des valeurs existantes.");
    }
    const verified = normalizeCaptureTrainerDifficultyPolicyV1(policy);
    fields.forEach(({hp,damage}, index) => {
      hp.value = String(verified.levels[index].hpMultiplier);
      damage.value = String(verified.levels[index].outgoingDamagePctBonus);
    });
    status.textContent = "Politique PNJ importée et validée dans l'éditeur, non publiée.";
    status.dataset.tone = "ok";
    return verified;
  }
  function setError(error) {
    status.textContent = error?.message ?? String(error);
    status.dataset.tone = "error";
  }
  function onExport() {
    try {
      const policy = read();
      const blob = new BlobType([JSON.stringify(policy, null, 2) + "\n"], {type: "application/json"});
      const href = urlApi.createObjectURL(blob);
      const link = documentRef.createElement("a");
      link.href = href;
      link.download = "gensrpg-capture-trainer-difficulty-policy-v1.json";
      documentRef.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => urlApi.revokeObjectURL(href), 0);
      status.textContent = "Politique exportée. Publication par le propriétaire Combat après revue et SHA.";
      status.dataset.tone = "ok";
    } catch (error) { setError(error); }
  }
  async function onImport() {
    const file = importInput.files?.[0] ?? null;
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      if (disposed) return;
      apply(json, {replace: replaceInput.checked});
    } catch (error) { if (!disposed) setError(error); }
    finally { importInput.value = ""; }
  }
  exportButton.addEventListener("click", onExport);
  importInput.addEventListener("change", onImport);
  status.textContent = "Aucune politique PNJ définie : les quatre niveaux doivent être saisis par l'auteur.";
  status.dataset.tone = "info";
  return Object.freeze({
    read, apply,
    dispose() {
      if (disposed) return;
      disposed = true;
      exportButton.removeEventListener("click", onExport);
      importInput.removeEventListener("change", onImport);
    }
  });
}
