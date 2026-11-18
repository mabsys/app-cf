// ./js/modals/maxFdpModifiersModal.js (1811_R101) - CertiFly Max FDP Modifiers Modal Component
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

export const maxFdpModifiersModalHTML = `
<!-- EFB MAX FDP FLIGHT MODIFIERS MODAL -->
<div id="efb-maxfdp-modifiers-modal" class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md hidden select-none" onclick="if(event.target === this) closeMaxFdpModifiersModal()">
  <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-4 shadow-md flex flex-col justify-between max-h-[85vh] overflow-hidden">
    <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 shrink-0">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
        <span class="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Flight Modifiers</span>
      </div>
      <button type="button" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer" onclick="closeMaxFdpModifiersModal()">✕</button>
    </div>

    <div class="flex-1 my-3 overflow-y-auto space-y-3 no-scrollbar text-xs">
      <!-- 1. LONGEST SECTOR DURATION -->
      <div>
        <label class="block font-medium text-slate-500 dark:text-slate-400 mb-1">Longest Sector Duration</label>
        <button type="button" id="btn-modal-maxfdp-longest-trigger" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 text-left flex items-center justify-between cursor-pointer transition-all" onclick="toggleModifierAccordion('modal-maxfdp-longest-sector')">
          <span id="btn-modal-maxfdp-longest-display">Standard Sector (&lt; 7h)</span>
          <span id="arrow-modal-maxfdp-longest-sector" class="text-slate-400 text-[10px] transition-transform duration-200">▼</span>
        </button>
        <input type="hidden" id="modal-maxfdp-longest-sector" value="0">

        <div id="accordion-modal-maxfdp-longest-sector" class="hidden mt-1.5 p-1.5 space-y-1 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 transition-all">
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-longest-sector" data-value="0" data-label="Standard Sector (&lt; 7h)" onclick="selectModifierInlineOption('modal-maxfdp-longest-sector', '0', 'Standard Sector (&lt; 7h)')">
            <span>Standard Sector (&lt; 7h)</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-longest-sector" data-value="8" data-label="Long Sector (&gt; 7h to 9h)" onclick="selectModifierInlineOption('modal-maxfdp-longest-sector', '8', 'Long Sector (&gt; 7h to 9h)')">
            <span>Long Sector (&gt; 7h to 9h)</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-longest-sector" data-value="10" data-label="Extended Sector (&gt; 9h to 11h)" onclick="selectModifierInlineOption('modal-maxfdp-longest-sector', '10', 'Extended Sector (&gt; 9h to 11h)')">
            <span>Extended Sector (&gt; 9h to 11h)</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-longest-sector" data-value="12" data-label="Ultra Long Sector (&gt; 11h)" onclick="selectModifierInlineOption('modal-maxfdp-longest-sector', '12', 'Ultra Long Sector (&gt; 11h)')">
            <span>Ultra Long Sector (&gt; 11h)</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
        </div>
      </div>

      <!-- 2. SPLIT DUTY GROUND REST -->
      <div>
        <label class="block font-medium text-slate-500 dark:text-slate-400 mb-1">Split Duty Ground Rest</label>
        <button type="button" id="btn-modal-maxfdp-split-trigger" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 text-left flex items-center justify-between cursor-pointer transition-all" onclick="toggleModifierAccordion('modal-maxfdp-split-rest')">
          <span id="btn-modal-maxfdp-split-display">None (0h)</span>
          <span id="arrow-modal-maxfdp-split-rest" class="text-slate-400 text-[10px] transition-transform duration-200">▼</span>
        </button>
        <input type="hidden" id="modal-maxfdp-split-rest" value="0">

        <div id="accordion-modal-maxfdp-split-rest" class="hidden mt-1.5 p-1.5 space-y-1 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 transition-all">
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-split-rest" data-value="0" data-label="None (0h)" onclick="selectModifierInlineOption('modal-maxfdp-split-rest', '0', 'None (0h)')">
            <span>None (0h)</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-split-rest" data-value="3.5" data-label="3.5 Hours Ground Rest" onclick="selectModifierInlineOption('modal-maxfdp-split-rest', '3.5', '3.5 Hours Ground Rest')">
            <span>3.5 Hours Ground Rest</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-split-rest" data-value="4" data-label="4.0 Hours Ground Rest" onclick="selectModifierInlineOption('modal-maxfdp-split-rest', '4', '4.0 Hours Ground Rest')">
            <span>4.0 Hours Ground Rest</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-split-rest" data-value="5" data-label="5.0 Hours Ground Rest" onclick="selectModifierInlineOption('modal-maxfdp-split-rest', '5', '5.0 Hours Ground Rest')">
            <span>5.0 Hours Ground Rest</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-split-rest" data-value="6" data-label="6.0+ Hours Ground Rest" onclick="selectModifierInlineOption('modal-maxfdp-split-rest', '6', '6.0+ Hours Ground Rest')">
            <span>6.0+ Hours Ground Rest</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
        </div>
      </div>

      <!-- 3. IN-FLIGHT REST TAKEN -->
      <div>
        <label class="block font-medium text-slate-500 dark:text-slate-400 mb-1">In-Flight Rest Taken (Hours)</label>
        <button type="button" id="btn-modal-maxfdp-inflight-trigger" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 text-left flex items-center justify-between cursor-pointer transition-all" onclick="toggleModifierAccordion('modal-maxfdp-inflight-rest')">
          <span id="btn-modal-maxfdp-inflight-display">0.0 Hours</span>
          <span id="arrow-modal-maxfdp-inflight-rest" class="text-slate-400 text-[10px] transition-transform duration-200">▼</span>
        </button>
        <input type="hidden" id="modal-maxfdp-inflight-rest" value="0">

        <div id="accordion-modal-maxfdp-inflight-rest" class="hidden mt-1.5 p-1.5 space-y-1 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 transition-all">
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-inflight-rest" data-value="0" data-label="0.0 Hours" onclick="selectModifierInlineOption('modal-maxfdp-inflight-rest', '0', '0.0 Hours')">
            <span>0.0 Hours</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-inflight-rest" data-value="3" data-label="3.0 Hours Rest" onclick="selectModifierInlineOption('modal-maxfdp-inflight-rest', '3', '3.0 Hours Rest')">
            <span>3.0 Hours Rest</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-inflight-rest" data-value="3.5" data-label="3.5 Hours Rest" onclick="selectModifierInlineOption('modal-maxfdp-inflight-rest', '3.5', '3.5 Hours Rest')">
            <span>3.5 Hours Rest</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-inflight-rest" data-value="4" data-label="4.0 Hours Rest" onclick="selectModifierInlineOption('modal-maxfdp-inflight-rest', '4', '4.0 Hours Rest')">
            <span>4.0 Hours Rest</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-inflight-rest" data-value="4.5" data-label="4.5 Hours Rest" onclick="selectModifierInlineOption('modal-maxfdp-inflight-rest', '4.5', '4.5 Hours Rest')">
            <span>4.5 Hours Rest</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-inflight-rest" data-value="5" data-label="5.0 Hours Rest" onclick="selectModifierInlineOption('modal-maxfdp-inflight-rest', '5', '5.0 Hours Rest')">
            <span>5.0 Hours Rest</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-inflight-rest" data-value="5.5" data-label="5.5 Hours Rest" onclick="selectModifierInlineOption('modal-maxfdp-inflight-rest', '5.5', '5.5 Hours Rest')">
            <span>5.5 Hours Rest</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-inflight-rest" data-value="6" data-label="6.0 Hours Rest" onclick="selectModifierInlineOption('modal-maxfdp-inflight-rest', '6', '6.0 Hours Rest')">
            <span>6.0 Hours Rest</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
        </div>
      </div>

      <!-- 4. FLIGHT CREW COMPLEMENT -->
      <div>
        <label class="block font-medium text-slate-500 dark:text-slate-400 mb-1">Flight Crew Complement</label>
        <button type="button" id="btn-modal-maxfdp-crew-trigger" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 text-left flex items-center justify-between cursor-pointer transition-all" onclick="toggleModifierAccordion('modal-maxfdp-crew-count')">
          <span id="btn-modal-maxfdp-crew-display">2 Pilots (Standard Crew)</span>
          <span id="arrow-modal-maxfdp-crew-count" class="text-slate-400 text-[10px] transition-transform duration-200">▼</span>
        </button>
        <input type="hidden" id="modal-maxfdp-crew-count" value="2">

        <div id="accordion-modal-maxfdp-crew-count" class="hidden mt-1.5 p-1.5 space-y-1 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 transition-all">
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-crew-count" data-value="2" data-label="2 Pilots (Standard Crew)" onclick="selectModifierInlineOption('modal-maxfdp-crew-count', '2', '2 Pilots (Standard Crew)')">
            <span>2 Pilots (Standard Crew)</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-crew-count" data-value="3" data-label="3 Pilots (Augmented Crew)" onclick="selectModifierInlineOption('modal-maxfdp-crew-count', '3', '3 Pilots (Augmented Crew)')">
            <span>3 Pilots (Augmented Crew)</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-crew-count" data-value="4" data-label="4 Pilots (Double Crew)" onclick="selectModifierInlineOption('modal-maxfdp-crew-count', '4', '4 Pilots (Double Crew)')">
            <span>4 Pilots (Double Crew)</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
        </div>
      </div>

      <!-- 5. PRECEDING REST -->
      <div>
        <label class="block font-medium text-slate-500 dark:text-slate-400 mb-1">Preceding Rest (Unacclimatised Only)</label>
        <button type="button" id="btn-modal-maxfdp-preceding-trigger" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 text-left flex items-center justify-between cursor-pointer transition-all" onclick="toggleModifierAccordion('modal-maxfdp-preceding-rest')">
          <span id="btn-modal-maxfdp-preceding-display">Up to 18h OR Over 30h</span>
          <span id="arrow-modal-maxfdp-preceding-rest" class="text-slate-400 text-[10px] transition-transform duration-200">▼</span>
        </button>
        <input type="hidden" id="modal-maxfdp-preceding-rest" value="UP_TO_18_OR_OVER_30">

        <div id="accordion-modal-maxfdp-preceding-rest" class="hidden mt-1.5 p-1.5 space-y-1 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 transition-all">
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-preceding-rest" data-value="UP_TO_18_OR_OVER_30" data-label="Up to 18h OR Over 30h" onclick="selectModifierInlineOption('modal-maxfdp-preceding-rest', 'UP_TO_18_OR_OVER_30', 'Up to 18h OR Over 30h')">
            <span>Up to 18h OR Over 30h</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
          <button type="button" class="modifier-opt-btn w-full p-2 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all bg-white dark:bg-slate-900 border border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600" data-param="modal-maxfdp-preceding-rest" data-value="BETWEEN_18_AND_30" data-label="Between 18h and 30h" onclick="selectModifierInlineOption('modal-maxfdp-preceding-rest', 'BETWEEN_18_AND_30', 'Between 18h and 30h')">
            <span>Between 18h and 30h</span>
            <span class="badge-selected text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hidden">SELECTED</span>
          </button>
        </div>
      </div>
    </div>

    <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 shrink-0">
      <button type="button" class="py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-500 cursor-pointer" onclick="closeMaxFdpModifiersModal()">Cancel</button>
      <button type="button" class="py-1.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer" onclick="confirmMaxFdpModifiers()">Apply Modifiers</button>
    </div>
  </div>
</div>
`;

