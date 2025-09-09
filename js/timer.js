/* =========================
   네임스페이스 & 키 (page4)
   ========================= */
const NS = 'thisdive';
const K_G_DATA        = `${NS}.g:data`;
const K_P4_LAST       = `${NS}.p4:lastSource`;
const K_T_DATA        = `${NS}.t:data`;
const K_T_MUSTRESET   = `${NS}.t:mustReset`;

/* =========================
   해시로 강제 리셋
   ========================= */
(function resetIfHash(){
  try{
    if (location.hash.replace('#','') === 'reset') {
      sessionStorage.clear();
      localStorage.removeItem(K_G_DATA);
      localStorage.removeItem(K_P4_LAST);
      localStorage.removeItem(K_T_DATA);
      sessionStorage.removeItem(K_T_MUSTRESET);
    }
  }catch(e){}
})();

/* =========================
   엘리먼트
   ========================= */
const timeEl        = document.getElementById('time');
const progressEl    = document.querySelector('.progress');
const timeButtons   = document.getElementById('timeButtons');
const completeBtn   = document.getElementById('completeBtn');
const toast         = document.getElementById('toast');
const goalTextEl    = document.getElementById('goalText');
const goalBannerEl  = document.getElementById('goalBanner');
const backBtn       = document.getElementById('backBtn');

/* =========================
   상태
   ========================= */
let timerInterval = null;
let totalSeconds = 0;
let remainingSeconds = 0;

/* =========================
   초기화
   ========================= */
(function init(){
  // 목표 표시: URL( goal= ) → sessionStorage 백업 → textContent로만 사용
  const sp = new URLSearchParams(location.search);
  let goal = (sp.get('goal') || '').trim();
  if (!goal) {
    try{ goal = sessionStorage.getItem(`${NS}.goal`) || ''; }catch(e){}
  }
  if (goal) {
    goalTextEl.textContent = goal;
    goalBannerEl.hidden = false;
  }

  // 이전 소스 스냅샷 비교: goal 페이지 입력 변경 시 타이머 상태 초기화
  let mustReset = false;
  try{
    if (sessionStorage.getItem(K_T_MUSTRESET) === '1') {
      mustReset = true;
      sessionStorage.removeItem(K_T_MUSTRESET);
    }
  }catch(e){}

  let gRaw=null, p4Raw=null;
  try{
    gRaw  = localStorage.getItem(K_G_DATA);
    p4Raw = localStorage.getItem(K_P4_LAST);
  }catch(e){}

  if (mustReset || gRaw !== p4Raw) {
    try{ localStorage.removeItem(K_T_DATA); }catch(e){}
    try{ localStorage.setItem(K_P4_LAST, gRaw ?? ''); }catch(e){}
    resetVisual();
  } else {
    restoreTimer();
  }

  updateTimeDisplay();
  updateProgressCircle();
})();

/* =========================
   유틸
   ========================= */
function updateTimeDisplay() {
  const m = String(Math.floor((remainingSeconds||0) / 60)).padStart(2, '0');
  const s = String((remainingSeconds||0) % 60).padStart(2, '0');
  timeEl.textContent = `${m}:${s}`;
}
function updateProgressCircle() {
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const ratio = totalSeconds ? (1 - (remainingSeconds / totalSeconds)) : 0;
  progressEl.style.strokeDasharray = `${circumference}`;
  progressEl.style.strokeDashoffset = `${circumference * ratio}`;
}
function resetVisual(){
  clearInterval(timerInterval);
  timerInterval = null;
  totalSeconds = 0;
  remainingSeconds = 0;
  updateTimeDisplay();
  updateProgressCircle();
  completeBtn.disabled = true;
  completeBtn.classList.remove('done');
  completeBtn.textContent = '✔️ 몰입 완료';
  document.querySelectorAll('.timer-controls button').forEach(b=> b.classList.remove('active'));
}

function snapshotGet(){
  try{
    const raw = localStorage.getItem(K_T_DATA);
    return raw ? JSON.parse(raw) : {};
  }catch(e){ return {}; }
}
function snapshotSave(part){
  try{
    const cur = snapshotGet();
    const next = { ...cur, ...part };
    localStorage.setItem(K_T_DATA, JSON.stringify(next));
  }catch(e){}
}

