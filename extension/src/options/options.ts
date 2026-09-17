/**
 * ToneCraft extension — options page: settings + first-run onboarding.
 *
 * Only settings that genuinely work are exposed. Saving the site URL
 * re-validates it strictly (http/https origins only).
 */
import { t } from "../shared/strings";
import { EXTENSION_TONES } from "../shared/constants";
import { getPrefs, setPrefs, normalizeBaseUrl } from "../shared/storage";
import { h, openSite } from "../ui/uiCommon";

async function boot(): Promise<void> {
  const prefs = await getPrefs();
  const baseInput = document.getElementById("base-url") as HTMLInputElement;
  const floating = document.getElementById("floating") as HTMLInputElement;
  const menus = document.getElementById("menus") as HTMLInputElement;
  const tone = document.getElementById("tone") as HTMLSelectElement;
  const status = document.getElementById("status") as HTMLElement;

  baseInput.value = prefs.baseUrl;
  floating.checked = prefs.floatingButton;
  menus.checked = prefs.contextMenu;
  for (const tn of EXTENSION_TONES) {
    const o = document.createElement("option");
    o.value = tn.id;
    o.textContent = tn.label;
    if (tn.id === prefs.defaultTone) o.selected = true;
    tone.appendChild(o);
  }

  if (!prefs.onboardingDone) renderOnboarding();

  (document.getElementById("save") as HTMLElement).addEventListener("click", () => {
    const normalized = normalizeBaseUrl(baseInput.value);
    if (baseInput.value.trim() && normalized !== baseInput.value.trim().replace(/\/+$/, "")) {
      // normalizeBaseUrl fell back to default → the input was invalid.
      try {
        const probe = new URL(baseInput.value.trim());
        if (probe.protocol !== "https:" && probe.protocol !== "http:") throw new Error("scheme");
      } catch {
        status.textContent = t("options.invalidUrl");
        return;
      }
    }
    void setPrefs({
      baseUrl: normalized,
      floatingButton: floating.checked,
      contextMenu: menus.checked,
      defaultTone: tone.value,
      onboardingDone: true,
    }).then(() => {
      baseInput.value = normalized;
      status.textContent = t("options.saved");
      document.getElementById("onboarding")?.replaceChildren();
    });
  });

  (document.getElementById("privacy") as HTMLElement).addEventListener("click", () => openSite("/privacy"));
  (document.getElementById("account") as HTMLElement).addEventListener("click", () => openSite("/settings"));
}

function renderOnboarding(): void {
  const slot = document.getElementById("onboarding") as HTMLElement;
  const card = h("div", "tc-card");
  card.appendChild(h("h2", "", t("onboarding.title")));
  const steps = h("ol", "tc-steps");
  for (const key of ["onboarding.pin", "onboarding.signin", "onboarding.select", "onboarding.insert"] as const) {
    steps.appendChild(h("li", "", t(key)));
  }
  card.appendChild(steps);
  const row = h("div", "tc-row");
  const skip = h("button", "tc-ghost", t("onboarding.skip"));
  skip.addEventListener("click", () => {
    void setPrefs({ onboardingDone: true }).then(() => slot.replaceChildren());
  });
  row.appendChild(skip);
  card.appendChild(row);
  slot.appendChild(card);
}

void boot();