export function initMaxFdpModifiersModal() {
  if (!document.getElementById("efb-maxfdp-modifiers-modal")) {
    document.body.insertAdjacentHTML("beforeend", maxFdpModifiersModalHTML);
  }
}

export function openMaxFdpModifiersModal() {
  initMaxFdpModifiersModal();

  const modal = document.getElementById('efb-maxfdp-modifiers-modal');
  if (!modal) return;

  const getToolState = window.getToolsState ? window.getToolsState() : {};
  const longestVal = String(getToolState.maxfdpLongestSector || 0);
  const splitVal = String(getToolState.maxfdpSplitDutyRestHours || 0);
  const inflightVal = String(getToolState.maxfdpInflightRestHours || 0);
  const crewVal = String(getToolState.maxfdpCrewCount || 2);
  const precVal = getToolState.maxfdpPrecedingRest || 'UP_TO_18_OR_OVER_30';

  const longestIn = document.getElementById('modal-maxfdp-longest-sector');
  const splitIn = document.getElementById('modal-maxfdp-split-rest');
  const inflightIn = document.getElementById('modal-maxfdp-inflight-rest');
  const crewIn = document.getElementById('modal-maxfdp-crew-count');
  const precIn = document.getElementById('modal-maxfdp-preceding-rest');

  if (longestIn) longestIn.value = longestVal;
  if (splitIn) splitIn.value = splitVal;
  if (inflightIn) inflightIn.value = inflightVal;
  if (crewIn) crewIn.value = crewVal;
  if (precIn) precIn.value = precVal;

  const longestLabels = { '0': 'Standard Sector (< 7h)', '8': 'Long Sector (> 7h to 9h)', '10': 'Extended Sector (> 9h to 11h)', '12': 'Ultra Long Sector (> 11h)' };
  const splitLabels = { '0': 'None (0h)', '3.5': '3.5 Hours Ground Rest', '4': '4.0 Hours Ground Rest', '5': '5.0 Hours Ground Rest', '6': '6.0+ Hours Ground Rest' };
  const inflightLabels = { '0': '0.0 Hours', '3': '3.0 Hours Rest', '3.5': '3.5 Hours Rest', '4': '4.0 Hours Rest', '4.5': '4.5 Hours Rest', '5': '5.0 Hours Rest', '5.5': '5.5 Hours Rest', '6': '6.0 Hours Rest' };
  const crewLabels = { '2': '2 Pilots (Standard Crew)', '3': '3 Pilots (Augmented Crew)', '4': '4 Pilots (Double Crew)' };
  const precLabels = { 'UP_TO_18_OR_OVER_30': 'Up to 18h OR Over 30h', 'BETWEEN_18_AND_30': 'Between 18h and 30h' };

  const longestDisp = document.getElementById('btn-modal-maxfdp-longest-display');
  if (longestDisp) longestDisp.textContent = longestLabels[longestVal] || 'Standard Sector (< 7h)';

  const splitDisp = document.getElementById('btn-modal-maxfdp-split-display');
  if (splitDisp) splitDisp.textContent = splitLabels[splitVal] || 'None (0h)';

  const inflightDisp = document.getElementById('btn-modal-maxfdp-inflight-display');
  if (inflightDisp) inflightDisp.textContent = inflightLabels[inflightVal] || '0.0 Hours';

  const crewDisp = document.getElementById('btn-modal-maxfdp-crew-display');
  if (crewDisp) crewDisp.textContent = crewLabels[crewVal] || '2 Pilots (Standard Crew)';

  const precDisp = document.getElementById('btn-modal-maxfdp-preceding-display');
  if (precDisp) precDisp.textContent = precLabels[precVal] || 'Up to 18h OR Over 30h';

  const allAccordions = document.querySelectorAll('[id^=accordion-modal-maxfdp-]');
  allAccordions.forEach(acc => acc.classList.add('hidden'));

  const allArrows = document.getElementById('efb-maxfdp-modifiers-modal')?.querySelectorAll('[id^=arrow-modal-maxfdp-]');
  if (allArrows) {
    allArrows.forEach(arr => {
      arr.textContent = '▼';
      arr.classList.remove('rotate-180');
    });
  }

  updateModifierInlineSelectionUI('modal-maxfdp-longest-sector', longestVal);
  updateModifierInlineSelectionUI('modal-maxfdp-split-rest', splitVal);
  updateModifierInlineSelectionUI('modal-maxfdp-inflight-rest', inflightVal);
  updateModifierInlineSelectionUI('modal-maxfdp-crew-count', crewVal);
  updateModifierInlineSelectionUI('modal-maxfdp-preceding-rest', precVal);

  modal.classList.remove('hidden');
}

