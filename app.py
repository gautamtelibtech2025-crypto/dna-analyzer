"""
app.py — Flask server for the DNA Bioinformatics Analyzer.

Routes:
  GET /               → Serves the main HTML page.
  GET /api/search     → Searches NCBI for a gene name (query param: gene).
  GET /api/analyze    → Fetches + analyzes a sequence (query param: id).
"""

from flask import Flask, render_template, request, jsonify
from bio_utils import search_gene, fetch_sequence, analyze_sequence

app = Flask(__name__)


@app.route("/")
def index():
    """Serve the main single-page application."""
    return render_template("index.html")


@app.route("/api/search")
def api_search():
    """
    Search NCBI for a gene name.
    Example: /api/search?gene=BRCA1
    """
    gene = request.args.get("gene", "").strip()
    if not gene:
        return jsonify({"error": "Please provide a gene name."}), 400

    result = search_gene(gene)
    if "error" in result:
        return jsonify(result), 404

    return jsonify(result)


@app.route("/api/analyze")
def api_analyze():
    """
    Fetch a DNA sequence by accession ID and run full analysis.
    Example: /api/analyze?id=NM_007294.4
    """
    acc_id = request.args.get("id", "").strip()
    if not acc_id:
        return jsonify({"error": "Please provide an accession ID."}), 400

    # Step 1: Fetch the sequence from NCBI
    fetch_result = fetch_sequence(acc_id)
    if "error" in fetch_result:
        return jsonify(fetch_result), 500

    # Step 2: Run the full analysis
    analysis = analyze_sequence(fetch_result["sequence"])
    analysis["description"] = fetch_result["description"]

    return jsonify(analysis)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
