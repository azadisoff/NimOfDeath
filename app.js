'use strict';

/* ==================== 1. CẤU HÌNH ==================== */
const INIT_PILES   = [7, 5, 3];   // bàn cờ mặc định
const LAST_TIMEOUT = 10;          // đếm ngược khi còn 1 quân
const AI_DELAY0    = 600;         // ms, tốc độ nghĩ ban đầu
const AI_DELAY_INC = 500;         // ms, cộng thêm mỗi lượt AI

/* ==================== 2. TRẠNG THÁI ==================== */
let piles=[];          // [hàng1, hàng2, hàng3]
let turn = 0;          // 0 = người, 1 = AI
let gameOver=false;

let aiTurns = 0;       // đếm lượt AI (1,2,3…)
let aiDelay = AI_DELAY0;
let aiOpened = false;  // true nếu AI là người đi đầu

let tId=null, tLeft=LAST_TIMEOUT; // đếm ngược 10s

/* =========== 3. DOM (rút gọn, giữ dropdown ban đầu) =========== */
const $=id=>document.getElementById(id);
const boardEl=$('board');
const statusEl=$('status');
const rowSel = $('rowSelect');     // nếu bạn đã bỏ dropdown, có thể bỏ dòng này
const takeInput = $('takeInput');
const formEl=$('moveForm');
const giveUpBtn=$('giveUpBtn');
const restartBtn=$('restartBtn');
const timerEl=$('timer');
const starter=()=>document.querySelector('input[name="starter"]:checked')?.value;

/* ==================== 4. HÀM TIỆN ÍCH ==================== */
const xorAll=a=>a.reduce((x,y)=>x^y,0);
const sumPile=()=>piles.reduce((s,p)=>s+p,0);

/* ==================== 5. HIỂN THỊ ==================== */
function renderBoard(){
  boardEl.innerHTML='';
  piles.forEach((cnt)=>{
    const row=document.createElement('div');
    row.className='row';
    for(let i=0;i<cnt;i++){
      const tk=document.createElement('div');
      tk.className='token';
      row.appendChild(tk);
    }
    boardEl.appendChild(row);
  });
}
function render(){
  renderBoard();
  if(!gameOver) statusEl.textContent=`Lượt ${turn%2===0?'Bạn':'🤖 AI'}`;

  /* nếu bạn không dùng form dropdown, có thể ẩn formEl luôn */
  if(formEl){ formEl.hidden = gameOver || turn%2===1; }
  giveUpBtn.hidden  = gameOver || turn%2===1;
  restartBtn.hidden = !gameOver;

  if(sumPile()===1 && !gameOver){
    timerEl.hidden=false;
    timerEl.textContent=`⏳ ${tLeft}s`;
  }else timerEl.hidden=true;
}

/* ==================== 6. ĐẾM NGƯỢC 10s ==================== */
function startCountdown(){
  clearCountdown();
  tLeft=LAST_TIMEOUT;
  timerEl.hidden=false;
  timerEl.textContent=`⏳ ${tLeft}s`;
  tId=setInterval(()=>{
    if(--tLeft<=0){
      clearCountdown();
      endGame(turn%2===0?'ai':'player');
    }
    timerEl.textContent=`⏳ ${tLeft}s`;
  },1000);
}
function clearCountdown(){ if(tId){clearInterval(tId);tId=null;} timerEl.hidden=true; }

/*------------------ 7. AI MOVE ------------------*/
function aiMove(){
  aiTurns++;

  /* --- Quy tắc v0.1.4.1: AI mở màn → random 1 hàng, lấy đúng 1 quân --- */
  if(aiOpened && turn===1){
    let idx = Math.floor(Math.random()*3);
    while(piles[idx]===0) idx = (idx+1)%3;   // đảm bảo hàng còn quân
    piles[idx]--;                            // loại đúng 1 quân
    return;
  }

  /* ---------- Chiến lược Misère Nim chuẩn cho các lượt khác ---------- */
  const nim = xorAll(piles);
  const ones = piles.filter(p=>p===1).length;
  const big  = piles.filter(p=>p>1).length;

  let idx=-1,target;
  if(big===0){                               // cuối ván
    idx=piles.findIndex(p=>p===1);target=0;
  }else if(nim===0){                         // thế thua → giảm 1 quân ngẫu nhiên
    const opts=piles.map((p,i)=>p>0?i:null).filter(i=>i!==null);
    idx=opts[Math.floor(Math.random()*opts.length)];
    target=Math.max(0,piles[idx]-1);
  }else if(big===1){                         // chỉ 1 hàng >1
    idx=piles.findIndex(p=>p>1);target=(ones%2===0)?1:0;
  }else{                                     // nim ≠ 0, nhiều hàng >1
    idx=piles.findIndex(p=>(p^nim)<p);target=piles[idx]^nim;
  }
  piles[idx]=target;
}

/*------------------ 8. END & TURN ------------------*/
function endGame(winner){
  gameOver=true;clearCountdown();
  statusEl.textContent = winner==='player' ? '🎉 Bạn THẮNG!' : '💀 Bạn THUA!';
  render();
}
function nextTurn(){
  render();
  if(sumPile()===0){
    endGame(turn%2===0?'player':'ai');
    return;
  }
  if(sumPile()===1) startCountdown(); else clearCountdown();

  if(!gameOver && turn%2===1){
    setTimeout(()=>{
      aiMove();
      turn++;
      aiDelay+=AI_DELAY_INC;
      nextTurn();
    },aiDelay);
  }
}

/*------------------ 9. EVENTS ------------------*/
formEl.addEventListener('submit',e=>{
  e.preventDefault();
  const row=+rowSel.value,take=+takeInput.value;
  if(take<1||take>piles[row]) return alert('Số quân không hợp lệ!');
  if(sumPile()===1 && take===1){piles[row]--;endGame('ai');return;}
  piles[row]-=take;turn++;nextTurn();
});
giveUpBtn.addEventListener('click',()=>endGame('ai'));
restartBtn.addEventListener('click',startGame);

/*------------------ 10. INIT ------------------*/
function startGame(){
  clearCountdown();
  piles=[...INIT_PILES];
  aiDelay=AI_DELAY0;
  aiTurns=0;
  gameOver=false;

  const starter=document.querySelector('input[name="starter"]:checked')?.value||'player';
  turn = starter==='player' ? 0 : 1;
  aiOpened  = (starter === 'ai');
  render();
  if(turn===1) nextTurn();                   // AI đi trước
}
startGame();