export function closeMaxFdpModifiersModal() {
  const modal = document.getElementById('efb-maxfdp-modifiers-modal');
  if (modal) modal.classList.add('hidden');
}

export function toggleModifierAccordion(paramId) {
  const accordion = document.getElementById(`accordion-${paramId}`);
  const arrow = document.getElementById(`arrow-${paramId}`);
  if (!accordion) return;

  const isHidden = accordion.classList.contains('hidden');
  const allAccordions = document.querySelectorAll('[id^=accordion-modal-maxfdp-]');
  allAccordions.forEach(acc => acc.classList.add('hidden'));

  const allArrows = document.getElementById('efb-maxfdp-modifiers-modal')?.querySelectorAll('[id^=arrow-modal-maxfdp-]');
  if (allArrows) {
    allArrows.forEach(arr => {
      arr.textContent = '▼';
      arr.classList.remove('rotate-180');
    });
  }

  if (isHidden) {
    accordion.classList.remove('hidden');
    if (arrow) {
      arrow.textContent = '▲';
      arrow.classList.add('rotate-180');
    }
  }
}

export function selectModifierInlineOption(paramId, val, label) {
  const hiddenInput = document.getElementById(paramId);
  if (hiddenInput) hiddenInput.value = val;

  const displayIdMap = {
    'modal-maxfdp-longest-sector': 'btn-modal-maxfdp-longest-display',
    'modal-maxfdp-split-rest': 'btn-modal-maxfdp-split-display',
    'modal-maxfdp-inflight-rest': 'btn-modal-maxfdp-inflight-display',
    'modal-maxfdp-crew-count': 'btn-modal-maxfdp-crew-display',
    'modal-maxfdp-preceding-rest': 'btn-modal-maxfdp-preceding-display'
  };

  const displayEl = document.getElementById(displayIdMap[paramId]);
  if (displayEl) displayEl.textContent = label;

  updateModifierInlineSelectionUI(paramId, val);
  toggleModifierAccordion(paramId);
}

