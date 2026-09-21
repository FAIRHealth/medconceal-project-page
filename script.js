"use strict";

// Values transcribed from Tables 1 and 3 of the supplied camera-ready PDF.
// Arrays: [fine F1 or success, reveal rate, MBNR or turns to address].
const results = {
  intervention: {
    human: [.427, .487, 7.125],
    short: [["Claude Sonnet 4.5", .293, .313, 5.239], ["Doctor-R1", .150, .347, 6.938], ["GPT-5.2", .077, .087, 5.043], ["Qwen-3.5-9B", .030, .063, 6.333], ["Llama3-OpenBioLLM-8B", .013, .013, 5.500]],
    extended: [["Doctor-R1", .427, .437, 11.164], ["Claude Sonnet 4.5", .333, .337, 5.960], ["GPT-5.2", .126, .140, 8.526], ["Qwen-3.5-9B", .073, .073, 8.591], ["Llama3-OpenBioLLM-8B", .040, .040, 6.417]]
  },
  confirmation: {
    human: [.523, .558, .227],
    short: [["Claude Sonnet 4.5", .503, .522, .270], ["Doctor-R1", .489, .348, .397], ["GPT-5.2", .485, .247, .540], ["Qwen-3.5-9B", .193, .431, .057], ["Llama3-OpenBioLLM-8B", .143, .520, .003]],
    extended: [["GPT-5.2", .512, .252, .533], ["Claude Sonnet 4.5", .509, .542, .297], ["Llama3-OpenBioLLM-8B", .480, .944, .013], ["Doctor-R1", .308, .762, .087], ["Qwen-3.5-9B", .079, .934, .006]]
  }
};
let task = "intervention";
const percent = value => `${(value * 100).toFixed(1)}%`;
function renderResults() {
  const budget = document.querySelector("#budget").value;
  const confirmation = task === "confirmation";
  const data = results[task];
  const rows = [["Human clinicians", ...data.human], ...data[budget]];
  document.querySelector("#results-body").replaceChildren(...rows.map(([name, primary, reveal, extra], index) => {
    const row = document.createElement("tr");
    if (!index) row.className = "human-row";
    const heading = document.createElement("th");
    heading.scope = "row";
    heading.textContent = name;
    if (!index) {
      const reference = document.createElement("span");
      reference.textContent = confirmation ? "Original human summary" : "Observed reference";
      heading.append(reference);
    }
    const primaryCell = document.createElement("td");
    primaryCell.textContent = confirmation ? primary.toFixed(3) : percent(primary);
    const bar = document.createElement("span");
    bar.className = "result-bar";
    bar.setAttribute("aria-hidden", "true");
    const fill = document.createElement("i");
    fill.style.setProperty("--value", percent(primary));
    bar.append(fill);
    primaryCell.append(bar);
    const revealCell = document.createElement("td");
    revealCell.textContent = percent(reveal);
    const extraCell = document.createElement("td");
    extraCell.textContent = confirmation ? percent(extra) : extra.toFixed(3);
    row.append(heading, primaryCell, revealCell, extraCell);
    return row;
  }));
  document.querySelector("#metric-primary").textContent = confirmation ? "Fine-grained F1 ↑" : "Success ↑";
  document.querySelector("#metric-extra").textContent = confirmation ? "Matched-but-no-reveal ↓" : "Turn-to-Address ↓";
  document.querySelector("#table-caption").textContent = `${confirmation ? "Confirmation" : "Intervention"} performance · ${budget === "short" ? "AI 8-turn setting" : confirmation ? "AI adaptive setting, 20-turn cap" : "AI 20-turn setting"}`;
  const baseNote = confirmation
    ? "Fine-grained F1 measures recovery of case-specific concerns; matched-but-no-reveal is the share of cases with at least one matched finding but no gold concern revealed in the trace. Human values use original submitted findings; the paper also reports a separate Claude-summary hybrid reference (F1 0.567)."
    : "Success means the primary concern reached the simulator’s addressed state. Turn-to-Address records the first turn at which the primary concern becomes addressed.";
  const budgetNote = budget === "extended"
    ? confirmation ? " Extended AI runs may self-stop after turn 5, with a 20-turn cap. They are longer than observed human conversations and are not a matched-length comparison." : " Extended AI runs end when the concern is addressed or at the 20-turn cap; adaptive self-stop is disabled. This is not a matched-length comparison."
    : " Human conversations averaged 8.2 turns; they are an observed reference, not an 8-turn-capped condition.";
  document.querySelector("#results-note").textContent = baseNote + budgetNote;
  const source = document.querySelector("#results-source");
  source.textContent = confirmation ? "Table 1" : "Table 3";
  source.href = `assets/medconceal-paper.pdf#page=${confirmation ? 7 : 8}`;
}
document.querySelectorAll("[data-task]").forEach(button => button.addEventListener("click", () => {
  task = button.dataset.task;
  document.querySelectorAll("[data-task]").forEach(item => {
    const active = item === button;
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  renderResults();
}));
document.querySelector("#budget").addEventListener("change", renderResults);
renderResults();

const caseSteps = [
  ["What the clinician sees", "A patient with a knee injury.", "The clinical presentation suggests a need for further evaluation. But the visible problem does not explain what could prevent the patient from accessing care.", "A recommendation alone may miss the barrier.", "Reveal the hidden concern"],
  ["What needs to be elicited", "Care is difficult to reach.", "The patient faces cost and travel constraints while living on a remote island. In the reported human-only success case, the clinician elicits these access barriers.", "The obstacle is practical access, not just medical uncertainty.", "See the concern-specific response"],
  ["How the response changes", "A plan that accounts for access.", "The human clinician proposes telehealth after eliciting the constraints. Doctor-R1 recommends orthopedic evaluation from the outset but never surfaces the access concern in this case.", "Probe first. Then connect the plan to the concern.", "Restart the walkthrough"]
];
let caseStep = 0;
function renderCase() {
  const content = caseSteps[caseStep];
  ["case-stage", "case-heading", "case-text", "case-insight"].forEach((id, index) => { document.getElementById(id).textContent = content[index]; });
  document.querySelector("#case-next").replaceChildren(document.createTextNode(content[4] + " "));
  const arrow = document.createElement("span"); arrow.setAttribute("aria-hidden", "true"); arrow.textContent = "→";
  document.querySelector("#case-next").append(arrow);
  document.querySelector("#case-progress").textContent = `${caseStep + 1} / 3`;
  document.querySelectorAll("[data-step]").forEach(button => { const active = Number(button.dataset.step) === caseStep; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); });
}
document.querySelectorAll("[data-step]").forEach(button => button.addEventListener("click", () => { caseStep = Number(button.dataset.step); renderCase(); }));
document.querySelector("#case-next").addEventListener("click", () => { caseStep = (caseStep + 1) % 3; renderCase(); });
document.querySelector("#copy-citation").addEventListener("click", async () => {
  const citation = document.querySelector("#bibtex").textContent;
  const status = document.querySelector("#copy-status");
  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(citation);
    status.textContent = "BibTeX copied to clipboard.";
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(document.querySelector("#bibtex"));
    selection.removeAllRanges(); selection.addRange(range);
    status.textContent = "Citation selected. Press Ctrl+C (or Command+C) to copy, or download the .bib file below.";
  }
});
