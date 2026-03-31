/**
 * app.js — Client-side logic for the DNA Bioinformatics Analyzer.
 *
 * Handles:
 *  1. Gene search  → fetches top 3 results from /api/search
 *  2. Analyze       → fetches analysis from /api/analyze, renders cards + chart
 *  3. Loading spinner and error toast helpers
 */

// ── DOM ELEMENTS ─────────────────────────────────────────
const geneInput = document.getElementById("gene-input");
const searchBtn = document.getElementById("search-btn");
const errorToast = document.getElementById("error-toast");
const errorMessage = document.getElementById("error-message");
const resultsSelect = document.getElementById("results-select");
const resultCards = document.getElementById("result-cards");
const spinner = document.getElementById("spinner");
const analysisEl = document.getElementById("analysis");

// Allow pressing Enter to search
geneInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchGene();
});

// ── HELPERS ──────────────────────────────────────────────
function showSpinner() { spinner.classList.remove("hidden"); }
function hideSpinner() { spinner.classList.add("hidden"); }

function showError(msg) {
    errorMessage.textContent = msg;
    errorToast.classList.remove("hidden");
    // Auto-hide after 6 seconds
    setTimeout(() => errorToast.classList.add("hidden"), 6000);
}

function hideError() { errorToast.classList.add("hidden"); }

function hideResults() {
    resultsSelect.classList.add("hidden");
    analysisEl.classList.add("hidden");
}

/** Format a number with commas (e.g. 12345 → "12,345") */
function fmt(n) {
    return Number(n).toLocaleString();
}

// ── SEARCH GENE ──────────────────────────────────────────
async function searchGene() {
    const gene = geneInput.value.trim();
    if (!gene) { showError("Please enter a gene name."); return; }

    hideError();
    hideResults();
    showSpinner();

    try {
        const res = await fetch(`/api/search?gene=${encodeURIComponent(gene)}`);
        const data = await res.json();

        hideSpinner();

        if (data.error) {
            showError(data.error);
            return;
        }

        renderSearchResults(data.results);
    } catch (err) {
        hideSpinner();
        showError("Network error — please check your connection and try again.");
    }
}

// ── RENDER SEARCH RESULTS ────────────────────────────────
function renderSearchResults(results) {
    resultCards.innerHTML = "";

    results.forEach((item) => {
        const card = document.createElement("div");
        card.className = "result-card";
        card.onclick = () => analyzeGene(item.id, item.title);

        card.innerHTML = `
            <div class="rc-title">${escapeHTML(item.title)}</div>
            <div class="rc-meta">
                <span><strong>Accession:</strong> ${escapeHTML(item.accession)}</span>
                <span><strong>Length:</strong> ${fmt(item.length)} bp</span>
            </div>
        `;

        resultCards.appendChild(card);
    });

    resultsSelect.classList.remove("hidden");
}

// ── ANALYZE GENE ─────────────────────────────────────────
async function analyzeGene(accessionId, title) {
    hideError();
    resultsSelect.classList.add("hidden");
    showSpinner();

    try {
        const res = await fetch(`/api/analyze?id=${encodeURIComponent(accessionId)}`);
        const data = await res.json();

        hideSpinner();

        if (data.error) {
            showError(data.error);
            return;
        }

        renderAnalysis(data, title);
    } catch (err) {
        hideSpinner();
        showError("Analysis failed — the NCBI server may be busy. Try again.");
    }
}

// ── RENDER ANALYSIS ──────────────────────────────────────
let chartInstance = null;      // Keep a reference so we can destroy & recreate

function renderAnalysis(data) {
    // Title
    document.getElementById("analysis-title").textContent = data.description || "Analysis Results";

    // Sequence length + GC content stats
    document.getElementById("seq-length").textContent = fmt(data.length) + " bp";
    document.getElementById("gc-value").textContent = data.gc_content + " %";

    // Sequence previews
    document.getElementById("seq-preview").textContent = data.preview;
    document.getElementById("rev-comp").textContent = data.reverse_complement;

    // Protein
    document.getElementById("protein-meta").textContent =
        `Showing first 300 of ${fmt(data.protein_full_length)} amino acids`;
    document.getElementById("protein-seq").textContent = data.protein_preview;

    // Codon frequency grid
    const codonGrid = document.getElementById("codon-grid");
    codonGrid.innerHTML = "";
    for (const [codon, count] of Object.entries(data.codon_frequency)) {
        const el = document.createElement("div");
        el.className = "codon-item";
        el.innerHTML = `<span class="codon-name">${codon}</span>
                        <span class="codon-count">${fmt(count)}</span>`;
        codonGrid.appendChild(el);
    }

    // Nucleotide chart (Chart.js)
    renderChart(data.nucleotides, data.gc_content);

    // Show the analysis section
    analysisEl.classList.remove("hidden");

    // Smooth-scroll to results
    analysisEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── CHART ────────────────────────────────────────────────
function renderChart(nucleotides, gcPercent) {
    const ctx = document.getElementById("gc-chart").getContext("2d");

    // Destroy previous chart instance if it exists
    if (chartInstance) chartInstance.destroy();

    const labels = Object.keys(nucleotides);
    const values = Object.values(nucleotides);

    const colors = {
        A: "#34c759",   // green
        T: "#ff3b30",   // red
        G: "#5856d6",   // purple
        C: "#0071e3",   // blue
    };

    chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Count",
                data: values,
                backgroundColor: labels.map(l => colors[l] || "#aaa"),
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 64,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: `GC Content: ${gcPercent}%`,
                    font: { size: 14, weight: "600", family: "'Inter', sans-serif" },
                    padding: { bottom: 16 },
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${fmt(ctx.raw)}`,
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (v) => fmt(v),
                        font: { family: "'Inter', sans-serif" },
                    },
                    grid: { color: "#f0f0f0" },
                },
                x: {
                    ticks: {
                        font: { size: 14, weight: "600", family: "'Inter', sans-serif" },
                    },
                    grid: { display: false },
                },
            },
        },
    });
}

// ── SANITIZE HTML ────────────────────────────────────────
function escapeHTML(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}
