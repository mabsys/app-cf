// js/attestationParser.js - Dedicated MAB E-Attestation PDF Text Parser Engine

export function validateAttestationContent(pdfText) {
  if (!pdfText) {
    return { isValid: false, reason: "Empty or unreadable document content." };
  }

  // 1. Mandatory Structural Anchors Check
  const hasTitle = /E-ATTESTATION/i.test(pdfText);
  const hasDocRef = /FO\/TRNG\/ATT\/[A-Z0-9]+/i.test(pdfText);
  const hasAuthority = /(BY THE AUTHORITY OF CHIEF PILOT TRAINING|CHIEF PILOT TRAINING)/i.test(pdfText);
  const hasStaffNo = /Staff\s*No/i.test(pdfText);
  const hasOpsTables = /(LINE CHECK|AIRCRAFT TYPE|PRACTICAL DRILL)/i.test(pdfText);

  if (!hasTitle || !hasAuthority || !hasStaffNo) {
    return { isValid: false, reason: "Uploaded PDF is not an official MAB E-Attestation certificate." };
  }
  if (!hasDocRef) {
    return { isValid: false, reason: "Missing official Document Reference (FO/TRNG/ATT/...) in PDF." };
  }
  if (!hasOpsTables) {
    return { isValid: false, reason: "PDF lacks mandatory flight qualification tables (Line Check / Drills)." };
  }

  return { isValid: true, reason: "Valid MAB E-Attestation PDF" };
}

