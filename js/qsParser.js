// js/qsParser.js (1110_R139) - MAB Qualification Slip PDF Text Parser & Validator

export function validateQualificationSlipContent(text) {
  if (!text || typeof text !== 'string') return false;
  const upper = text.toUpperCase();

  const hasMabIssuer = upper.includes("MALAYSIA AIRLINES") || upper.includes("FO/TRNG/FCCERT");
  const hasQualTitle = upper.includes("QUALIFICATION") || upper.includes("CERTIFICATE");
  const hasCertifyPhrase = upper.includes("THIS IS TO CERTIFY THAT") || upper.includes("CIVIL AVIATION REGULATIONS");
  const hasPbnOrOps = upper.includes("PBN") || upper.includes("RVSM") || upper.includes("EDTO") || upper.includes("UPRT") || upper.includes("CHIEF PILOT TRAINING");

  // Rejects Attestation PDFs to prevent mis-uploads
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

  // 1. Extract Pilot Name (Supports both multiline and single-line pdf.js outputs)
  const nameMatch = cleanText.match(/(?:THIS IS TO CERTIFY THAT)\s*\*?\*?\s*([A-Z\s\/\.@]+?)(?=\s*STAFF|\s*LICEN[CS]E|\s*HAS|\s*\*|\n|\r|$)/i) ||
                    cleanText.match(/(?:NAME)\s*[:\-]?\s*([A-Z\s\/\.@]+?)(?=\s*STAFF|\s*LICEN[CS]E|\n|\r|$)/i);
  if (nameMatch && nameMatch[1]) {
    result.pilotName = nameMatch[1].replace(/\*/g, '').trim();
  }

  // 2. Extract Staff Number
  const staffMatch = cleanText.match(/STAFF\s*(?:NUMBER|NO)?\s*[:\-]?\s*([0-9]+)/i);
  if (staffMatch && staffMatch[1]) {
    result.staffNo = staffMatch[1].trim();
  }

  // 3. Extract License Number
  const licMatch = cleanText.match(/LICEN[CS]E\s*(?:NUMBER|NO)?\s*[:\-]?\s*([A-Z0-9\s\-]+?)(?=\s*HAS|\s*ATTENDED|\s*IN|\s*\*|\n|\r|$)/i);
  if (licMatch && licMatch[1]) {
    result.licenseNo = licMatch[1].replace(/\*/g, '').trim();
  }

  // 4. Extract Cert No (Strictly targets numbers following CERT NO or CERTIFICATE NO)
  const certMatch = cleanText.match(/(?:CERT|CERTIFICATE)\s*\.?\s*NO\.?\s*[:\-]?\s*([A-Z0-9]+(?:\s*[\-\/]\s*[A-Z0-9]+)*)/i);
  if (certMatch && certMatch[1]) {
    const val = certMatch[1].replace(/\s+/g, '').trim();
    const ignored = ['OF', 'THIS', 'IS', 'TO', 'CERTIFY', 'CARD', 'QUALIFICATION', 'LICENCE', 'LICENSE', 'NUMBER'];
    if (val && !ignored.includes(val.toUpperCase())) {
      result.certNo = val;
    }
  }

  // 5. Extract Fleet / Aircraft Type
  const fleetMatch = cleanText.match(/QUALIFICATION\s+([A-Z0-9\s\-]+?)(?=\s*THIS IS TO CERTIFY|\s*DATE|\s*PBN|\n|\r|$)/i);
  if (fleetMatch && fleetMatch[1]) {
    result.fleet = fleetMatch[1].trim();
  }

  // 6. Extract Re-issue Date
  const issueMatch = cleanText.match(/RE-?ISSUE\s*DATE\s*[:\-]?\s*([0-9]{1,2}\s*[A-Z]{3}\s*[0-9]{4})/i);
  if (issueMatch && issueMatch[1]) {
    result.issueDateStr = issueMatch[1].trim();
  }

  // 7. Extract Operational & PBN Qualifications with dates
  const opsList = ['ADS-B', 'ADS-C', 'CPDLC', 'EDTO', 'EFB', 'GRF', 'GNSS', 'RVSM', 'TCAS', 'UPRT', 'RAAS', 'LVO', 'RNP 10', 'RNAV 5', 'RNAV 2', 'RNAV 1', 'RNP 4', 'RNP 2', 'RNP 1', 'LNAV', 'LNAV/VNAV', 'RNP AR'];

  opsList.forEach(item => {
    const escaped = item.replace(/\//g, '\\/');
    const regex = new RegExp('(?:' + escaped + ')\\s+(\\d{1,2}\\s+[A-Za-z]{3}\\s+\\d{4})', 'i');
    const match = cleanText.match(regex);
    if (match && match[1]) {
      if (item.startsWith('RNP') || item.startsWith('RNAV') || item.startsWith('LNAV')) {
        result.pbnQuals.push({ name: item, dateText: match[1] });
      } else {
        result.opsQuals.push({ name: item, dateText: match[1] });
      }
    }
  });

  return result;
}
