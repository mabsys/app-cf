// ./js/views/toolsView.js (2710_R238) - Decoupled 3D Vertical Reel & 2-Faced Card Renderer
/* ==========================================================================
   CertiFly - Tools View ES Module (toolsView.js)
   Decoupled 3D Vertical Reel & 2-Faced Card Renderer
   ========================================================================== */

export function renderToolsView(containerSelector = '#tools-view-container') {
  const container = typeof containerSelector === 'string' 
    ? document.querySelector(containerSelector) 
    : containerSelector;

  if (!container) return;

  container.innerHTML = `
    <div id="tools-view-root" class="w-full h-full flex flex-col justify-between overflow-hidden bg-slate-900 text-white relative select-none">
      
      <!-- CATEGORY SWITCHER BAR -->
      <div class="p-3 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md z-20 flex justify-center items-center">
        <div class="flex p-1 bg-slate-800/80 rounded-2xl border border-slate-700/60 max-w-[340px] w-full shadow-inner">
          <button type="button" id="btn-cat-validity" onclick="switchToolCategory('validity')" 
                  class="flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer bg-sky-500 text-white shadow-md shadow-sky-500/20">
            Validity (4)
          </button>
          <button type="button" id="btn-cat-dutyrest" onclick="switchToolCategory('dutyrest')" 
                  class="flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer text-slate-400 hover:text-slate-200">
            Duty & Rest (4)
          </button>
        </div>
      </div>

      <!-- 3D VERTICAL REEL VIEWPORT -->
      <div class="reel-3d-viewport flex-1 relative overflow-hidden flex items-center justify-center p-4 perspective-1000">
        <div id="reel-cylinder" class="reel-cylinder-container w-full max-w-[360px] relative flex flex-col items-center justify-center transition-transform duration-300">
          
          <!-- Category A Cards (Validity Suite) -->
          <div id="suite-validity" class="suite-container w-full space-y-6 flex flex-col items-center">
            ${renderMedicalCard()}
            ${renderPpcCard()}
            ${renderRecurrentCard()}
            ${renderRecencyCard()}
          </div>

          <!-- Category B Cards (Duty & Rest Suite) -->
          <div id="suite-dutyrest" class="suite-container w-full space-y-6 flex flex-col items-center hidden">
            ${renderStandbyCard()}
            ${renderMaxFdpCard()}
            ${renderPreflightCard()}
            ${renderCumulativeCard()}
          </div>

        </div>
      </div>

      <!-- SINGLE OUTPUT CARD ANCHOR (Shared Output Sheet) -->
      <div id="tools-output-card-container" class="w-full px-4 pb-3 z-20 max-w-[380px] mx-auto hidden">
        <div id="tools-output-card" class="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-4 shadow-2xl transition-all duration-300">
          <!-- Dynamically updated by renderNormalizedOutput -->
        </div>
      </div>

    </div>
  `;
}