export function updateModifierInlineSelectionUI(paramId, currentVal) {
  const buttons = document.querySelectorAll(`button[data-param="${paramId}"]`);
  buttons.forEach(btn => {
    const isSelected = btn.dataset.value === currentVal;
    const badge = btn.querySelector('.badge-selected');
    if (isSelected) {
      btn.classList.add('border-blue-500', 'bg-blue-500/10', 'text-blue-600', 'dark:text-blue-400');
      btn.classList.remove('border-transparent');
      if (badge) badge.classList.remove('hidden');
    } else {
      btn.classList.remove('border-blue-500', 'bg-blue-500/10', 'text-blue-600', 'dark:text-blue-400');
      btn.classList.add('border-transparent');
      if (badge) badge.classList.add('hidden');
    }
  });
}

export function confirmMaxFdpModifiers() {
  const longestEl = document.getElementById('modal-maxfdp-longest-sector');
  const splitEl = document.getElementById('modal-maxfdp-split-rest');
  const inflightEl = document.getElementById('modal-maxfdp-inflight-rest');
  const crewEl = document.getElementById('modal-maxfdp-crew-count');
  const precEl = document.getElementById('modal-maxfdp-preceding-rest');

  const toolsState = window.getToolsState ? window.getToolsState() : {};

  if (longestEl) toolsState.maxfdpLongestSector = parseFloat(longestEl.value) || 0;
  if (splitEl) toolsState.maxfdpSplitDutyRestHours = parseFloat(splitEl.value) || 0;
  if (inflightEl) toolsState.maxfdpInflightRestHours = parseFloat(inflightEl.value) || 0;
  if (crewEl) toolsState.maxfdpCrewCount = parseInt(crewEl.value, 10) || 2;
  if (precEl) toolsState.maxfdpPrecedingRest = precEl.value;

  const badge = document.getElementById('badge-maxfdp-advanced-status');
  const trigger = document.getElementById('btn-maxfdp-advanced-trigger');

  const hasModifiers = (
    toolsState.maxfdpLongestSector > 0 ||
    toolsState.maxfdpSplitDutyRestHours > 0 ||
    toolsState.maxfdpInflightRestHours > 0 ||
    toolsState.maxfdpCrewCount > 2
  );

  if (badge) {
    if (hasModifiers) {
      const parts = [];
      if (toolsState.maxfdpLongestSector > 0) parts.push(`Longest ${toolsState.maxfdpLongestSector}h`);
      if (toolsState.maxfdpSplitDutyRestHours > 0) parts.push(`Split ${toolsState.maxfdpSplitDutyRestHours}h`);
      if (toolsState.maxfdpInflightRestHours > 0) parts.push(`Rest ${toolsState.maxfdpInflightRestHours}h`);
      if (toolsState.maxfdpCrewCount > 2) parts.push(`${toolsState.maxfdpCrewCount} Pilots`);
      badge.textContent = parts.join(' • ');
      badge.className = 'text-[10px] font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-full';
      if (trigger) trigger.className = 'w-full py-2 px-3 rounded-xl border border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-between cursor-pointer transition-all';
    } else {
      badge.textContent = 'Standard';
      badge.className = 'text-[10px] text-slate-400 font-medium';
      if (trigger) trigger.className = 'w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-between cursor-pointer transition-all hover:border-slate-300 dark:hover:border-slate-700';
    }
  }

  closeMaxFdpModifiersModal();

  if (typeof window.dispatchActiveToolCalculation === 'function') {
    window.dispatchActiveToolCalculation('maxfdp');
  }
}

if (typeof window !== 'undefined') {
  window.openMaxFdpModifiersModal = openMaxFdpModifiersModal;
  window.closeMaxFdpModifiersModal = closeMaxFdpModifiersModal;
  window.toggleModifierAccordion = toggleModifierAccordion;
  window.selectModifierInlineOption = selectModifierInlineOption;
  window.confirmMaxFdpModifiers = confirmMaxFdpModifiers;
}
