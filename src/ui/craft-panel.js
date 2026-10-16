/**
 * Craft panel module - Crafting UI rendering and interaction.
 * Ported verbatim from game.js renderCraft/refreshCraft.
 */

import Craft from '../gameplay/craft.js';

/**
 * Create craft panel controller.
 * @param {object} deps - Dependencies
 * @returns {object} Craft panel controller
 */
function createCraftPanel(deps) {
  const { $, inv, craftBtns, nearBench, chime, corePulse, emoTrigger, saveSave, renderInv } = deps;

  const craftBtnsRef = craftBtns;

  /**
   * Build craft panel UI.
   */
  function renderCraft() {
    const box = $('craftList'); box.innerHTML = ''; craftBtnsRef.length = 0;
    Craft.RECIPES.forEach(r => {
      const row = document.createElement('div'); row.className = 'rec';
      const name = document.createElement('div'); name.className = 'rname'; name.textContent = Craft.ITEMS[r.out] + (r.station === 'bench' ? ' (bench)' : '');
      const cost = document.createElement('div'); cost.className = 'rcost'; cost.textContent = Craft.costText(r);
      const btn = document.createElement('button'); btn.textContent = 'Craft';
      btn.addEventListener('click', () => { const res = Craft.craft(inv, r, nearBench()); if (res.ok) { renderInv(); chime([523, 659, 784], 0.05); deps.corePulse = 1; deps.saveSave(); } btn.blur(); });
      row.append(name, cost, btn); box.appendChild(row); craftBtnsRef.push({ r, btn });
    });
    refreshCraft();
  }

  /**
   * Refresh craft button states based on inventory and bench proximity.
   */
  function refreshCraft() {
    const nb = nearBench();
    craftBtnsRef.forEach(b => { const c = Craft.canCraft(inv, b.r, nb); b.btn.disabled = !c.ok; b.btn.title = c.reason; });
  }

  return { renderCraft, refreshCraft, craftBtns: craftBtnsRef };
}

export default createCraftPanel;