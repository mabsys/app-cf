// js/qsParser.js (1110_R140) - MAB Qualification Slip Laser String Parser

export function validateQualificationSlipContent(text) {
  if (!text || typeof text !== 'string') return false;
  const upper = text.toUpperCase();

  const hasMabIssuer = upper.includes("MALAYSIA AIRLINES") || upper.includes("FO/TRNG/FCCERT");
  const hasQualTitle = upper.includes("QUALIFICATION") || upper.includes("CERTIFICATE");
  const hasCertifyPhrase = upper.includes("THIS IS TO CERTIFY THAT") || upper.includes("CIVIL AVIATION REGULATIONS");
  const hasPbnOrOps = upper.includes("PBN") || upper.includes("RVSM") || upper.includes("EDTO") || upper.includes("UPRT") || upper.includes("CHIEF PILOT TRAINING");

  const isAttestation = upper.includes("CREW ATTESTATION CERTIFICATE") || upper.includes("LVO AUTOLAND");

  return hasMabIssuer && hasQualTitle && (hasCertifyPhrase || hasPbnOrOps) && !isAttestation;
}

export function parseQualificationSlipText(text) {
  if (!text || typeof text !== 'string') return null;

  const cleanText = text.replace(/\r\n/g, '\n');

  const result = {
    pilotName: '',
    staffNo: '',
    licenseNo: '',
    certNo: '',
    issueDateStr: '',
    fleet: '',
    pbnQuals: [],
    opsQuals: []
  };

  // Laser extraction for CERT NO: <value>
  const certMatch = cleanText.match(/(?:CERT|CERTIFICATE)\s*\.?\s*NO\.?\s*[:\-]?\s*([^\s\r\n]+)/i);
  if (certMatch && certMatch[1]) {
    const val = certMatch[1].trim();
    const ignored = ['OF', 'THIS', 'IS', 'TO', 'CERTIFY', 'CARD', 'QUALIFICATION', 'LICENCE', 'LICENSE', 'NUMBER'];
    if (!ignored.includes(val.toUpperCase())) {
      result.certNo = val;
    }
  }

  // Fallback extraction for Staff Number
  const staffMatch = cleanText.match(/STAFF NUMBER\s*[:\-]?\s*([0-9]+)/i);
  if (staffMatch) {
    result.staffNo = staffMatch[1].trim();
  }

  // Extract Fleet / Aircraft Type
  const fleetMatch = cleanText.match(/QUALIFICATION\s+([A-Z0-9\s\-]+?)(?=\n|THIS IS TO CERTIFY)/i);
  if (fleetMatch) {
    result.fleet = fleetMatch[1].trim();
  }

  // Extract Re-issue Date
  const issueMatch = cleanText.match(/RE-ISSUE DATE\s*[:\-]?\s*([0-9]{1,2}[A-Z]{3}[0-9]{4})/i);
  if (issueMatch) {
    result.issueDateStr = issueMatch[1].trim();
  }

  // Extract Operational & PBN Qualifications with dates
  const opsList = ['ADS-B', 'ADS-C', 'CPDLC', 'EDTO', 'EFB', 'GRF', 'GNSS', 'RVSM', 'TCAS', 'UPRT', 'RAAS', 'LVO', 'RNP 10', 'RNAV 5', 'RNAV 2', 'RNAV 1', 'RNP 4', 'RNP 2', 'RNP 1', 'LNAV', 'LNAV/VNAV', 'RNP AR'];
  
  opsList.forEach(item => {
    const escaped = item.replace(/\//g, '\\/');
    const regex = new RegExp('(?:' + escaped + ')\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})', 'i');
    const match = cleanText.match(regex);
    if (match) {
      if (item.startsWith('RNP') || item.startsWith('RNAV') || item.startsWith('LNAV')) {
        result.pbnQuals.push({ name: item, dateText: match[1] });
      } else {
        result.opsQuals.push({ name: item, dateText: match[1] });
      }
    }
  });

  return result;
}
