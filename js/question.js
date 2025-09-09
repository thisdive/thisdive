/* =========================
   네임스페이스/스토리지 키
   ========================= */
const NS = "thisdive";
const K_P2_CURRENT = `${NS}.p2:current`;     // emotion 선택 스냅샷 {value, at}
const K_P3_LASTSRC = `${NS}.p3:lastSource`;  // question이 참고한 p2 상태
const K_Q_DATA     = `${NS}.q:data`;         // 현재 입력 저장
const K_SELECTED   = `${NS}.selectedEmotion`;// sessionStorage emotion 백업

// 감정 화이트리스트(허용 값만 표시)
const EMO_ALLOW = new Set([
  "기뻐요","설레요","감사해요","평온해요",
  "지쳤어요","우울해요","무기력해요","외로워요",
  "짜증나요","화나요","질투나요","부끄러워요",
  "불안해요","긴장돼요","두려워요","부담돼요"
]);

/* =========================
   엘리먼트
   ========================= */
const q1 = document.getElementById('q1');
const q2 = document.getElementById('q2');
const q3 = document.getElementById('q3');
const pill = document.getElementById('pickedEmotion');

/* =========================
   QR 재인식(#reset) 초기화
   ========================= */
(function resetIfHash(){
  try{
    if(location.hash.replace('#','') === 'reset'){
      sessionStorage.clear();
      localStorage.removeItem(K_Q_DATA);
    }
  }catch(e){}
})();

/* =========================
   p2 스냅샷 비교 → 변경 시 초기화
   ========================= */
(function snapshotCheck(){
  try{
    const p2   = localStorage.getItem(K_P2_CURRENT) || '';
    const last = localStorage.getItem(K_P3_LASTSRC) || '';
    if (p2 !== last) {
      localStorage.removeItem(K_Q_DATA); // 감정이 바뀜 → 입력 리셋
    }
    localStorage.setItem(K_P3_LASTSRC, p2);
  }catch(e){}
})();

/* =========================
   emotion 표시(화이트리스트 적용)
   ========================= */
(function showPickedEmotion(){
  let emo = '';
  try{
    // 1) URL 파라미터
    const sp = new URLSearchParams(location.search);
    emo = (sp.get('emotion') || '').trim();

    // 2) sessionStorage
    if (!emo) emo = sessionStorage.getItem(K_SELECTED) || '';

    // 3) localStorage
    if (!emo) {
      const raw = localStorage.getItem(K_P2_CURRENT);
      if (raw) { const obj = JSON.parse(raw); emo = (obj && obj.value) || ''; }
    }
  }catch(e){}

  if (!EMO_ALLOW.has(emo)) emo = '';

  if (emo) {
    pill.textContent = emo;
    pill.classList.add('on');
  } else {
    pill.textContent = '선택 안됨';
    pill.classList.remove('on');
  }
})();

/* =========================
   입력 저장/복원
   ========================= */
function save(){
  const data = { q1:q1.value, q2:q2.value, q3:q3.value, at:Date.now() };
  try{ localStorage.setItem(K_Q_DATA, JSON.stringify(data)); }catch(e){}
}
function restore(){
  try{
    const raw = localStorage.getItem(K_Q_DATA);
    if(!raw) return;
    const d = JSON.parse(raw);
    q1.value = d.q1 || '';
    q2.value = d.q2 || '';
    q3.value = d.q3 || '';
  }catch(e){}
}
[q1,q2,q3].forEach(el => el?.addEventListener('input', save));
restore();

// BFCache 복귀 시에도 복원
window.addEventListener('pageshow', (ev)=>{ if (ev.persisted) restore(); });

/* =========================
   CTA 이동
   ========================= */
document.getElementById('goGoal')?.addEventListener('click', ()=>{
  // 파일명이 goal2.html이라면 아래를 'goal2.html'로 변경하세요.
  location.href = `goal.html?v=${Date.now()}`;
});

/* =========================
   뒤로가기
   ========================= */
(function(){
  const btn = document.getElementById('backBtn');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    if (document.referrer) { history.back(); return; }
    // 파일명이 emotion2.html이라면 아래를 'emotion2.html'로 변경하세요.
    location.href = 'emotion.html?v=' + Date.now();
  });
})();

/* =========================
   (선택) 안전한 스토리지 접근 유틸
   ========================= */
function safeSetSession(k,v){ try{ sessionStorage.setItem(k,v); }catch(e){} }
function safeGetSession(k){ try{ return sessionStorage.getItem(k); }catch(e){ return null; } }
function safeSetLocal(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
function safeGetLocal(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
