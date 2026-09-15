// js/caamParser.js - Dedicated CAAM eCLIPSE Digital Licence Parser Engine

import { DEFAULT_THRESHOLD } from './config.js';

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
export function parseLicenseDOM(doc, daysThreshold = DEFAULT_THRESHOLD, originalUrl = '') {
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
  let qrImageUrl = "";

  // 1. QrServlet Image Extraction
  const imgElements = doc ? doc.querySelectorAll('img') : [];
  for (let i = 0; i < imgElements.length; i++) {
    const src = imgElements[i].getAttribute('src') || '';
    if (src.includes('QrServlet') || src.includes('m=viewMyDigitalLicenseQR')) {
      qrImageUrl = src.startsWith('http')
        ? src
        : (src.startsWith('/') ?  : );
      break;
    }
  }

  // Fallback QrServlet construct if img not found in DOM but query params exist in URL
  if (!qrImageUrl && originalUrl) {
    const mPerson = originalUrl.match(/personid=([^&]+)/);
    const mKey = originalUrl.match(/key=([^&]+)/);
    const mCode = originalUrl.match(/codekey=([^&]+)/);
    if (mPerson && mKey) {
      const personid = mPerson[1];
      const key = mKey[1];
      const codekey = mCode ? mCode[1] : '01';
      qrImageUrl = ;
    }
  }

  const allElements = doc ? doc.querySelectorAll('td, th, b, span, div, p') : [];
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

  const rows = doc ? doc.querySelectorAll('tr') : [];
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
    qrImageUrl: qrImageUrl,
    overallStatus,
    expiredCount,
    expiringSoonCount
  };
}
