"""
bio_utils.py — Modular bioinformatics helper functions.

Uses BioPython's Entrez API to search NCBI and fetch DNA sequences,
then performs standard analyses: GC content, reverse complement,
protein translation, and codon frequency.
"""

from Bio import Entrez, SeqIO
from Bio.Seq import Seq
from Bio.SeqUtils import gc_fraction
from collections import Counter
import io

# NCBI requires an email for Entrez API usage
Entrez.email = "dna.analyzer.app@example.com"


def search_gene(gene_name, max_results=3):
    """
    Search NCBI Nucleotide database for a gene name.
    Returns a list of top results with id, title, and length.
    """
    try:
        # Search the NCBI nucleotide database
        handle = Entrez.esearch(
            db="nucleotide",
            term=f"{gene_name}[Gene Name] AND Homo sapiens[Organism]",
            retmax=max_results,
            sort="relevance"
        )
        record = Entrez.read(handle)
        handle.close()

        ids = record.get("IdList", [])
        if not ids:
            return {"error": f"No results found for '{gene_name}'."}

        # Fetch summary info for each result
        handle = Entrez.esummary(db="nucleotide", id=",".join(ids))
        summaries = Entrez.read(handle)
        handle.close()

        results = []
        for item in summaries:
            results.append({
                "id": str(item["Id"]),
                "title": item.get("Title", "Unknown"),
                "accession": item.get("Caption", "N/A"),
                "length": item.get("Length", 0),
            })

        return {"results": results}

    except Exception as e:
        return {"error": f"NCBI search failed: {str(e)}"}


def fetch_sequence(accession_id):
    """
    Fetch the full FASTA sequence from NCBI by accession/ID.
    Returns the raw sequence string and description.
    """
    try:
        handle = Entrez.efetch(
            db="nucleotide",
            id=accession_id,
            rettype="fasta",
            retmode="text"
        )
        fasta_data = handle.read()
        handle.close()

        # Parse the FASTA string
        record = SeqIO.read(io.StringIO(fasta_data), "fasta")
        return {
            "sequence": str(record.seq),
            "description": record.description,
        }

    except Exception as e:
        return {"error": f"Failed to fetch sequence: {str(e)}"}


def analyze_sequence(seq_str):
    """
    Run a full bioinformatics analysis on a DNA sequence string.
    Returns a dict with all results.
    """
    seq = Seq(seq_str.upper())

    # 1. Basic info
    length = len(seq)
    preview = str(seq[:200])  # First 200 bases as a preview

    # 2. GC content (percentage)
    gc_content = round(gc_fraction(seq) * 100, 2)

    # 3. Individual nucleotide counts (for the bar chart)
    a_count = seq_str.upper().count("A")
    t_count = seq_str.upper().count("T")
    g_count = seq_str.upper().count("G")
    c_count = seq_str.upper().count("C")

    # 4. Reverse complement
    rev_comp = str(seq.reverse_complement()[:200])  # Preview only

    # 5. Protein translation
    #    We trim the sequence to a multiple of 3 to avoid BioP warnings
    trimmed = seq[: (length // 3) * 3]
    try:
        protein = str(trimmed.translate())
        # Truncate to first 300 amino acids to keep the response manageable
        protein_preview = protein[:300]
        protein_full_length = len(protein)
    except Exception:
        protein_preview = "Translation not available for this sequence."
        protein_full_length = 0

    # 6. Codon frequency (top 20 most common)
    codons = [str(seq[i:i + 3]) for i in range(0, len(trimmed), 3)]
    codon_freq = dict(Counter(codons).most_common(20))

    return {
        "length": length,
        "preview": preview,
        "gc_content": gc_content,
        "nucleotides": {"A": a_count, "T": t_count, "G": g_count, "C": c_count},
        "reverse_complement": rev_comp,
        "protein_preview": protein_preview,
        "protein_full_length": protein_full_length,
        "codon_frequency": codon_freq,
    }
