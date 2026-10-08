// js/caamParser.js (0810_R116) - Dedicated CAAM eCLIPSE Digital Licence Parser Engine

import { DEFAULT_THRESHOLD } from './config.js';

export function isSupervisoryQualification(name) {
  if (!name) return false;
  return (
    /(DFE|EXAMINER|CHECK PILOT|FI|FLIGHT INSTRUCTOR|INSTRUCTOR|TRI|TRE)/i.test(name) ||
    /FI\(\d+\)/i.test(name) ||
    /DFE\(\d+\)/i.test(name)
  );
}


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

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthsMalay = ['JAN', 'FEB', 'MAC', 'APR', 'MEI', 'JUN', 'JUL', 'OGOS', 'SEP', 'OKT', 'NOV', 'DIS'];

  let monthIdx = months.indexOf(monthStr);
  if (monthIdx === -1) monthIdx = monthsMalay.indexOf(monthStr);
  if (monthIdx === -1) return null;

  return new Date(year, monthIdx, day);
}

function isUnderPg2(el) {
  if (!el) return false;
  if (typeof el.closest === 'function') {
    const pgEl = el.closest('[id^="pg"]');
    if (pgEl) {
      const match = pgEl.id.match(/^pg(\d+)$/);
      if (match && parseInt(match[1], 10) >= 2) return true;
    }
  }

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
  if (cells.length === 0 && tr) {
    const qcells = tr.querySelectorAll('td, th');
    for (let j = 0; j < qcells.length; j++) cells.push(qcells[j]);
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
  return '';
}

function shouldIgnore(el) {
  if (!el || isUnderPg2(el)) return true;
  const text = el.textContent.trim();
  if (!text) return true;

  const upperText = text.toUpperCase();
  if (upperText.includes('INITIAL GRANT') || upperText.includes('INITIAL_GRANT')) return true;
  if (upperText.includes('7 DECEMBER 1944') || upperText.includes('7 DISEMBER 1944') || upperText.includes('DECEMBER 1944') || upperText.includes('DISEMBER 1944')) return true;
  if (/\d{1,2}:\d{2}:\d{2}/.test(text)) return true;

  let curr = el;
  for (let i = 0; i < 5; i++) {
    if (!curr || !curr.tagName) break;
    const tagName = curr.tagName.toUpperCase();
    if (['TABLE', 'TBODY', 'THEAD', 'BODY', 'HTML', 'TR', 'TFOOT'].includes(tagName)) break;
    if (tagName === 'DIV') {
      const className = (curr.className || '').toLowerCase();
      if (className.includes('row') || className.includes('container') || className.includes('col-') || className.includes('card')) break;
    }
    const currText = curr.textContent.toUpperCase();
    if (currText.includes('DATE OF BIRTH') || currText.includes('TARIKH LAHIR')) return true;
    if (currText.includes('SIGNATURE OF ISSUING OFFICER') || currText.includes('TANDATANGAN PEGAWAI')) return true;
    if (currText.includes('LAST SYNCHRONIZATION') || currText.includes('PENYELARASAN TERAKHIR')) return true;
    if (currText.includes('INITIAL GRANT')) return true;
    if (currText.includes('CHICAGO CONVENTION') || currText.includes('ANNEX 1') || currText.includes('ANEKS 1')) return true;
    curr = curr.parentElement;
  }

  const tr = el.closest ? el.closest('tr') : null;
  if (tr) {
    const rowText = tr.textContent.toUpperCase();
    if (rowText.includes('VALIDITY ISSUE DATE') || rowText.includes('TARIKH KELUARAN')) return true;
    const tds = getDirectChildCells(tr);
    if (tds.length === 3) {
      const table = tr.closest ? tr.closest('table') : null;
      if (table && (table.textContent.toUpperCase().includes('VALIDITY ISSUE DATE') || table.textContent.toUpperCase().includes('TARIKH KELUARAN'))) {
        if (tds[1] === el || tds[1].contains(el)) return true;
      }
    }
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
    inlineStyle.includes('background:#ff0000') ||
    inlineStyle.includes('background: red') ||
    inlineStyle.includes('background-color: red') ||
    inlineStyle.includes('color: rgb(239, 68, 68)') ||
    inlineStyle.includes('color: #ef4444')
  );
}

function extractNestedLimitations(docObj, itemCode) {
  if (!docObj) return [];
  const items = [];
  const targetCode = itemCode.toUpperCase();
  const candidates = docObj.querySelectorAll('.licenceNumbering, td, th, div, span, b');

  for (let i = 0; i < candidates.length; i++) {
    const el = candidates[i];
    if (isUnderPg2(el)) continue;
    const elText = el.textContent.trim().toUpperCase();
    let isMatch = false;

    if (targetCode === 'XVC') {
      if (elText === 'XVC' || elText === 'XVC.' || elText === 'XVC:' || elText.includes('SPECIAL MEDICAL LIMITATIONS') || elText.includes('HAD HADAN PERUBATAN KHAS')) {
        isMatch = true;
      }
    } else if (targetCode === 'XVD') {
      if (elText === 'XVD' || elText === 'XVD.' || elText === 'XVD:' || elText.includes('OTHER MEDICAL LIMITATIONS') || elText.includes('HAD HADAN PERUBATAN LAIN')) {
        isMatch = true;
      }
    }

    if (!isMatch) continue;

    const tr = el.closest ? el.closest('tr') : null;
    if (!tr) continue;
    const nextTr = tr.nextElementSibling;
    if (!nextTr) continue;

    const nestedTable = nextTr.querySelector('table');
    if (nestedTable) {
      const rows = nestedTable.querySelectorAll('tr');
      for (let r = 0; r < rows.length; r++) {
        const cells = rows[r].querySelectorAll('td, th');
        if (cells.length > 0) {
          const rawVal = cells[cells.length - 1].textContent.trim();
          const clean = rawVal.replace(/^[•\s\-\*\&\#8226\;]+/, '').replace(/\s+/g, ' ').trim();
          const upper = clean.toUpperCase();
          if (clean && clean !== '•' && upper !== 'XVC' && upper !== 'XVD' && !upper.includes('SPECIAL MEDICAL LIMITATIONS') && !upper.includes('OTHER MEDICAL LIMITATIONS') && !upper.includes('HAD HADAN')) {
            if (!items.includes(clean)) items.push(clean);
          }
        }
      }
    } else {
      const spans = nextTr.querySelectorAll('.labelfield, span, td');
      for (let s = 0; s < spans.length; s++) {
        if (spans[s].children && spans[s].children.length > 0) continue;
        const sText = spans[s].textContent.trim();
        const clean = sText.replace(/^[•\s\-\*\&\#8226\;]+/, '').replace(/\s+/g, ' ').trim();
        const upper = clean.toUpperCase();
        if (clean && clean !== '•' && upper !== 'XVC' && upper !== 'XVD' && !upper.includes('SPECIAL MEDICAL LIMITATIONS') && !upper.includes('OTHER MEDICAL LIMITATIONS') && !upper.includes('HAD HADAN')) {
          if (!items.includes(clean)) items.push(clean);
        }
      }
    }
    if (items.length > 0) break;
  }
  return items;
}

// Fleet Family Normalizer Utility
export function normalizeFleetFamily(ratingName) {
  if (!ratingName) return 'OTHER';
  const name = ratingName.toUpperCase();
  if (name.includes('A330') || name.includes('A350') || name.includes('A338') || name.includes('A339') || name.includes('A359') || name.includes('AIRBUS WIDEBODY')) return 'AIRBUS_WIDEBODY';
  if (name.includes('A320') || name.includes('A321') || name.includes('A319') || name.includes('AIRBUS NARROWBODY')) return 'AIRBUS_NARROWBODY';
  if (name.includes('B737') || name.includes('737') || name.includes('B738') || name.includes('B739') || name.includes('BOEING 737')) return 'BOEING_737';
  if (name.includes('B777') || name.includes('B787') || name.includes('B747') || name.includes('BOEING WIDEBODY')) return 'BOEING_WIDEBODY';
  if (name.includes('ATR') || name.includes('ATR72') || name.includes('ATR42')) return 'ATR_TURBOPROP';
  return 'OTHER';
}

// 5-Tier Hierarchy Qualification Sorting Function
export function sortCaamQualifications(quals) {
  if (!Array.isArray(quals) || quals.length === 0) return [];

  function getTier(q) {
    const nameUpper = (q.name || '').toUpperCase();

    // Tier 3: Radiotelephony Operator Licence
    if (
      nameUpper.includes('RADIO TELEPHONY') || 
      nameUpper.includes('RADIOTELEPHONY') || 
      nameUpper.includes('RTOL') || 
      nameUpper.includes('TELEPHONY') || 
      nameUpper.includes('R/T')
    ) {
      return 3;
    }

    // Tier 4: English Language Proficiency
    if (
      nameUpper.includes('ENGLISH') || 
      nameUpper.includes('LANGUAGE') || 
      nameUpper.includes('ELP')
    ) {
      return 4;
    }

    // Tier 2: Medical Class Certificate
    if (
      nameUpper.includes('MEDICAL') || 
      nameUpper.includes('CLASS 1') || 
      nameUpper.includes('CLASS 2') ||
      nameUpper.includes('CLASS1') ||
      nameUpper.includes('CLASS2')
    ) {
      return 2;
    }

    // Tier 1: Licence Type & Expiry
    if (
      nameUpper.includes('VALIDITY') || 
      nameUpper.includes('LICENCE') || 
      nameUpper.includes('ATPL') || 
      nameUpper.includes('CPL') || 
      nameUpper.includes('PPL') || 
      nameUpper.includes('MPL') ||
      nameUpper.includes('AIRLINE TRANSPORT') ||
      nameUpper.includes('COMMERCIAL PILOT') ||
      nameUpper.includes('PRIVATE PILOT')
    ) {
      return 1;
    }

    // Tier 5: Active Aircraft Ratings & Endorsements
    if (
      nameUpper.includes('A3') || 
      nameUpper.includes('B7') || 
      nameUpper.includes('ATR') || 
      nameUpper.includes('DHC') || 
      nameUpper.includes('B412') ||
      nameUpper.includes('IR') || 
      nameUpper.includes('INSTRUMENT') || 
      nameUpper.includes('TYPE') || 
      nameUpper.includes('RATING') || 
      nameUpper.includes('PBN') || 
      nameUpper.includes('PERFORMANCE') || 
      nameUpper.includes('NIGHT') || 
      nameUpper.includes('ENDORSEMENT') || 
      nameUpper.includes('INSTRUCTOR') || 
      nameUpper.includes('EXAMINER') || 
      nameUpper.includes('CHECK PILOT') || 
      nameUpper.includes('TRI') || 
      nameUpper.includes('TRE') || 
      /FI/i.test(nameUpper) ||
      /FI\(\d+\)/i.test(nameUpper)
    ) {
      return 5;
    }

    // Tier 6: Other qualifications (if available)
    return 6;
  }

  return [...quals].sort((a, b) => {
    const tierA = getTier(a);
    const tierB = getTier(b);
    if (tierA !== tierB) return tierA - tierB;
    const isLegacyA = a.isLegacy || a.status === 'INACTIVE_LEGACY' ? 1 : 0;
    const isLegacyB = b.isLegacy || b.status === 'INACTIVE_LEGACY' ? 1 : 0;
    return isLegacyA - isLegacyB;
  });
}

export function parseLicenseDOM(doc, daysThreshold = DEFAULT_THRESHOLD, activeFleetContext = null) {
  const refDate = new Date();
  const qualificationData = {};

  function processQualification(labelText, dateText, parsedDate, isVisuallyExpired) {
    const name = labelText || 'Qualification';
    const key = name.toUpperCase().replace(/\s+/g, '');

    if (key.includes('CLASS1(SC)') || key.includes('CLASS1SC') || key.includes('CLASS1(S.C.)')) return;

    const cleanName = name.replace('•', '').trim();
    let status = 'VALID';
    let daysRemaining = null;

    if (isVisuallyExpired) {
      status = 'EXPIRED';
    } else if (parsedDate) {
      const timeDiff = parsedDate.getTime() - refDate.getTime();
      daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      if (daysRemaining < 0) {
        status = 'EXPIRED';
      } else if (daysRemaining <= daysThreshold) {
        status = 'EXPIRING_SOON';
      }
    }

    if (qualificationData[key] && qualificationData[key].status === 'EXPIRED') return;

    qualificationData[key] = {
      name: cleanName,
      dateText: dateText,
      parsedDate: parsedDate,
      daysRemaining: daysRemaining,
      status: status,
      isLegacy: false
    };
  }

  // Pilot Details Extraction
  let pilotName = '';
  let licenseType = '';
  let licenseNo = '';

  const allElements = doc.querySelectorAll('td, th, b, span, div, p');

  for (let i = 0; i < allElements.length; i++) {
    if (isUnderPg2(allElements[i])) continue;
    const text = allElements[i].textContent.toUpperCase();
    if (text.includes('FULL NAME OF HOLDER') || text.includes('NAMA PENUH PEMEGANG')) {
      const tr = allElements[i].closest ? allElements[i].closest('tr') : null;
      if (tr) {
        const nextTr = tr.nextElementSibling;
        if (nextTr) {
          pilotName = nextTr.textContent.replace(/•/g, '').trim().replace(/\s+/g, ' ');
          break;
        }
        const tds = tr.querySelectorAll('td, th');
        if (tds.length > 1) {
          for (let j = 0; j < tds.length; j++) {
            if (tds[j] !== allElements[i] && tds[j].textContent.trim()) {
              pilotName = tds[j].textContent.replace(/•/g, '').trim().replace(/\s+/g, ' ');
              break;
            }
          }
        }
      }
    }
  }

  let extractedFullType = '';
  for (let i = 0; i < allElements.length; i++) {
    if (isUnderPg2(allElements[i])) continue;
    const text = allElements[i].textContent.trim();
    if (text === 'II') {
      const tr = allElements[i].closest ? allElements[i].closest('tr') : null;
      if (tr) {
        const tds = tr.querySelectorAll('td, th');
        if (tds.length > 1) {
          for (let j = 0; j < tds.length; j++) {
            if (tds[j] !== allElements[i] && tds[j].textContent.trim()) {
              extractedFullType = tds[j].textContent.trim().replace(/\s+/g, ' ');
              break;
            }
          }
        } else {
          const nextTr = tr.nextElementSibling;
          if (nextTr) extractedFullType = nextTr.textContent.trim().replace(/\s+/g, ' ');
        }
      }
    }

    if (text === 'III') {
      const tr = allElements[i].closest ? allElements[i].closest('tr') : null;
      if (tr) {
        const tds = tr.querySelectorAll('td, th');
        if (tds.length > 1) {
          for (let j = 0; j < tds.length; j++) {
            if (tds[j] !== allElements[i] && tds[j].textContent.trim()) {
              licenseNo = tds[j].textContent.replace(/LICENCE NO/gi, '').replace(/NOMBOR LESEN/gi, '').trim().replace(/\s+/g, ' ');
              break;
            }
          }
        } else {
          const nextTr = tr.nextElementSibling;
          if (nextTr) {
            licenseNo = nextTr.textContent.replace(/LICENCE NO/gi, '').replace(/NOMBOR LESEN/gi, '').trim().replace(/\s+/g, ' ');
          }
        }
      }
    }
  }

  function mapLicenseType(fullType) {
    if (!fullType) return '';
    const upper = fullType.toUpperCase().trim();
    if (upper.includes('AIRLINE TRANSPORT PILOT LICENCE (A)') || upper === 'ATPL(A)') return 'ATPL(A)';
    if (upper.includes('AIRLINE TRANSPORT PILOT LICENCE (H)') || upper === 'ATPL(H)') return 'ATPL(H)';
    if (upper.includes('AIRLINE TRANSPORT PILOT LICENCE') || upper === 'ATPL') return 'ATPL';
    if (upper.includes('COMMERCIAL PILOT LICENCE (A)') || upper === 'CPL(A)') return 'CPL(A)';
    if (upper.includes('COMMERCIAL PILOT LICENCE (H)') || upper === 'CPL(H)') return 'CPL(H)';
    if (upper.includes('COMMERCIAL PILOT LICENCE') || upper === 'CPL') return 'CPL';
    if (upper.includes('PRIVATE PILOT LICENCE (A)') || upper === 'PPL(A)') return 'PPL(A)';
    if (upper.includes('PRIVATE PILOT LICENCE (H)') || upper === 'PPL(H)') return 'PPL(H)';
    if (upper.includes('PRIVATE PILOT LICENCE') || upper === 'PPL') return 'PPL';
    if (upper.includes('MULTI-CREW PILOT LICENCE (A)') || upper === 'MPL(A)') return 'MPL(A)';
    return fullType;
  }

  let shortLicenseType = '';
  const tables = doc.querySelectorAll('table');
  for (let t = 0; t < tables.length; t++) {
    const table = tables[t];
    if (isUnderPg2(table)) continue;
    const headers = table.querySelectorAll('th, td');
    let isFclTable = false;
    let licenceTypeColIndex = -1;

    for (let h = 0; h < headers.length; h++) {
      const headerText = headers[h].textContent.toUpperCase();
      if (headerText.includes('LICENCE TYPE') || headerText.includes('JENIS LESEN')) {
        isFclTable = true;
        const tr = headers[h].closest ? headers[h].closest('tr') : null;
        if (tr) {
          const cells = Array.from(tr.querySelectorAll('td, th'));
          licenceTypeColIndex = cells.indexOf(headers[h]);
        }
        break;
      }
    }

    if (isFclTable && licenceTypeColIndex !== -1) {
      const rows = table.querySelectorAll('tr');
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const cells = Array.from(row.querySelectorAll('td, th'));
        if (cells.length > licenceTypeColIndex) {
          const cellText = cells[licenceTypeColIndex].textContent.trim();
          const upperCellText = cellText.toUpperCase();
          if (upperCellText.includes('LICENCE TYPE') || upperCellText.includes('JENIS LESEN')) continue;
          if (cellText && cellText.length < 15) {
            shortLicenseType = cellText;
            break;
          }
        }
      }
    }
    if (shortLicenseType) break;
  }

  licenseType = shortLicenseType || mapLicenseType(extractedFullType);

  if (!licenseNo) {
    for (let i = 0; i < allElements.length; i++) {
      if (isUnderPg2(allElements[i])) continue;
      const text = allElements[i].textContent.toUpperCase();
      if (text.includes('NOMBOR LESEN BARU') || text.includes('NEW LICENCE NO')) {
        const nextTr = allElements[i].closest ? allElements[i].closest('tr')?.nextElementSibling : null;
        if (nextTr) {
          licenseNo = nextTr.textContent.trim().replace(/\s+/g, ' ');
        }
      }
    }
  }

  // Medical Limitations Extraction (Item XVc & Item XVd)
  const xvcRaw = extractNestedLimitations(doc, 'XVC');
  const xvdRaw = extractNestedLimitations(doc, 'XVD');
  const xvcFiltered = xvcRaw.filter(item => {
    const u = item.toUpperCase();
    return u !== 'NIL' && u !== 'NONE' && u !== '-' && u !== 'N/A';
  });
  const xvdFiltered = xvdRaw.filter(item => {
    const u = item.toUpperCase();
    return u !== 'NIL' && u !== 'NONE' && u !== '-' && u !== 'N/A';
  });
  const allActiveLimitations = xvcFiltered.concat(xvdFiltered);
  let medicalLimitationsFormatted = 'NIL';
  if (allActiveLimitations.length > 0) {
    medicalLimitationsFormatted = allActiveLimitations.map(item => '• ' + item).join('\n');
  }

  // Pass 1: Card Extraction
  const cards = doc.querySelectorAll('.card');
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (isUnderPg2(card)) continue;
    const cardText = card.textContent.toUpperCase();
    if (cardText.includes('MEDICAL EXPIRY DATE') || cardText.includes('TARIKH TAMAT TEMPOH PERUBATAN') || cardText.includes('LICENCE TYPE') || cardText.includes('VALIDITY EXPIRY DATE')) continue;
    const cardNormalized = cardText.replace(/\s+/g, '');
    if (cardNormalized.includes('CLASS1(SC)') || cardNormalized.includes('CLASS1SC') || cardNormalized.includes('CLASS1(S.C.)')) continue;

    const titleEl = card.querySelector('.col-sm-12 .bg-gray-300') || card.querySelector('div[style*="font-weight: 500"]') || card.querySelector('.fs-5');
    const labelText = titleEl ? titleEl.textContent.trim() : '';
    const dateEl = card.querySelector('.text-uppercase b') || card.querySelector('.fs-4 b, .fs-3 b');
    const dateText = dateEl ? dateEl.textContent.trim() : '';

    if (labelText && dateText) {
      if (shouldIgnore(dateEl)) continue;
      const parsedDate = parseLicenseDate(dateText);
      const isVisExpired = isRedOrExpired(dateEl) || cardText.includes('EXPIRED');
      processQualification(labelText, dateText, parsedDate, isVisExpired);
    }
  }

  // Pass 2: Table Extraction
  const rows = doc.querySelectorAll('tr');
  for (let i = 0; i < rows.length; i++) {
    const tr = rows[i];
    if (isUnderPg2(tr)) continue;
    const rowText = tr.textContent.toUpperCase();
    const rowNormalized = rowText.replace(/\s+/g, '');
    if (rowNormalized.includes('CLASS1(SC)') || rowNormalized.includes('CLASS1SC') || rowNormalized.includes('CLASS1(S.C.)')) continue;
    if (rowText.includes('LICENCE TYPE') || rowText.includes('VALIDITY EXPIRY DATE')) continue;
    if (rowText.includes('MEDICAL CLASS') || rowText.includes('KELAS PERUBATAN')) continue;
    if (rowText.includes('MEDICAL EXPIRY DATE') || rowText.includes('TARIKH TAMAT TEMPOH PERUBATAN')) continue;

    const labelText = getLabelFromRow(tr);
    if (!labelText) continue;

    const tds = getDirectChildCells(tr);
    for (let j = 0; j < tds.length; j++) {
      const tdText = tds[j].textContent.trim();
      const isDatePattern = /^\d{1,2}\s+[a-zA-Z]{3,10}\s+\d{4}$/.test(tdText) || tdText.toUpperCase() === 'NO EXPIRY';
      if (isDatePattern) {
        if (shouldIgnore(tds[j])) continue;
        const parsedDate = parseLicenseDate(tdText);
        const isVisExpired = isRedOrExpired(tds[j]) || isRedOrExpired(tr) || rowText.includes('EXPIRED');
        processQualification(labelText, tdText, parsedDate, isVisExpired);
      }
    }
  }

  // Pass 3: Fallbacks
  const elements = doc.querySelectorAll('b, span, td, div, p, font, strong');
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (isUnderPg2(el)) continue;
    if (el.children.length === 0 && el.textContent.trim().length > 0) {
      if (shouldIgnore(el)) continue;
      if (isRedOrExpired(el)) {
        let labelText = '';
        let dateText = el.textContent.trim();
        const tr = el.closest ? el.closest('tr') : null;
        const card = el.closest ? el.closest('.card') : null;

        if (tr) {
          const rowNormalized = tr.textContent.toUpperCase().replace(/\s+/g, '');
          if (rowNormalized.includes('CLASS1(SC)') || rowNormalized.includes('CLASS1SC') || rowNormalized.includes('CLASS1(S.C.)')) continue;
          const labelTd = tr.querySelector('.text-left') || tr.querySelector('td');
          if (labelTd) labelText = labelTd.textContent.replace('•', '').trim();
        } else if (card) {
          const cardNormalized = card.textContent.toUpperCase().replace(/\s+/g, '');
          if (cardNormalized.includes('CLASS1(SC)') || cardNormalized.includes('CLASS1SC') || cardNormalized.includes('CLASS1(S.C.)')) continue;
          const titleEl = card.querySelector('.col-sm-12 .bg-gray-300') || card.querySelector('div[style*="font-weight: 500"]') || card.querySelector('.fs-5');
          if (titleEl) labelText = titleEl.textContent.trim();
          const dateEl = card.querySelector('.text-uppercase b') || card.querySelector('.fs-4 b, .fs-3 b');
          if (dateEl) dateText = dateEl.textContent.trim();
        }

        if (!labelText) labelText = 'Qualification';
        const key = labelText.toUpperCase().replace(/\s+/g, '');
        if (!qualificationData[key]) {
          const parsedDate = parseLicenseDate(dateText);
          processQualification(labelText, dateText, parsedDate, true);
        } else {
          qualificationData[key].status = 'EXPIRED';
        }
      }
    }
  }

  const rawQualsList = Object.values(qualificationData);

  // -------------------------------------------------------------
  // Smart Fleet Resolution & Legacy Fleet Classification Engine
  // -------------------------------------------------------------
  const fleetQualsGrouped = {};
  const universalQuals = [];

  rawQualsList.forEach(q => {
    const nameUpper = (q.name || '').toUpperCase();
    const isUniversal = nameUpper.includes('MEDICAL') || nameUpper.includes('LANGUAGE') || nameUpper.includes('ELP') || nameUpper.includes('RADIO TELEPHONY') || nameUpper.includes('RTOL') || nameUpper.includes('VALIDITY') || nameUpper.includes('LICENCE') || nameUpper.includes('PBN');
    if (isUniversal) {
      universalQuals.push(q);
    } else {
      const family = normalizeFleetFamily(q.name);
      if (!fleetQualsGrouped[family]) fleetQualsGrouped[family] = [];
      fleetQualsGrouped[family].push(q);
    }
  });

  // Determine Active Fleet Family
  let activeFamily = null;
  if (activeFleetContext) {
    activeFamily = normalizeFleetFamily(activeFleetContext);
  } else {
    // Auto-detect active fleet family: family with most recent valid / non-expired rating
    let latestValidExpiry = -Infinity;
    Object.entries(fleetQualsGrouped).forEach(([family, quals]) => {
      quals.forEach(q => {
        if (q.status !== 'EXPIRED' && q.parsedDate) {
          const t = q.parsedDate.getTime();
          if (t > latestValidExpiry) {
            latestValidExpiry = t;
            activeFamily = family;
          }
        }
      });
    });

    // If all ratings in all families are expired, pick family with most recent expiry
    if (!activeFamily) {
      let latestAnyExpiry = -Infinity;
      Object.entries(fleetQualsGrouped).forEach(([family, quals]) => {
        quals.forEach(q => {
          if (q.parsedDate) {
            const t = q.parsedDate.getTime();
            if (t > latestAnyExpiry) {
              latestAnyExpiry = t;
              activeFamily = family;
            }
          }
        });
      });
    }
  }

  let hasLegacyRatings = false;

  // Classify ratings: inactive fleet expired ratings become legacy
  Object.entries(fleetQualsGrouped).forEach(([family, quals]) => {
    const isActive = (family === activeFamily);
    quals.forEach(q => {
      if (!isActive && q.status === 'EXPIRED') {
        q.isLegacy = true;
        q.status = 'INACTIVE_LEGACY';
        q.statusLabel = 'Legacy / Lapsed';
        hasLegacyRatings = true;
      } else {
        q.isLegacy = false;
      }
    });
  });

  // Calculate overallStatus ignoring INACTIVE_LEGACY and excluding supervisory expirations from line grounding
  const finalQualsList = Object.values(qualificationData);
  let overallStatus = 'VALID';
  let expiredCount = 0;
  let expiringSoonCount = 0;

  let activeSupervisoryList = [];

  finalQualsList.forEach(item => {
    item.isSupervisory = isSupervisoryQualification(item.name);
    const isLegacy = item.isLegacy || item.status === 'INACTIVE_LEGACY';
    if (!isLegacy) {
      if (item.isSupervisory) {
        activeSupervisoryList.push(item);
        if (item.status === 'EXPIRED') {
          item.status = 'ROLE_EXPIRED';
        }
      } else {
        if (item.status === 'EXPIRED') expiredCount++;
        else if (item.status === 'EXPIRING_SOON') expiringSoonCount++;
      }
    }
  });

  if (expiredCount > 0) overallStatus = 'EXPIRED';
  else if (expiringSoonCount > 0) overallStatus = 'EXPIRING_SOON';

  // Role Privilege Advisory Logic
  let advisoryNotice = null;
  if (activeSupervisoryList.length > 0) {
    const activeDfes = activeSupervisoryList.filter(q => {
      const u = q.name.toUpperCase();
      return u.includes('DFE') || u.includes('EXAMINER');
    });
    const activeFis = activeSupervisoryList.filter(q => {
      const u = q.name.toUpperCase();
      return /(FI|FLIGHT INSTRUCTOR|INSTRUCTOR|TRI|TRE)/i.test(u) || /FI\(\d+\)/i.test(u);
    });

    const hasExpiredDfe = activeDfes.some(q => q.status === 'EXPIRED' || q.status === 'ROLE_EXPIRED');
    const hasValidDfe = activeDfes.some(q => q.status === 'VALID');
    const hasExpiredFi = activeFis.some(q => q.status === 'EXPIRED' || q.status === 'ROLE_EXPIRED');
    const hasValidFi = activeFis.some(q => q.status === 'VALID');

    if (hasExpiredDfe && hasExpiredFi) {
      advisoryNotice = {
        type: 'SUPERVISORY_LAPSED',
        title: 'SPECIALIZED ROLE ADVISORY',
        message: 'Supervisory privileges lapsed (DFE/FI expired). Cleared for Commercial Line Operations only.',
        badgeText: 'PRIVILEGES LAPSED'
      };
    } else if (hasExpiredDfe && (hasValidFi || activeFis.length > 0)) {
      advisoryNotice = {
        type: 'DFE_LAPSED',
        title: 'SPECIALIZED ROLE ADVISORY',
        message: 'Examiner privilege lapsed (DFE(1) expired). Cleared for Line Operations & Flight Instruction (FI(1)) only.',
        badgeText: 'EXAMINER LAPSED'
      };
    } else if (hasExpiredFi && (hasValidDfe || activeDfes.length > 0)) {
      advisoryNotice = {
        type: 'FI_LAPSED',
        title: 'SPECIALIZED ROLE ADVISORY',
        message: 'Flight Instructor privilege lapsed (FI(1) expired). Cleared for Line Operations & Examiner Checks (DFE(1)) only.',
        badgeText: 'INSTRUCTOR LAPSED'
      };
    } else if (hasExpiredDfe) {
      advisoryNotice = {
        type: 'DFE_LAPSED',
        title: 'SPECIALIZED ROLE ADVISORY',
        message: 'Examiner privilege lapsed (DFE expired). Cleared for Commercial Line Operations only.',
        badgeText: 'EXAMINER LAPSED'
      };
    } else if (hasExpiredFi) {
      advisoryNotice = {
        type: 'FI_LAPSED',
        title: 'SPECIALIZED ROLE ADVISORY',
        message: 'Flight Instructor privilege lapsed (FI expired). Cleared for Commercial Line Operations only.',
        badgeText: 'INSTRUCTOR LAPSED'
      };
    } else {
      const anyExpiredRole = activeSupervisoryList.some(q => q.status === 'EXPIRED' || q.status === 'ROLE_EXPIRED');
      if (anyExpiredRole) {
        advisoryNotice = {
          type: 'ROLE_LAPSED',
          title: 'SPECIALIZED ROLE ADVISORY',
          message: 'Instructional/Examiner privilege lapsed. Cleared for Commercial Line Operations only.',
          badgeText: 'ROLE LAPSED'
        };
      }
    }
  }

    // Extract QrServlet Image Endpoint
  let qrImageUrl = '';
  const imgs = doc.querySelectorAll('img');
  for (let i = 0; i < imgs.length; i++) {
    const src = imgs[i].getAttribute('src') || '';
    if (src.includes('QrServlet') || src.includes('m=viewMyDigitalLicenseQR')) {
      qrImageUrl = src.startsWith('http') ? src : ('https://' + 'eclipse.caam.gov.my' + (src.startsWith('/') ? '' : '/') + src);
      break;
    }
  }

  return {
    pilotDetails: {
      name: pilotName || '-',
      licenseType: licenseType || 'ATPL(A)',
      licenseNo: licenseNo || '-'
    },
    qualifications: sortCaamQualifications(finalQualsList),
    medicalLimitations: medicalLimitationsFormatted,
    qrImageUrl: qrImageUrl,
    overallStatus: overallStatus,
    expiredCount: expiredCount,
    expiringSoonCount: expiringSoonCount,
    activeFleetFamily: activeFamily,
    hasLegacyRatings: hasLegacyRatings,
    advisoryNotice: advisoryNotice
  };
}
