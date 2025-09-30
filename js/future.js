/* Security: frame-bust (frame-ancestors 미사용 환경 보강) */
(function frameBust(){
  if (window.top !== window.self) {
    try { window.top.location = window.location; } catch (_) {}
  }
})();

const NS = 'thisdive';
const KEY = `${NS}_affirmation_scenario_v1`;
const K_EMO_CUR = `${NS}.p2:current`;
const K_SCN_LAST_EMO = `${NS}.scenario:lastEmotion`;

// DOM helpers
const $ = (s, r=document) => r.querySelector(s);
const $all = (s, r=document) => Array.from(r.querySelectorAll(s));

// State
const state = {
  year:'', month:'', day:'',
  place:'', with:'', doing:'',
  see:'', hear:'', feel:'',
  visualized:false
};

// Storage helpers
function save(){
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(_){}
}
function restore(){
  try{
    const curEmotion  = localStorage.getItem(K_EMO_CUR) || '';
    const lastEmotion = localStorage.getItem(K_SCN_LAST_EMO) || '';
    const sp = new URLSearchParams(location.search);
    const qrReenter = sp.get('qr') === '1' || sp.get('fresh') === '1' || (location.hash || '').includes('reset');

    if ((curEmotion && lastEmotion && curEmotion !== lastEmotion) || qrReenter) {
      clearAll();
      localStorage.setItem(K_SCN_LAST_EMO, curEmotion || '');
    } else {
      const raw = localStorage.getItem(KEY);
      if (raw) Object.assign(state, JSON.parse(raw) || {});
      localStorage.setItem(K_SCN_LAST_EMO, curEmotion || '');
    }
  }catch(_){}
}

// Reset
function clearAll(){
  Object.keys(state).forEach(k => state[k] = (k === 'visualized' ? false : ''));
  save();
  // Clear inputs if present
  ['#year','#month','#day','#place','#with','#doing','#see','#hear','#feel'].forEach(id=>{
    const el = $(id); if (el) el.value = '';
  });
  render();
}

// Bind inputs
function bind(el, key, transform){
  if (!el) return;
  el.addEventListener('input', ()=>{
    const v = (el.value || '').trim();
    state[key] = transform ? transform(v) : v;
    save(); render();
  });
}

// Safe preview DOM builder (no innerHTML from user data)
function setPreview(){
  const y = (state.year || '____');
  const m = (state.month || '__');
  const d = (state.day   || '__');
  const plc = (state.place || '____');
  const w = (state.with || '____');
  const act = (state.doing || '____');

  const box = $('#preview');
  if (box){
    box.replaceChildren(
      document.createTextNode('나는 '),
      el('strong', `${y}년 ${m}월 ${d}일`), document.createTextNode(', '),
      el('strong', plc), document.createTextNode('에서 '),
      el('strong', w), document.createTextNode('와(과) 함께 '),
      el('strong', act), document.createTextNode('을 하고 있다.')
    );
  }

  const s = (state.see  || '____');
  const h = (state.hear || '____');
  const f = (state.feel || '____');

  const box2 = $('#preview-sense');
  if (box2){
    box2.replaceChildren(
      document.createTextNode('👁️ '), el('strong', s), document.createTextNode('이 보이고, '),
      el('br'), el('br'),
      document.createTextNode('👂🏻 '), el('strong', h), document.createTextNode('이 들리고, '),
      el('br'), el('br'),
      document.createTextNode('✨ '), el('strong', f), document.createTextNode('이 느껴진다.')
    );
  }
}
function el(tag, text){
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  return node;
}

function render(){
  // (숫자 입력은 간단 정규화)
  const n = s => s.replace(/[^\d]/g,'');
  ['year','month','day'].forEach(k => { if (state[k]) state[k] = n(state[k]); });

  const visualized = $('#visualized');
  if (visualized) visualized.checked = !!state.visualized;

  setPreview();
}

document.addEventListener('DOMContentLoaded', () => {
  // Restore state
  restore();

  // Bind inputs
  bind($('#year'),  'year');
  bind($('#month'), 'month');
  bind($('#day'),   'day');
  bind($('#place'), 'place');
  bind($('#with'),  'with');
  bind($('#doing'), 'doing');
  bind($('#see'),   'see');
  bind($('#hear'),  'hear');
  bind($('#feel'),  'feel');

  const visualized = $('#visualized');
  if (visualized){
    visualized.addEventListener('change', ()=>{
      state.visualized = !!visualized.checked;
      save();
    }, { passive:true });
  }

  // Initial fill for inputs from state
  [['#year','year'],['#month','month'],['#day','day'],
   ['#place','place'],['#with','with'],['#doing','doing'],
   ['#see','see'],['#hear','hear'],['#feel','feel']].forEach(([sel,key])=>{
    const el = $(sel); if (el) el.value = state[key] || '';
  });

  render();

  // CTA → goal.html (클릭/터치/포인터 모두 대응)
  const nextBtn = $('#btn-next');
  if (nextBtn){
    const go = (ev)=>{
      ev.preventDefault(); ev.stopPropagation();
      try { sessionStorage.setItem(`${NS}_affirmation_scenario_payload`, JSON.stringify(state)); } catch(_){}
      const next = new URLSearchParams(location.search).get('next') || 'goal.html';
      const target = next; // 필요하면 파라미터 추가 가능
      try { window.location.assign(target); } catch { window.location.href = target; }
    };
    ['click','touchend','pointerup'].forEach(evt => nextBtn.addEventListener(evt, go, { passive:false }));
  }
});