// --------------------------------------------------------------------------
// Helper: 2-Faced Card Shell
// --------------------------------------------------------------------------
function renderCardShell(toolId, title, shortName, inputBodyHtml) {
  return `
    <div class="tool-card-3d-wrapper w-full max-w-[340px] perspective-1000" id="tool-card-${toolId}" data-tool-id="${toolId}">
      <div class="card-3d-inner w-full relative transition-transform duration-500 preserve-3d shadow-2xl rounded-3xl border border-slate-800 bg-slate-900/95 text-white">
        
        <!-- FRONT FACE: INPUT FORM -->
        <div class="card-face card-front p-4 w-full flex flex-col justify-between backface-hidden">
          <div>
            <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <h3 class="text-xs font-bold tracking-wider text-slate-200 uppercase">${title}</h3>
              <button type="button" onclick="resetToolInputs('${toolId}')" class="text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer flex items-center gap-1">
                <span>↺</span> Reset
              </button>
            </div>
            
            <div class="card-inputs-body space-y-3">
              ${inputBodyHtml}
            </div>
          </div>

          <button type="button" onclick="executeAndFlipCard('${toolId}')" class="w-full mt-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/25 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5">
            <span>Compute ${shortName}</span>
            <span class="text-sm">➔</span>
          </button>
        </div>

        <!-- BACK FACE: 4-TIER RESULT VERDICT -->
        <div class="card-face card-back p-4 w-full flex flex-col justify-between backface-hidden rotate-y-180 absolute inset-0 bg-slate-900 rounded-3xl">
          <div id="output-back-content-${toolId}" class="w-full flex flex-col h-full justify-between">
            <!-- Rendered by renderNormalizedOutput -->
            <div class="text-center p-6 text-slate-500 text-xs">Awaiting calculation...</div>
          </div>
        </div>

      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// Input Form Renderers (Category A)
// --------------------------------------------------------------------------
function renderMedicalCard() {
  const inputs = `
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">Last Exam Date</label>
      <input type="date" id="input-med-exam-date" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono">
    </div>
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">License Type</label>
      <select id="input-med-license-type" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-medium">
        <option value="ATPL">ATPL (Airline Transport Pilot)</option>
        <option value="CPL">CPL (Commercial Pilot)</option>
        <option value="MPL">MPL (Multi-Crew Pilot)</option>
      </select>
    </div>
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">Age Bracket</label>
      <select id="input-med-age-bracket" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-medium">
        <option value="UNDER_40">Under 40 Years (24 Months)</option>
        <option value="40_TO_59" selected>40 to 59 Years (12 Months)</option>
        <option value="60_PLUS">60+ Years (6 Months)</option>
      </select>
    </div>
  `;
  return renderCardShell('medical', 'Medical Validity', 'Medical', inputs);
}

function renderPpcCard() {
  const inputs = `
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">Last Conduct Date</label>
      <input type="date" id="input-ppc-conduct-date" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono">
    </div>
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">Current Expiry Date (Optional)</label>
      <input type="date" id="input-ppc-expiry-date" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono">
    </div>
  `;
  return renderCardShell('ppc', 'PPC / LPC Validity', 'PPC', inputs);
}

function renderRecurrentCard() {
  const inputs = `
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">Qualification Module</label>
      <input type="hidden" id="input-recurrent-course" value="LC">
      <button type="button" onclick="openRecurrentCourseModal()" class="w-full p-2.5 rounded-xl bg-slate-800 text-left border border-slate-700 hover:border-sky-500/50 transition-all flex items-center justify-between cursor-pointer">
        <div>
          <p id="recurrent-course-label" class="text-xs font-bold text-white">Line Check (LC)</p>
          <p id="recurrent-course-sublabel" class="text-[10px] text-slate-400">Annual (12 Calendar Months)</p>
        </div>
        <span class="text-slate-400 text-xs">▼</span>
      </button>
    </div>
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">Completion Date</label>
      <input type="date" id="input-recurrent-conduct-date" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono">
    </div>
  `;
  return renderCardShell('recurrent', 'Recurrent Module', 'Recurrent', inputs);
}

function renderRecencyCard() {
  const inputs = `
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-[11px] font-semibold text-slate-400 mb-1 text-center">Day Landings</label>
        <input type="number" id="input-recency-day" min="0" max="99" value="0" class="w-full px-3 py-2.5 rounded-xl bg-slate-800 text-white text-sm border border-slate-700 focus:outline-none focus:border-sky-500 font-mono font-bold text-center">
      </div>
      <div>
        <label class="block text-[11px] font-semibold text-slate-400 mb-1 text-center">Night Landings</label>
        <input type="number" id="input-recency-night" min="0" max="99" value="0" class="w-full px-3 py-2.5 rounded-xl bg-slate-800 text-white text-sm border border-slate-700 focus:outline-none focus:border-sky-500 font-mono font-bold text-center">
      </div>
    </div>
  `;
  return renderCardShell('recency', 'Landing Recency (90D)', 'Recency', inputs);
}

// --------------------------------------------------------------------------
// Input Form Renderers (Category B)
// --------------------------------------------------------------------------
function renderStandbyCard() {
  const inputs = `
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-[11px] font-semibold text-slate-400 mb-1 text-center">Start Time</label>
        <input type="time" id="input-stby-start-time" value="06:00" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono text-center">
      </div>
      <div>
        <label class="block text-[11px] font-semibold text-slate-400 mb-1 text-center">Callout Time</label>
        <input type="time" id="input-stby-report-time" value="10:00" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono text-center">
      </div>
    </div>
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">Standby Location</label>
      <div class="flex p-1 bg-slate-800 rounded-xl border border-slate-700/80">
        <button type="button" id="btn-stby-loc-home" onclick="setStandbyLocation('HOME')" class="flex-1 py-1.5 rounded-lg text-xs font-bold bg-sky-500 text-white shadow-sm transition-all cursor-pointer">Home Base</button>
        <button type="button" id="btn-stby-loc-airport" onclick="setStandbyLocation('AIRPORT')" class="flex-1 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer">Airport Standby</button>
      </div>
    </div>
  `;
  return renderCardShell('standby', 'Standby FDP', 'Standby', inputs);
}

function renderMaxFdpCard() {
  const inputs = `
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-[11px] font-semibold text-slate-400 mb-1 text-center">Report Time</label>
        <input type="time" id="input-fdp-report-time" value="06:00" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono text-center">
      </div>
      <div>
        <label class="block text-[11px] font-semibold text-slate-400 mb-1 text-center">Sectors</label>
        <input type="number" id="input-fdp-sectors" min="1" max="10" value="2" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono text-center font-bold">
      </div>
    </div>
    <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-800 border border-slate-700">
      <span class="text-xs font-semibold text-slate-300">Acclimatised State</span>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" id="input-fdp-acclimatised" checked class="sr-only peer">
        <div class="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
      </label>
    </div>
  `;
  return renderCardShell('max-fdp', 'Max Allowable FDP', 'Max FDP', inputs);
}

function renderPreflightCard() {
  const inputs = `
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">Preceding Duty Hours</label>
      <input type="number" id="input-rest-preceding-duty" min="0" max="30" value="10" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono text-center font-bold">
    </div>
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">Rest Location</label>
      <select id="input-rest-location" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-medium">
        <option value="HOME">Home Base</option>
        <option value="OUTSTATION">Outstation / Layover</option>
      </select>
    </div>
  `;
  return renderCardShell('pre-flight-rest', 'Pre-Flight Rest', 'Rest', inputs);
}

function renderCumulativeCard() {
  const inputs = `
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">7-Day Cumulative Duty (HH:MM)</label>
      <input type="text" id="input-cum-duty-7d" placeholder="e.g. 32:15" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono text-center">
    </div>
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">28-Day Cumulative Flight Time</label>
      <input type="text" id="input-cum-flight-28d" placeholder="e.g. 78:45" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono text-center">
    </div>
  `;
  return renderCardShell('cumulative', 'Cumulative Hours', 'Cumulative', inputs);
}