/* =========================
   타이머 로직
   ========================= */
function startTimer(minutes) {
  clearInterval(timerInterval);
  totalSeconds = minutes * 60;
  remainingSeconds = totalSeconds;
  updateTimeDisplay();
  updateProgressCircle();
  completeBtn.disabled = true;

  snapshotSave({ minutes, startedAt: Date.now(), finished:false });

  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateTimeDisplay();
    updateProgressCircle();
    if (remainingSeconds % 5 === 0) snapshotSave({ tick: Date.now() });
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      remainingSeconds = 0;
      completeBtn.disabled = false;
      snapshotSave({ finished:true, finishedAt: Date.now() });
    }
  }, 1000);
}

function restoreTimer(){
  const s = snapshotGet();

  // 선택 버튼 복원
  if (s && s.minutes){
    const btn = [...document.querySelectorAll('.timer-controls button')]
      .find(b => parseInt(b.textContent,10) === Number(s.minutes));
    if (btn) btn.classList.add('active');
  }

  // 진행 중 복원
  if (s && s.minutes && s.startedAt && !s.finished){
    const elapsed = Math.max(0, Math.floor((Date.now() - s.startedAt)/1000));
    totalSeconds = Number(s.minutes) * 60;
    remainingSeconds = Math.max(0, totalSeconds - elapsed);
    if (remainingSeconds > 0){
      clearInterval(timerInterval);
      timerInterval = setInterval(()=>{
        remainingSeconds--;
        updateTimeDisplay();
        updateProgressCircle();
        if (remainingSeconds <= 0){
          clearInterval(timerInterval);
          completeBtn.disabled = false;
          snapshotSave({ finished:true, finishedAt: Date.now() });
        }
      }, 1000);
    }else{
      remainingSeconds = 0;
      completeBtn.disabled = false;
    }
    updateTimeDisplay();
    updateProgressCircle();
    return;
  }

  // 완료 상태 복원
  if (s && s.finished){
    totalSeconds = Number(s.minutes || 0) * 60;
    remainingSeconds = 0;
    updateTimeDisplay();
    updateProgressCircle();
    completeBtn.disabled = false;
  }
}

/* =========================
   이벤트: 시간 버튼
   ========================= */
timeButtons.addEventListener('click', (e)=>{
  const btn = e.target.closest('button');
  if(!btn) return;

  // 버튼 라벨 → 숫자만 추출/검증
  const n = parseInt(btn.textContent.replace(/[^\d]/g, ''), 10);
  const ALLOWED = new Set([1, 15, 30, 45, 60]);
  if(!Number.isFinite(n) || !ALLOWED.has(n)) return;

  document.querySelectorAll('.timer-controls button').forEach(b=> b.classList.remove('active'));
  btn.classList.add('active');

  startTimer(n);
  snapshotSave({ minutes:n });
});

/* =========================
   이벤트: 완료 버튼(1회성)
   ========================= */
completeBtn.addEventListener('click', (e)=>{
  e.preventDefault();
  completeBtn.classList.add('done');
  completeBtn.textContent = '💫몰입 성공💫';

  if(toast){
    toast.hidden = false;
    requestAnimationFrame(()=> toast.classList.add('show'));
    setTimeout(()=>{
      toast.classList.remove('show');
      setTimeout(()=> toast.hidden = true, 200);
    }, 3000);
  }
}, { once:true });

/* =========================
   뒤로가기 → goal로
   ========================= */
backBtn.addEventListener('click', ()=>{
  try{ sessionStorage.setItem(K_T_MUSTRESET, '1'); }catch(e){}
  if (document.referrer) { history.back(); return; }
  // 파일명이 goal2.html이라면 아래 파일명만 교체
  location.href = 'goal.html?v=' + Date.now();
});

/* =========================
   BFCache 복귀 시 초기화
   ========================= */
window.addEventListener('pageshow', (e)=>{
  const nav = (performance.getEntriesByType && performance.getEntriesByType('navigation') || [])[0];
  const isBF = e.persisted || (nav && nav.type === 'back_forward');
  if (isBF) {
    try{ localStorage.removeItem(K_T_DATA); }catch(e){}
    resetVisual();
  }
});
