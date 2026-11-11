// Pure presentation of Combat Runtime onProgress snapshots. No local clock.
function clampProgress(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.max(0, Math.min(1, number))
    : 0;
}

function remainingSecondsLabel(ms) {
  const value = Number(ms);
  const seconds = Number.isFinite(value)
    ? Math.max(0, value) / 1000
    : 0;
  return seconds.toFixed(1).replace(".", ",");
}

export function projectCombatCastChargeV1({
  active = false,
  value = 0,
  actionName = "",
  remainingMs = 0
} = {}) {
  if (!active) {
    return Object.freeze({
      active: false,
      progress: 0,
      percent: 0,
      readout: "",
      accessibleLabel: "Aucune préparation en cours"
    });
  }
  const progress = clampProgress(value);
  const percent = Math.round(progress * 100);
  const seconds = remainingSecondsLabel(remainingMs);
  const label = String(actionName ?? "").trim() || "Capacité";
  const unit = Number(seconds.replace(",", ".")) > 1 ? "secondes restantes" : "seconde restante";
  return Object.freeze({
    active: true,
    progress,
    percent,
    readout: percent + " % · " + seconds + " s",
    accessibleLabel: "Préparation : " + label + ", " + percent + " %, " + seconds + " " + unit
  });
}

export function createCombatCastChargePresenterV1({ bar }) {
  if (!bar?.ownerDocument?.createElement || !bar?.parentNode?.insertBefore) {
    throw new TypeError("Cast charge presenter needs a mounted progress bar");
  }
  const parent = bar.parentNode;
  const readout = bar.ownerDocument.createElement("span");
  readout.className = "squad-card__charge-readout";
  readout.setAttribute("data-combat-charge-readout", "");
  readout.setAttribute("aria-hidden", "true");
  readout.hidden = true;
  parent.insertBefore(readout, bar);
  const row = bar.ownerDocument.createElement("span");
  row.className = "squad-card__charge-row";
  row.dataset.hasIcon = "false";
  parent.insertBefore(row, bar);
  const skillIcon = bar.ownerDocument.createElement("img");
  skillIcon.className = "squad-card__charge-skill-icon";
  skillIcon.setAttribute("data-combat-charge-skill-icon", "");
  skillIcon.setAttribute("aria-hidden", "true");
  skillIcon.alt = "";
  skillIcon.hidden = true;
  row.append(skillIcon, bar);
  return Object.freeze({
    render(snapshot = {}) {
      const projection = projectCombatCastChargeV1(snapshot);
      bar.max = 1;
      bar.value = projection.progress;
      bar.dataset.active = projection.active ? "true" : "false";
      bar.setAttribute("aria-label", projection.accessibleLabel);
      bar.setAttribute("aria-valuetext", projection.accessibleLabel);
      readout.textContent = projection.readout;
      readout.hidden = !projection.active;
      const iconUrl = typeof snapshot.iconUrl === "string" ? snapshot.iconUrl.trim() : "";
      const showIcon = projection.active && iconUrl.length > 0;
      row.dataset.hasIcon = showIcon ? "true" : "false";
      skillIcon.hidden = !showIcon;
      if (showIcon && skillIcon.getAttribute("src") !== iconUrl) skillIcon.src = iconUrl;
      return projection;
    }
  });
}
