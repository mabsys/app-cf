// js/qsParser.js (1110_R142) - MAB Qualification Slip PDF Text Parser & Validator

export function validateQualificationSlipContent(text) {
  if (!text || typeof text !== 'string') return false;
  const upper = text.toUpperCase();

  // Rejects Attestation PDFs to prevent mis-uploads
  const isAttestation = upper.includes("CREW ATTESTATION CERTIFICATE") || upper.includes("LVO AUTOLAND");
  if (isAttestation) return false;

  // Validates if document contains MAB or Qualification or Cert keywords
  const hasMab = upper.includes("MALAYSIA AIRLINES") || upper.includes("FO/TRNG/FCCERT") || upper.includes("QUALIFICATION") || upper.includes("CERT NO") || upper.includes("CERTIFICATE") || upper.includes("THIS IS TO CERTIFY THAT");

  return hasMab;
}

export function parseQualificationSlipText(text) {
  if (!text || typeof text !== 'string') return { certNo: '-' };

  let certNo = '-';

  // Direct regex: Match string following "CERT NO:" or "CERTIFICATE NO:"
  const match = text.match(/(?:CERT|CERTIFICATE)\s*\.?\s*NO\.?\s*[:\-]?\s*([A-Z0-9\-\/]+(?:\s*[\-\/]\s*[A-Z0-9\-\/]+)*)/i);
  if (match && match[1]) {
    let raw = match[1].trim();
    const keywords = ['DATE', 'SIGNATURE', 'PBN', 'QUALIFICATION', 'THIS', 'STAFF', 'LICENCE', 'LICENSE', 'MALAYSIA', 'RE-ISSUE'];
    for (const kw of keywords) {
      const idx = raw.toUpperCase().indexOf(kw);
      if (idx !== -1) {
        raw = raw.substring(0, idx).trim();
      }
    }
    raw = raw.replace(/\s*([\-\/])\s*/g, '$1').trim();
    if (raw && !['OF', 'THIS', 'IS', 'TO', 'CERTIFY'].includes(raw.toUpperCase())) {
      certNo = raw;
    }
  }

  // Fallback match if delimiter was spaces or missing
  if (certNo === '-') {
    const fallbackMatch = text.match(/CERT\s*NO\s*[:\-]?\s*(\S+)/i);
    if (fallbackMatch && fallbackMatch[1]) {
      certNo = fallbackMatch[1].trim();
    }
  }

  return {
    pilotName: '',
    staffNo: '',
    licenseNo: '',
    certNo: certNo,
    issueDateStr: '',
    fleet: '',
    pbnQuals: [],
    opsQuals: []
  };
}
