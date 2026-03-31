# DNA Bioinformatics Analyzer

A beginner-friendly Flask + BioPython web app that fetches DNA sequences from NCBI and runs basic bioinformatics analysis.

## Features

- Search by gene name (example: `BRCA1`)
- Top 3 NCBI matches to choose from
- DNA sequence preview (first 200 bases)
- Sequence length
- GC content percentage
- Reverse complement preview
- Protein translation preview (first 300 amino acids)
- Codon frequency (top 20 codons)
- GC vs AT bar chart using Chart.js
- Graceful error handling for API and network issues

## Project Structure

```text
.
├── app.py
├── bio_utils.py
├── requirements.txt
├── templates/
│   └── index.html
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

## Prerequisites

- Python 3.10-3.13 recommended
- Internet access (required for NCBI API calls)

Note: Python 3.14 may require local C++ build tools to compile BioPython from source.

## Setup and Run (Windows PowerShell)

1. Open terminal in the project folder.
2. Create a virtual environment:

```powershell
python -m venv .venv
```

3. Activate the virtual environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

4. Install dependencies:

```powershell
pip install -r requirements.txt
```

5. (Optional but recommended) Set your email for NCBI Entrez requests:

```powershell
$env:ENTREZ_EMAIL = "your-email@example.com"
```

6. Run the Flask app:

```powershell
python app.py
```

7. Open your browser at:

- http://127.0.0.1:5000

## How It Works

- `GET /api/search?gene=<name>` searches NCBI and returns top 3 matches.
- `GET /api/analyze?id=<ncbi_id>` fetches FASTA sequence and returns analysis JSON.

Core analysis logic is in `bio_utils.py` with separate functions for:

- GC content
- Reverse complement
- Protein translation
- Codon frequency

## Notes

- If NCBI is slow or busy, the app may return a temporary error message.
- Protein output is intentionally truncated to keep the UI responsive.
