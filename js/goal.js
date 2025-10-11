// ──────────────────────────────────────────────────────────────
// goal.js
// 입력값 자동 저장(디바운스) + 탭 전환/이탈 시 안전 저장 + 복원 강화
// ──────────────────────────────────────────────────────────────
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

/* ── 유틸: 디바운스 ─────────────────────────────────────────── */
function debounce(fn, wait=200){
  let t;
  return (...args)=>{
    clearTimeout(t);
    t = setTimeout(()=>fn.apply(null,args), wait);
  };
}

/* ── 감정이 바뀌면 저장값/입력값 초기화 ───────────────────────── */
(function syncWithEmotion(){
  try{
    const cur  = localStorage.getItem(K_P2_CURRENT)    || '';
    const last = localStorage.getItem(K_P3_LASTSOURCE) || '';
    if (cur !== last) {
      localStorage.removeItem(K_G_DATA);
      sessionStorage.removeItem(`${NS}.goal`);
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

function currentSnapshot(){
  const cat    = (catField?.querySelector('input:checked')||{}).value || '';
  const diff   = currentDiff();
  const goal   = goalEl?.value || '';
  const reward = rewardEl?.value || '';
  return {cat,diff,goal,reward,at:Date.now()};
}

function save(){
  const data = currentSnapshot();
  try{
    localStorage.setItem(K_G_DATA, JSON.stringify(data));
    // timer.html 호환을 위해 세션에도 최신값을 넣어 둠
    sessionStorage.setItem(`${NS}.goal`, data.goal || '');
    sessionStorage.setItem(K_REWARD, data.reward || '');
  }catch(_){}
  return data;
}

(function restore(){
  updateReadout(0);
  try{
    const raw = localStorage.getItem(K_G_DATA);
    if (raw){
      const d = JSON.parse(raw);
      // 카테고리
      if (d.cat){
        const chip = $$('#catField label.chip input').find(i => i.value === d.cat);
        if (chip){ chip.checked = true; chip.closest('.chip')?.classList.add('on'); }
      }
      // 난이도
      if (d.diff){ const r = $('#diff-'+d.diff); if (r){ r.checked = true; updateReadout(d.diff); } }
      // 목표/보상 (로컬 우선)
      if (typeof d.goal === 'string'   && goalEl)   goalEl.value   = d.goal;
      if (typeof d.reward === 'string' && rewardEl) rewardEl.value = d.reward;
    }

    // 세션스토리지 보정(타이머/다른 페이지 경유 복귀 시)
    const sGoal   = (sessionStorage.getItem(`${NS}.goal`) || '').trim();
    const sReward = (sessionStorage.getItem(K_REWARD) || '').trim();
    if (goalEl   && !goalEl.value   && sGoal)   goalEl.value   = sGoal;
    if (rewardEl && !rewardEl.value && sReward) rewardEl.value = sReward;

    // 화면에 보이는 값이 비어있지 않다면 즉시 스냅샷 보정 저장
    if ((goalEl?.value || rewardEl?.value) && !raw){
      save();
    }
  }catch(_){}
})();

/* ── 입력 필드 자동 저장(디바운스) ───────────────────────────── */
const autosave = debounce(()=>save(), 200);

goalEl?.addEventListener('input', autosave);
rewardEl?.addEventListener('input', autosave);
goalEl?.addEventListener('change', save);
rewardEl?.addEventListener('change', save);
goalEl?.addEventListener('blur', save);
rewardEl?.addEventListener('blur', save);

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

/* ── 페이지 이탈/복귀 안정화 ─────────────────────────────────── */
window.addEventListener('beforeunload', save);
document.addEventListener('visibilitychange', ()=>{
  if (document.visibilityState === 'hidden') save();
});

/* ── CTA → timer (안드 기본/사파리 신뢰성) ───────────────────── */
(function cta(){
  if (!nextBtn) return;
  function go(ev){
    try{ ev.preventDefault(); ev.stopPropagation(); }catch(_){}
    // 저장을 한번 더 확실하게
    const latest = save();
    const qs = new URLSearchParams({
      goal:   latest.goal || '',
      reward: latest.reward || '',
      v: Date.now()
    });
    const url = 'timer.html?' + qs.toString();
    try{ window.location.assign(url); }catch(_){ window.location.href = url; }
  }
  ['click','touchend','pointerup'].forEach(evt=> nextBtn.addEventListener(evt, go, {passive:false}));
})();
