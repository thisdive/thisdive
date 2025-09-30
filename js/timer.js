/* =========================
   네임스페이스 & 키 (page4)
   ========================= */
const NS = 'thisdive';
const K_G_DATA   = `${NS}.g:data`;
const K_P4_LAST  = `${NS}.p4:lastSource`;
const K_T_DATA   = `${NS}.t:data`;
const K_T_MUSTRESET = `${NS}.t:mustReset`;
const K_REWARD   = `${NS}.reward`; // ← 보상 저장 키

(function resetIfHash(){
  if (location.hash.replace('#','') === 'reset') {
    try{
      sessionStorage.clear();
      localStorage.removeItem(K_G_DATA);
      localStorage.removeItem(K_P4_LAST);
      localStorage.removeItem(K_T_DATA);
      sessionStorage.removeItem(K_T_MUSTRESET);
      sessionStorage.removeItem(K_REWARD);
    }catch(e){}
  }
})();

let timerInterval = null;
let totalSeconds = 0;
let remainingSeconds = 0;

const timeEl = document.getElementById('time');
const progressEl = document.querySelector('.progress');
const completeBtn = document.getElementById('completeBtn');

/* 초기 로드 시 버튼 잠금(일부 iOS에서 disabled가 풀리는 경우 대비) */
document.addEventListener('DOMContentLoaded', () => {
  if (completeBtn) completeBtn.disabled = true;
});

/* --------------------------------------------------- */
function cameFromOtherPage(){
  try{
    if (!document.referrer) return false;
    const ref = new URL(document.referrer);
    const here = new URL(location.href);
    return (ref.origin === here.origin) && (ref.pathname !== here.pathname);
  }catch(e){
    return !!document.referrer;
  }
}

(function checkSourceAndInit(){
  // 목표문구 표시
  const sp = new URLSearchParams(location.search);
  let goal = (sp.get('goal') || '').trim();
  if(!goal){ try{ goal = sessionStorage.getItem(`${NS}.goal`) || ''; }catch(e){} }
  if(goal){
    document.getElementById('goalText').textContent = goal;
    document.getElementById('goalBanner').hidden = false;
  }

  // 🔸 보상 파라미터가 들어왔으면 sessionStorage에도 캐싱(선택)
  const rewardFromQS = (sp.get('reward') || '').trim();
  if (rewardFromQS) {
    try{ sessionStorage.setItem(K_REWARD, rewardFromQS); }catch(e){}
  }

  // 초기화 필요성 판단
  let mustReset = false;
  try{
    if (sessionStorage.getItem(K_T_MUSTRESET) === '1') mustReset = true;
  }catch(e){}

  if (cameFromOtherPage()) mustReset = true;
  try{ sessionStorage.removeItem(K_T_MUSTRESET); }catch(e){}

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

  bindComplete(); // ✅ 완료 버튼 가드 바인딩
})();

function startTimer(minutes) {
  clearInterval(timerInterval);
  totalSeconds = minutes * 60;
  remainingSeconds = totalSeconds;
  updateTimeDisplay();
  updateProgressCircle();
  completeBtn.disabled = true; // 시작하면 항상 잠금

  snapshotSave({ minutes, startedAt: Date.now(), finished:false });

  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateTimeDisplay();
    updateProgressCircle();
    if (remainingSeconds % 5 === 0) snapshotSave({ tick: Date.now() });
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      remainingSeconds = 0;
      completeBtn.disabled = false; // 끝나면 해제
      snapshotSave({ finished:true, finishedAt: Date.now() });
    }
  }, 1000);
}

