const NS = 'thisdive';
const K_P2_CURRENT    = `${NS}.p2:current`;   // emotion 페이지 현재 스냅샷
const K_P3_LASTSOURCE = `${NS}.p3:lastSource`;
const K_G_DATA        = `${NS}.g:data`;       // 이 페이지 스냅샷
const K_REWARD        = `${NS}.reward`;       // timer에서 사용

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

const catField = $('#catField');
const goalEl   = $('#goalInput');
const rewardEl = $('#rewardInput');
const readout  = $('#readout');
const nextBtn  = $('#nextBtn');

const diffText = {0:'목표의 난이도를 선택하세요.',1:'아주 쉽게',2:'쉽게',3:'적당하게',4:'약간 어렵게',5:'도전!'};

/* ── 감정이 바뀌면 저장값/입력값 초기화 ───────────────────────── */
(function syncWithEmotion(){
  try{
    const cur  = localStorage.getItem(K_P2_CURRENT)    || '';
    const last = localStorage.getItem(K_P3_LASTSOURCE) || '';
    if (cur !== last) {
      localStorage.removeItem(K_G_DATA);
      sessionStorage.removeItem(K_REWARD);
      if (goalEl)   goalEl.value   = '';
      if (rewardEl) rewardEl.value = '';
      $$('#catField .chip').forEach(c => { c.classList.remove('on'); const r=c.querySelector('input'); if(r) r.checked=false; });
      $$('input[name="difficulty"]').forEach(r => r.checked=false);
      if (readout) readout.textContent = diffText[0];
    }
    localStorage.setItem(K_P3_LASTSOURCE, cur);
  }catch(_){}
})();

/* ── 복원 & 저장 ─────────────────────────────────────────────── */
function updateReadout(v){ if (readout) readout.textContent = diffText[Number(v)||0]; }
function currentDiff(){ const r = $('input[name="difficulty"]:checked'); return r ? Number(r.value) : 0; }
function save(){
  const cat    = (catField?.querySelector('input:checked')||{}).value || '';
  const diff   = currentDiff();
  const goal   = goalEl?.value || '';
  const reward = rewardEl?.value || '';
  const data   = {cat,diff,goal,reward,at:Date.now()};
  try{
    localStorage.setItem(K_G_DATA, JSON.stringify(data));
    sessionStorage.setItem(`${NS}.goal`, goal);
    sessionStorage.setItem(K_REWARD, reward);
  }catch(_){}
}

(function restore(){
  updateReadout(0);
  try{
    const raw = localStorage.getItem(K_G_DATA);
    if (raw){
      const d = JSON.parse(raw);
      if (d.cat){
        const chip = $$('#catField label.chip input').find(i => i.value === d.cat);
        if (chip){ chip.checked = true; chip.closest('.chip')?.classList.add('on'); }
      }
      if (d.diff){ const r = $('#diff-'+d.diff); if (r){ r.checked = true; updateReadout(d.diff); } }
      if (typeof d.goal === 'string'   && goalEl)   goalEl.value   = d.goal;
      if (typeof d.reward === 'string' && rewardEl) rewardEl.value = d.reward;
    } else {
      const sr = (sessionStorage.getItem(K_REWARD) || '').trim();
      if (sr && rewardEl) rewardEl.value = sr;
    }
  }catch(_){}
})();

/* ── 카테고리 칩 ─────────────────────────────────────────────── */
catField?.addEventListener('click', e=>{
  const label = e.target.closest('.chip'); if(!label) return;
  const input = label.querySelector('input[type="radio"]'); if(!input) return;
  input.checked = true;
  $$('#catField .chip').forEach(c => c.classList.remove('on'));
  label.classList.add('on');
  save();
});

/* ── 별점(접근성) ─────────────────────────────────────────────── */
(function stars(){
  const radios = $$('input[name="difficulty"]');
  const labels = $$('#starsGroup label[for]');
  function set(v){ updateReadout(v); save(); }
  radios.forEach(r => r.addEventListener('change', () => set(r.value)));
  labels.forEach(l => l.addEventListener('click', ()=>{
    const id=l.getAttribute('for'); const el = $('#'+id);
    if (el){ el.checked=true; el.dispatchEvent(new Event('change',{bubbles:true})); }
  }));
  const checked = $('input[name="difficulty"]:checked');
  updateReadout(checked ? checked.value : 0);
})();

/* ── CTA → timer (안드 기본/사파리 신뢰성) ───────────────────── */
(function cta(){
  if (!nextBtn) return;
  function go(ev){
    try{ ev.preventDefault(); ev.stopPropagation(); }catch(_){}
    const goal   = (goalEl?.value||'').trim();
    const reward = (rewardEl?.value||'').trim();
    try{
      sessionStorage.setItem(`${NS}.goal`, goal);
      sessionStorage.setItem(K_REWARD, reward);
    }catch(_){}
    const qs = new URLSearchParams({ goal, reward, v:Date.now() });
    const url = 'timer.html?' + qs.toString();
    try{ window.location.assign(url); }catch(_){ window.location.href = url; }
  }
  ['click','touchend','pointerup'].forEach(evt=> nextBtn.addEventListener(evt, go, {passive:false}));
})();
