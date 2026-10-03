const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const bestEl = document.getElementById('best');
const targetEl = document.getElementById('target');
const missionTitle = document.getElementById('missionTitle');
const streakEl = document.getElementById('streak');
const hintEl = document.getElementById('hint');
const rewardEl = document.getElementById('reward');
const restartBtn = document.getElementById('restart');

const COLORS = ['#ff4d6d','#ff9f1c','#2ec4b6','#4dabf7','#9b5de5','#f15bb5','#7bd389','#ffd166'];
const BOARD_SIZE = 36;
const TARGETS = [2,3,4,5,6,7,8,9];
const POINTS = {2:10,3:30,4:50,5:65,6:75,7:85,8:95,9:100};

let cells = [];
let selected = [];
let targetIndex = 0;
let score = 0;
let coins = 0;
let matchedThisRun = 0;
let busy = false;
let best = Number(localStorage.getItem('gridgame-best') || 0);

function target(){ return TARGETS[targetIndex]; }

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}
  return arr;
}

function makeBoard(){
  boardEl.innerHTML='';
  selected=[];
  // Build a random board, while guaranteeing a valid group for the current target.
  const colors = Array.from({length:BOARD_SIZE},()=>COLORS[Math.floor(Math.random()*COLORS.length)]);
  const guaranteed = COLORS[Math.floor(Math.random()*COLORS.length)];
  shuffle([...Array(BOARD_SIZE).keys()]).slice(0,target()).forEach(i=>colors[i]=guaranteed);
  cells = colors.map((color,i)=>({color,index:i}));
  cells.forEach(c=>{
    const el=document.createElement('button');
    el.className='cell';
    el.style.background=c.color;
    el.style.color=c.color;
    el.setAttribute('aria-label',`Color square ${c.index+1}`);
    el.addEventListener('click',()=>pick(c.index));
    c.el=el;
    boardEl.appendChild(el);
  });
  updateUI();
}

function pick(index){
  if(busy) return;
  const cell=cells[index];
  if(selected.includes(index)){
    selected=selected.filter(i=>i!==index);
    cell.el.classList.remove('selected');
    updateHint();
    return;
  }
  if(selected.length===0){
    selected=[index]; cell.el.classList.add('selected'); updateHint(); return;
  }
  // Every square in a match must have exactly the same color.
  if(cell.color!==cells[selected[0]].color){
    cell.el.classList.add('wrong');
    setTimeout(()=>cell.el.classList.remove('wrong'),300);
    hintEl.textContent='Different color — choose the matching color.';
    return;
  }
  selected.push(index); cell.el.classList.add('selected'); updateHint();
  if(selected.length===target()) completeMatch();
}

function completeMatch(){
  busy=true;
  const gained=POINTS[target()];
  score += gained;
  matchedThisRun += target();
  best=Math.max(best,score);
  localStorage.setItem('gridgame-best',best);
  selected.forEach(i=>cells[i].el.classList.add('correct'));
  hintEl.textContent=`+${gained} points!`;
  setTimeout(()=>{
    // Recolor the board and grow the required match size. There are no levels.
    targetIndex = (targetIndex+1) % TARGETS.length;
    if(target()===2){
      coins += 100;
      showReward();
    }
    makeBoard();
    busy=false;
  },430);
}

function updateUI(){
  scoreEl.textContent=score.toLocaleString();
  coinsEl.textContent=coins.toLocaleString();
  bestEl.textContent=best.toLocaleString();
  targetEl.textContent=target();
  missionTitle.textContent=`Match ${target()} squares`;
  streakEl.textContent=`${matchedThisRun} matched`;
  updateHint();
}

function updateHint(){
  if(selected.length===0){hintEl.textContent=`Find ${target()} squares with the same color.`;return}
  const left=target()-selected.length;
  hintEl.textContent=left===0?'Match complete!':`${selected.length}/${target()} selected — ${left} more to go.`;
}

function showReward(){
  rewardEl.classList.remove('hidden');
  setTimeout(()=>rewardEl.classList.add('hidden'),1800);
}

function reset(){
  score=0; coins=0; targetIndex=0; matchedThisRun=0; busy=false;
  makeBoard();
}

restartBtn.addEventListener('click',reset);
makeBoard();