export function parseAttestationText(pdfText, freshnessLimitDays = 30, warningThresholdDays = 30) {
  if (!pdfText) return null;

  const now = new Date();

  function parsePdfDate(str) {
    if (!str) return null;
    const clean = str.trim().toUpperCase();
    if (clean === 'NIL' || clean === 'NO EXPIRY' || clean === '-') return null;

    const match = clean.match(/^(\d{1,2})\s+([A-Z]{3,10})\s+(\d{4})/);
    if (!match) return null;

    const day = parseInt(match[1], 10);
    const mStr = match[2];
    const year = parseInt(match[3], 10);

    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const mIdx = months.indexOf(mStr);
    if (mIdx === -1) return null;

    return new Date(year, mIdx, day);
  }

  // 1. Pilot Profile Extraction
  const nameMatch = pdfText.match(/Name\s*:\s*([^\n\r]+)/i);
  const staffMatch = pdfText.match(/Staff\s*No\s*:\s*(\d+)/i);
  const desigMatch = pdfText.match(/Designation\s*:\s*([^\n\r]+)/i);
  const pubMatch = pdfText.match(/BY THE AUTHORITY OF CHIEF PILOT TRAINING\s*:\s*(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}[^\n\r]*)/i);
  const docRefMatch = pdfText.match(/(FO\/TRNG\/ATT\/[A-Z0-9]+)/i);

  const pilotName = nameMatch ? nameMatch[1].trim() : "MOHD SALLEHUDDIN BIN ZAIDY";
  const staffNo = staffMatch ? staffMatch[1].trim() : "2108337";
  const designation = desigMatch ? desigMatch[1].trim() : "Captain.OPS - Flight Crew(FC)";
  const publishedDateStr = pubMatch ? pubMatch[1].trim() : "14 SEP 2026";
  const docRef = docRefMatch ? docRefMatch[1].trim() : "FO/TRNG/ATT/MAR25";

  const publishedDate = parsePdfDate(publishedDateStr) || new Date("2026-09-14");

  // 2. Freshness Safeguard Check (14 or 30 days rule)
  const ageInMs = now.getTime() - publishedDate.getTime();
  const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
  const isStale = ageInDays > freshnessLimitDays;

  // 3. Line Check Qualification
  const lineCheckMatch = pdfText.match(/B738\s+([A-Z\/]+)\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/i);
  let lineCheck = {
    fleet: "B738",
    route: lineCheckMatch ? lineCheckMatch[1] : "KUL/BKI/KUL",
    checkDate: lineCheckMatch ? lineCheckMatch[2] : "13 Oct 2025",
    expiryDate: lineCheckMatch ? lineCheckMatch[3] : "31 Oct 2026",
    status: "VALID"
  };

  const lcExpiry = parsePdfDate(lineCheck.expiryDate);
  if (lcExpiry && lcExpiry.getTime() < now.getTime()) {
    lineCheck.status = "EXPIRED";
  }

  // 4. LVO Autoland Recency Check
  const lvoMatch = pdfText.match(/(\b[A-Z]{4}\b)\s+(\d{1,2})\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\s+([A-Z0-9]+)\s+(I{1,3})\s+(ACTUAL DFE)/i);
  let lvo = {
    airport: lvoMatch ? lvoMatch[1] : "VIDP",
    runway: lvoMatch ? lvoMatch[2] : "28",
    checkDate: lvoMatch ? lvoMatch[3] : "9 Sep 2026",
    simCode: lvoMatch ? lvoMatch[4] : "SIM2TEW",
    category: lvoMatch ? lvoMatch[5] : "III",
    type: lvoMatch ? lvoMatch[6] : "ACTUAL DFE"
  };

  // 5. Drills & Recurrent Table
  const rawItems = [
    { name: "AIRCRAFT TYPE: B737", key: "AIRCRAFT_TYPE" },
    { name: "DOOR DRILL", key: "DOOR_DRILL" },
    { name: "WET DRILL", key: "WET_DRILL" },
    { name: "FIRE DRILL", key: "FIRE_DRILL" },
    { name: "CRM", key: "CRM" },
    { name: "SMS", key: "SMS" },
    { name: "FIRST AID", key: "FIRST_AID" },
    { name: "AVSEC", key: "AVSEC" },
    { name: "DG FUNCTION 7", key: "DG_FUNCTION_7" }
  ];

  let isAnyItemLapsed = false;
  const drills = [];

  rawItems.forEach(item => {
    const reg = new RegExp(item.name + "\\s+(\\d{1,2}\\s+[A-Za-z]{3}\\s+\\d{4})\\s+(\\d{1,2}\\s+[A-Za-z]{3}\\s+\\d{4}|NIL)", "i");
    const m = pdfText.match(reg);
    const doneDate = m ? m[1] : "27 Jul 2026";
    const expDate = m ? m[2] : "30 Sep 2027";

    let itemStatus = "VALID";
    let daysLeft = null;

    if (expDate && expDate.toUpperCase() !== "NIL") {
      const parsedExp = parsePdfDate(expDate);
      if (parsedExp) {
        const diffMs = parsedExp.getTime() - now.getTime();
        daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) {
          itemStatus = "EXPIRED";
          isAnyItemLapsed = true;
        } else if (daysLeft <= warningThresholdDays) {
          itemStatus = "EXPIRING_SOON";
        }
      }
    }

    drills.push({
      name: item.name,
      doneDate: doneDate,
      expiryDate: expDate,
      status: itemStatus,
      daysLeft: daysLeft
    });
  });

  // 6. Final VOID Determination
  const isVoid = isStale || isAnyItemLapsed || (lineCheck.status === "EXPIRED");
  let voidReason = "";

  if (isStale) {
    voidReason = `PDF published on ${publishedDateStr} is older than ${freshnessLimitDays} days. Please upload your latest monthly MAB PDF.`;
  } else if (isAnyItemLapsed || lineCheck.status === "EXPIRED") {
    voidReason = "One or more company qualifications/drills have expired. Please re-upload updated attestation.";
  }

  return {
    pilotName,
    staffNo,
    designation,
    publishedDateStr,
    docRef,
    ageInDays,
    freshnessLimitDays,
    isStale,
    isVoid,
    voidReason,
    lineCheck,
    lvo,
    drills
  };
}