function updateTimeDisplay() {
  const min = String(Math.floor((remainingSeconds||0) / 60)).padStart(2, '0');
  const sec = String((remainingSeconds||0) % 60).padStart(2, '0');
  timeEl.textContent = `${min}:${sec}`;
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
  timeEl.textContent = '00:00';
  updateTimeDisplay();
  updateProgressCircle();
  completeBtn.disabled = true;
  completeBtn.classList.remove('done');
  completeBtn.textContent = '🌸 보상 받기';
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

function restoreTimer(){
  const s = snapshotGet();
  if (s && s.minutes){
    const btn = [...document.querySelectorAll('.timer-controls button')]
      .find(b => parseInt(b.textContent,10) === Number(s.minutes));
    if (btn) btn.classList.add('active');
  }
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
          completeBtn.disabled = false; // 종료 시 해제
          snapshotSave({ finished:true, finishedAt: Date.now() });
        }
      }, 1000);
    }else{
      remainingSeconds = 0;
      completeBtn.disabled = false; // 이미 끝난 상태
    }
    updateTimeDisplay();
    updateProgressCircle();
    return;
  }
  if (s && s.finished){
    totalSeconds = Number(s.minutes || 0) * 60;
    remainingSeconds = 0;
    updateTimeDisplay();
    updateProgressCircle();
    completeBtn.disabled = false; // 완료 복원 시 해제
  } else {
    // 진행중/미시작 모두 잠금 유지
    completeBtn.disabled = true;
  }
}

// 시간 버튼 클릭 → 시작
const timeButtonsWrap = document.getElementById('timeButtons');
timeButtonsWrap.addEventListener('click', (e)=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  document.querySelectorAll('.timer-controls button').forEach(b=> b.classList.remove('active'));
  btn.classList.add('active');
  const n = parseInt(btn.textContent, 10);
  if(Number.isFinite(n) && n > 0){
    completeBtn.disabled = true; // 새로 시작했으니 잠금
    startTimer(n);
    snapshotSave({ minutes:n });
  }
});

// ▶ 보상 텍스트 가져오기
function getRewardText(){
  try{
    const sp = new URLSearchParams(location.search);
    let reward = (sp.get('reward') || '').trim();
    if (!reward){
      reward = (sessionStorage.getItem(K_REWARD) || '').trim();
    } else {
      sessionStorage.setItem(K_REWARD, reward);
    }
    return reward;
  }catch(e){
    try{ return (sessionStorage.getItem(K_REWARD) || '').trim(); }catch(_){ return ''; }
  }
}

/* 토스트 표시 유틸 */
function showToast(){
  const toast = document.getElementById('toast');
  if(!toast) return;
  const reward = getRewardText();
  const message = reward
    ? `☕ 약속한 보상: ${reward}, 지금요.`
    : `스스로에게 작은 칭찬 한 줄 😊`;
  toast.textContent = message;
  toast.hidden = false;
  requestAnimationFrame(()=> toast.classList.add('show'));
  setTimeout(()=>{
    toast.classList.remove('show');
    setTimeout(()=> toast.hidden = true, 200);
  }, 3000);
}

/* ✅ 보상 버튼 클릭 가드: 종료 전/미시작 때는 무시 */
function bindComplete(){
  if(!completeBtn) return;

  const onClick = (e)=>{
    // 종료 전/미시작 시엔 무시 (iOS에서 disabled 무시되는 케이스 대비)
    if (completeBtn.disabled || remainingSeconds > 0 || totalSeconds === 0) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    completeBtn.classList.add('done');
    completeBtn.textContent = '💫몰입 성공💫';
    showToast();
  };

  // 터치/마우스 모두 대응
  ['click','touchend','pointerup'].forEach(evt =>
    completeBtn.addEventListener(evt, onClick, { passive:false })
  );
}

(function initGoalBanner(){
  const sp = new URLSearchParams(location.search);
  let goal = (sp.get('goal') || '').trim();
  if(!goal){ try{ goal = sessionStorage.getItem(`${NS}.goal`) || ''; }catch(e){} }
  if(goal){
    document.getElementById('goalText').textContent = goal;
    document.getElementById('goalBanner').hidden = false;
  }
  updateTimeDisplay();
  updateProgressCircle();
})();

// 히스토리 복귀(BFCache) 시에도 초기화
window.addEventListener('pageshow', (e)=>{
  const nav = (performance.getEntriesByType && performance.getEntriesByType('navigation') || [])[0];
  const isBF = e.persisted || (nav && nav.type === 'back_forward');
  if (isBF) {
    try{ localStorage.removeItem(K_T_DATA); }catch(e){}
    resetVisual();
  }
});
