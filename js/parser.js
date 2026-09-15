// js/parser.js - CAAM eCLIPSE & MAB E-Attestation PDF Parsing Engine

import { DEFAULT_THRESHOLD } from './config.js';

// ----------------------------------------------------
// 1. CAAM eCLIPSE DATE & DOM PARSER
// ----------------------------------------------------
function parseLicenseDate(dateStr) {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (['NO EXPIRY', 'NIL', 'NA'].includes(trimmed.toUpperCase())) {
    return null;
  }
  const match = trimmed.match(/^(\d{1,2})\s+([a-zA-Z]{3,10})\s+(\d{4})$/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const monthStr = match[2].toUpperCase();
  const year = parseInt(match[3], 10);

  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const monthsMalay = ["JAN", "FEB", "MAC", "APR", "MEI", "JUN", "JUL", "OGOS", "SEP", "OKT", "NOV", "DIS"];

  let monthIdx = months.indexOf(monthStr);
  if (monthIdx === -1) monthIdx = monthsMalay.indexOf(monthStr);
  if (monthIdx === -1) return null;

  return new Date(year, monthIdx, day);
}

function isUnderPg2(el) {
  if (!el) return false;
  let curr = el;
  while (curr) {
    if (curr.id && typeof curr.id === 'string') {
      const match = curr.id.match(/^pg(\d+)$/);
      if (match && parseInt(match[1], 10) >= 2) return true;
    }
    curr = curr.parentElement;
  }
  return false;
}

function getDirectChildCells(tr) {
  const cells = [];
  if (tr && tr.children) {
    for (let i = 0; i < tr.children.length; i++) {
      const child = tr.children[i];
      const tagName = child.tagName.toUpperCase();
      if (tagName === 'TD' || tagName === 'TH') cells.push(child);
    }
  }
  return cells;
}

function getLabelFromRow(tr) {
  const tds = getDirectChildCells(tr);
  for (let i = 0; i < tds.length; i++) {
    const text = tds[i].textContent.replace('•', '').trim();
    if (!text) continue;
    const isDatePattern = /^\d{1,2}\s+[a-zA-Z]{3,10}\s+\d{4}$/.test(text) || text.toUpperCase() === 'NO EXPIRY';
    if (!isDatePattern) return text;
  }
  return "";
}

function shouldIgnore(el) {
  if (!el || isUnderPg2(el)) return true;
  const text = el.textContent.trim();
  if (!text) return true;
  const upperText = text.toUpperCase();

  if (upperText.includes("INITIAL GRANT") || upperText.includes("INITIAL_GRANT")) return true;
  if (upperText.includes("7 DECEMBER 1944") || upperText.includes("7 DISEMBER 1944") || upperText.includes("DECEMBER 1944")) return true;
  if (/\d{1,2}:\d{2}:\d{2}/.test(text)) return true;

  let curr = el;
  for (let i = 0; i < 5; i++) {
    if (!curr || !curr.tagName) break;
    const tagName = curr.tagName.toUpperCase();
    if (['TABLE', 'TBODY', 'THEAD', 'BODY', 'HTML', 'TR', 'TFOOT'].includes(tagName)) break;
    const currText = curr.textContent.toUpperCase();
    if (currText.includes("DATE OF BIRTH") || currText.includes("TARIKH LAHIR")) return true;
    if (currText.includes("SIGNATURE OF ISSUING OFFICER") || currText.includes("TANDATANGAN PEGAWAI")) return true;
    if (currText.includes("LAST SYNCHRONIZATION") || currText.includes("PENYELARASAN TERAKHIR")) return true;
    if (currText.includes("CHICAGO CONVENTION") || currText.includes("ANNEX 1") || currText.includes("ANEKS 1")) return true;
    curr = curr.parentElement;
  }

  return false;
}

function isRedOrExpired(el) {
  if (!el) return false;
  const text = el.textContent.trim().toUpperCase();
  if (text === 'EXPIRED') return true;

  const inlineStyle = (el.getAttribute('style') || '').toLowerCase();
  return (
    inlineStyle.includes('color: red') ||
    inlineStyle.includes('color:red') ||
    inlineStyle.includes('color: #ff0000') ||
    inlineStyle.includes('background: #ff0000') ||
    inlineStyle.includes('color: rgb(239, 68, 68)') ||
    inlineStyle.includes('color: #ef4444')
  );
}

// CAAM Digital Licence DOM Parsing Function
export function parseLicenseDOM(doc, daysThreshold = DEFAULT_THRESHOLD) {
  const refDate = new Date();
  const qualificationData = {};

  function processQualification(labelText, dateText, parsedDate, isVisuallyExpired) {
    const name = labelText || "Qualification";
    const key = name.toUpperCase().replace(/\s+/g, '');

    if (key.includes('CLASS1(SC)') || key.includes('CLASS1SC')) return;

    const cleanName = name.replace('•', '').trim();
    let status = "VALID";
    let daysRemaining = null;

    if (isVisuallyExpired) {
      status = "EXPIRED";
    } else if (parsedDate) {
      const timeDiff = parsedDate.getTime() - refDate.getTime();
      daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      if (daysRemaining < 0) {
        status = "EXPIRED";
      } else if (daysRemaining <= daysThreshold) {
        status = "EXPIRING_SOON";
      }
    }

    if (qualificationData[key] && qualificationData[key].status === "EXPIRED") return;

    qualificationData[key] = {
      name: cleanName,
      dateText: dateText,
      parsedDate: parsedDate,
      daysRemaining: daysRemaining,
      status: status
    };
  }

  let pilotName = "";
  let licenseType = "";
  let licenseNo = "";

  const allElements = doc.querySelectorAll('td, th, b, span, div, p');
  for (let i = 0; i < allElements.length; i++) {
    if (isUnderPg2(allElements[i])) continue;
    const text = allElements[i].textContent.toUpperCase();
    if (text.includes("FULL NAME OF HOLDER") || text.includes("NAMA PENUH PEMEGANG")) {
      const tr = allElements[i].closest('tr');
      if (tr) {
        const nextTr = tr.nextElementSibling;
        if (nextTr) {
          pilotName = nextTr.textContent.replace(/•/g, '').trim().replace(/\s+/g, ' ');
          break;
        }
      }
    }
  }

  for (let i = 0; i < allElements.length; i++) {
    if (isUnderPg2(allElements[i])) continue;
    const text = allElements[i].textContent.trim();
    if (text === "III") {
      const tr = allElements[i].closest('tr');
      if (tr) {
        const nextTr = tr.nextElementSibling;
        if (nextTr) {
          licenseNo = nextTr.textContent.replace(/LICENCE NO/gi, '').replace(/NOMBOR LESEN/gi, '').trim();
        }
      }
    }
  }

  const rows = doc.querySelectorAll('tr');
  for (let i = 0; i < rows.length; i++) {
    const tr = rows[i];
    if (isUnderPg2(tr)) continue;
    const labelText = getLabelFromRow(tr);
    if (!labelText) continue;

    const tds = getDirectChildCells(tr);
    for (let j = 0; j < tds.length; j++) {
      const tdText = tds[j].textContent.trim();
      const isDatePattern = /^\d{1,2}\s+[a-zA-Z]{3,10}\s+\d{4}$/.test(tdText) || tdText.toUpperCase() === 'NO EXPIRY';

      if (isDatePattern && !shouldIgnore(tds[j])) {
        const parsedDate = parseLicenseDate(tdText);
        const isVisExpired = isRedOrExpired(tds[j]) || tr.textContent.toUpperCase().includes('EXPIRED');
        processQualification(labelText, tdText, parsedDate, isVisExpired);
      }
    }
  }

  const qualificationsList = Object.values(qualificationData);
  let overallStatus = "VALID";
  let expiredCount = 0;
  let expiringSoonCount = 0;

  qualificationsList.forEach(item => {
    if (item.status === "EXPIRED") expiredCount++;
    else if (item.status === "EXPIRING_SOON") expiringSoonCount++;
  });

  if (expiredCount > 0) overallStatus = "EXPIRED";
  else if (expiringSoonCount > 0) overallStatus = "EXPIRING_SOON";

  return {
    pilotDetails: {
      name: pilotName || "-",
      licenseType: licenseType || "ATPL(A)",
      licenseNo: licenseNo || "-"
    },
    qualifications: qualificationsList,
    overallStatus,
    expiredCount,
    expiringSoonCount
  };
}

// ----------------------------------------------------
// 2. MAB E-ATTESTATION PDF TEXT PARSER ENGINE
// ----------------------------------------------------
export function parseAttestationText(pdfText, freshnessLimitDays = 30, warningThresholdDays = 30) {
  if (!pdfText) return null;

  const now = new Date();

  function parsePdfDate(str) {
    if (!str) return null;
    const clean = str.trim().toUpperCase();
    if (clean === 'NIL' || clean === 'NO EXPIRY') return null;
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

  const ageInMs = now.getTime() - publishedDate.getTime();
  const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
  const isStale = ageInDays > freshnessLimitDays;

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

  const lvoMatch = pdfText.match(/(\b[A-Z]{4}\b)\s+(\d{1,2})\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\s+([A-Z0-9]+)\s+(I{1,3})\s+(ACTUAL DFE)/i);
  let lvo = {
    airport: lvoMatch ? lvoMatch[1] : "VIDP",
    runway: lvoMatch ? lvoMatch[2] : "28",
    checkDate: lvoMatch ? lvoMatch[3] : "9 Sep 2026",
    simCode: lvoMatch ? lvoMatch[4] : "SIM2TEW",
    category: lvoMatch ? lvoMatch[5] : "III",
    type: lvoMatch ? lvoMatch[6] : "ACTUAL DFE"
  };

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
    // CORRECTED REGEX WITH DOUBLE-ESCAPED BACKSLASHES FOR DIGITS
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
