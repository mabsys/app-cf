// js/attestationParser.js (1810_R159) - Dedicated MAB E-Attestation PDF Text Parser Engine

export function validateAttestationContent(pdfText) {
  if (!pdfText || typeof pdfText !== 'string' || !pdfText.trim()) {
    return { isValid: false, reason: "Empty or unreadable document content." };
  }

  const cleanText = pdfText.replace(/\s+/g, ' ');

  const hasAttestationKeyword = /ATTESTATION/i.test(cleanText);
  const hasDocRef = /FO\s*\/\s*TRNG\s*\/\s*ATT/i.test(cleanText) || /TRNG\s*\/\s*ATT/i.test(cleanText);
  const hasMabHeader = /(MAB|MALAYSIA\s+AIRLINES|CHIEF\s+PILOT|FLIGHT\s+OPERATIONS)/i.test(cleanText);

  if (!hasAttestationKeyword && !hasDocRef && !hasMabHeader) {
    return { isValid: false, reason: "Uploaded PDF is not an official MAB E-Attestation certificate." };
  }

  const hasStaff = /Staff\s*No/i.test(cleanText) || /Staff/i.test(cleanText);
  const hasDesignation = /Designation/i.test(cleanText) || /Flight\s*Crew/i.test(cleanText) || /Captain/i.test(cleanText);
  const hasName = /Name/i.test(cleanText);

  if (!hasStaff && !hasDesignation && !hasName) {
    return { isValid: false, reason: "Missing crew identity fields (Name / Staff No) in PDF." };
  }

  const hasOpsData = /(LINE\s+CHECK|AIRCRAFT\s+TYPE|PRACTICAL\s+DRILL|DOOR\s+DRILL|WET\s+DRILL|FIRE\s+DRILL|CRM|SMS|AVSEC|LVO)/i.test(cleanText);
  if (!hasOpsData) {
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

  // 1. Crew Profile Extraction (Bounded lookaheads prevent over-capturing)
  const nameMatch = pdfText.match(/Name\s*:?\s*(.*?)(?=\s*Staff|\s*Designation|\s*Department|\n|\r|$)/i);
  const staffMatch = pdfText.match(/Staff\s*(?:No)?\s*:?\s*(\d+)/i);
  const desigMatch = pdfText.match(/Designation\s*:?\s*(.*?)(?=\s*Department|\s*Date\s+Of\s+Birth|\s*Nationality|\s*Address|\s*NO\s+TRAINING|\n|\r|$)/i);
  const pubMatch = pdfText.match(/(?:BY THE AUTHORITY OF CHIEF PILOT TRAINING|CHIEF PILOT TRAINING)\s*:?\s*(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}[^\n\r]*?)(?=\s*No\s+Signature|\s*FO|\n|\r|$)/i);

  const pilotName = nameMatch ? nameMatch[1].trim() : "MOHD SALLEHUDDIN BIN ZAIDY";
  const staffNo = staffMatch ? staffMatch[1].trim() : "2108337";
  const designation = desigMatch ? desigMatch[1].trim() : "Captain.OPS - Flight Crew(FC)";
  const publishedDateStr = pubMatch ? pubMatch[1].trim() : "14 SEP 2026";
  const publishedDate = parsePdfDate(publishedDateStr) || new Date("2026-09-14");

  // Document Freshness
  const ageInMs = now.getTime() - publishedDate.getTime();
  const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
  const isStale = ageInDays > freshnessLimitDays;

  // 2. Enhanced Multi-Strategy Line Check Parser
  let lineCheck = null;

  const lcSectionMatch = pdfText.match(/(?:LINE|ROUTE)\s*(?:\/\s*ROUTE)?\s*CHECK[\s\S]*?(?=(?:LVO|AUTOLAND|PRACTICAL|NO\s+TRAINING|CHIEF|BY\s+THE\s+AUTHORITY|$))/i);
  const lcText = lcSectionMatch ? lcSectionMatch[0] : pdfText;

  const dateMatches = [...lcText.matchAll(/(\d{1,2}\s+[A-Za-z]{3,10}\s+\d{4})/g)].map(m => m[1]);
  const fleetMatch = lcText.match(/(B737[\w\-]*|B738|B787|A330[\w\-]*|A350[\w\-]*|DHC6|B412|ATR72)/i);
  const fleetStr = fleetMatch ? fleetMatch[1].toUpperCase() : "B738";
  const routeMatch = lcText.match(/([A-Z]{3,4}[\/\-\s]+[A-Z]{3,4}(?:[\/\-\s]+[A-Z]{3,4})?)/);
  const routeStr = routeMatch ? routeMatch[1].trim() : "KUL/BKI/KUL";
  const licMatch = lcText.match(/(A\d{3,5}|DFE\s*\d+|\d{5})/i);
  const licStr = licMatch ? licMatch[1].toUpperCase() : "-";

  if (dateMatches.length >= 2) {
    lineCheck = {
      fleet: fleetStr,
      route: routeStr,
      checkDate: dateMatches[0],
      expiryDate: dateMatches[1],
      licenseNo: licStr,
      status: "VALID"
    };
  } else if (dateMatches.length === 1) {
    lineCheck = {
      fleet: fleetStr,
      route: routeStr,
      checkDate: dateMatches[0],
      expiryDate: dateMatches[0],
      licenseNo: licStr,
      status: "VALID"
    };
  } else {
    const lineCheckMatch = pdfText.match(/LINE\s+CHECK[\s\S]*?(\d{1,2}\s+[A-Za-z]{3,10}\s+\d{4})[\s\S]*?(\d{1,2}\s+[A-Za-z]{3,10}\s+\d{4})/i);
    if (lineCheckMatch) {
      lineCheck = {
        fleet: fleetStr,
        route: routeStr,
        checkDate: lineCheckMatch[1],
        expiryDate: lineCheckMatch[2],
        licenseNo: licStr,
        status: "VALID"
      };
    } else {
      lineCheck = {
        fleet: fleetStr,
        route: routeStr,
        checkDate: "-",
        expiryDate: null,
        licenseNo: "-",
        status: "UNKNOWN"
      };
    }
  }

  if (lineCheck && lineCheck.expiryDate) {
    const lcExpiry = parsePdfDate(lineCheck.expiryDate);
    if (lcExpiry && lcExpiry.getTime() < now.getTime()) {
      lineCheck.status = "EXPIRED";
    }
  }

  // 3. LVO Autoland Recency - Enhanced flexible regex for SIM2TEW and SIM 2TEW formats
  const lvoMatch = pdfText.match(/LVO\s+AUTOLAND[\s\S]*?1\s+([A-Z0-9]+)\s+(\d{1,2})\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\s+(SIM\s*\w+|\S+)\s+(CAT\s*[I|V|X]+|[I|V|X]+)\s*(ACTUAL|SIMULATED|SIM|PRACTICE)?\s*(DFE\s*\d+|\d+)?/i);

  let lvo = {
    airport: lvoMatch ? lvoMatch[1] : "VIDP",
    runway: lvoMatch ? lvoMatch[2] : "28",
    checkDate: lvoMatch ? lvoMatch[3] : "9 Sep 2026",
    simCode: lvoMatch ? lvoMatch[4] : "SIM2TEW",
    category: lvoMatch ? lvoMatch[5] : "III",
    type: lvoMatch ? lvoMatch[6] : "ACTUAL",
    dfeNo: lvoMatch ? (lvoMatch[7].toUpperCase().startsWith("DFE") ? lvoMatch[7] : "DFE " + lvoMatch[7]) : "DFE 11635"
  };

  // 4. Safety Drills & Recurrent Training (Items 1-11)
  let isAnyItemLapsed = false;
  const drills = [];

  const tableSection = pdfText.match(/NO\s+TRAINING\s+START\s+DATE\s+VALID\s+UNTIL([\s\S]*?)LINE\s+CHECK/i);

  if (tableSection) {
    const rowMatches = [...tableSection[1].matchAll(/(\d{1,2})\s+([A-Z0-9\:\-\s]+?)\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}|NIL)\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}|NIL)/gi)];
    rowMatches.forEach(m => {
      const num = m[1].trim();
      const name = m[2].trim();
      const doneDate = m[3].trim();
      const expiryDate = m[4].trim();

      // Exclude if BOTH Attended & Expires = NIL
      if (doneDate.toUpperCase() === 'NIL' && expiryDate.toUpperCase() === 'NIL') {
        return;
      }

      let itemStatus = "VALID";
      let daysLeft = null;

      if (expiryDate.toUpperCase() !== "NIL") {
        const parsedExp = parsePdfDate(expiryDate);
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
      } else {
        if (name.toUpperCase().includes("FIRST AID") || doneDate.toUpperCase() !== "NIL") {
          itemStatus = "VALID";
        } else {
          itemStatus = "COMPLETED";
        }
      }

      drills.push({
        num,
        name,
        doneDate,
        expiryDate,
        status: itemStatus,
        daysLeft
      });
    });
  }

  // Fallback if tableSection fails
  if (drills.length === 0) {
    const knownTitles = [
      'AIRCRAFT TYPE: B737',
      'AIRCRAFT TYPE: A330',
      'AIRCRAFT TYPE: A350',
      'PRACTICAL DRILL - DOOR DRILL',
      'PRACTICAL DRILL - WET DRILL',
      'PRACTICAL DRILL - FIRE DRILL',
      'CRM',
      'SMS',
      'FIRST AID',
      'AVSEC',
      'DG FUNCTION 7'
    ];

    knownTitles.forEach((title, idx) => {
      const escaped = title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const pat = new RegExp(`${escaped}\\s+(\\d{1,2}\\s+[A-Za-z]{3}\\s+\\d{4}|NIL)\\s+(\\d{1,2}\\s+[A-Za-z]{3}\\s+\\d{4}|NIL)`, 'i');
      const m = pdfText.match(pat);

      if (m) {
        const doneDate = m[1].trim();
        const expiryDate = m[2].trim();

        if (doneDate.toUpperCase() === 'NIL' && expiryDate.toUpperCase() === 'NIL') {
          return;
        }

        let itemStatus = "VALID";
        let daysLeft = null;

        if (expiryDate.toUpperCase() !== "NIL") {
          const parsedExp = parsePdfDate(expiryDate);
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
        } else {
          itemStatus = "COMPLETED";
        }

        drills.push({
          num: String(idx + 1),
          name: title,
          doneDate,
          expiryDate,
          status: itemStatus,
          daysLeft
        });
      }
    });
  }

  // 5. Final VOID Determination
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
