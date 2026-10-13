/* Gridly endless match mode: fixed 9x9 candy grid, adjacent swaps, cascades and endless refill. */
(()=> {
  const N=9, TOTAL=N*N;
  const candyColors=['#ff303b','#ffd52a','#19c943','#2377ff','#b82cff','#ff8a19'];
  const candyEmojis={'#ff303b':'🍒','#ffd52a':'🍋','#19c943':'🍏','#2377ff':'💎','#b82cff':'🍇','#ff8a19':'🍊'};
  let cells=[],busy=false,pointer=null,matchCount=0,cubeCount=0;
  const originalBoard=board;
  state.target=3;
  function randomColor(){return candyColors[Math.floor(Math.random()*candyColors.length)];}
  function idx(r,c){return r*N+c;}
  function rc(i){return [Math.floor(i/N),i%N];}
  function valid(r,c){return r>=0&&r<N&&c>=0&&c<N;}
  function adjacentIndex(a,b){const [ar,ac]=rc(a),[br,bc]=rc(b);return Math.abs(ar-br)+Math.abs(ac-bc)===1;}
  function getRuns(){
    const found=new Set();
    for(let r=0;r<N;r++){let c=0;while(c<N){const col=cells[idx(r,c)],start=c;while(c<N&&cells[idx(r,c)]===col)c++;if(col&&c-start>=3)for(let x=start;x<c;x++)found.add(idx(r,x));}}
    for(let c=0;c<N;c++){let r=0;while(r<N){const col=cells[idx(r,c)],start=r;while(r<N&&cells[idx(r,c)]===col)r++;if(col&&r-start>=3)for(let y=start;y<r;y++)found.add(idx(y,c));}}
    return found;
  }
  function getCube(){
    const found=new Set();
    for(let r=0;r<=N-3;r++)for(let c=0;c<=N-3;c++){
      const col=cells[idx(r,c)];if(!col)continue;let same=true;
      for(let y=0;y<3;y++)for(let x=0;x<3;x++)if(cells[idx(r+y,c+x)]!==col)same=false;
      if(same)for(let y=0;y<3;y++)for(let x=0;x<3;x++)found.add(idx(r+y,c+x));
    }
    return found;
  }
  function makeSafeBoard(){
    cells=Array(TOTAL).fill(null);
    for(let r=0;r<N;r++)for(let c=0;c<N;c++){
      let col,tries=0;
      do{col=randomColor();tries++;}while(tries<30&&((c>=2&&cells[idx(r,c-1)]===col&&cells[idx(r,c-2)]===col)||(r>=2&&cells[idx(r-1,c)]===col&&cells[idx(r-2,c)]===col)));
      cells[idx(r,c)]=col;
    }
  }
  function renderBoard(){
    board.innerHTML='';board.className='board match3-board theme-'+state.theme;
    board.style.gridTemplateColumns='repeat(9,minmax(0,1fr))';board.style.gridTemplateRows='repeat(9,minmax(0,1fr))';board.style.aspectRatio='1 / 1';board.style.height='auto';
    cells.forEach((col,i)=>{
      const tile=document.createElement('button');tile.type='button';tile.className='candy-tile'+(col?'':' empty');tile.dataset.cell=i;
      tile.setAttribute('aria-label',col?('Candy '+(candyEmojis[col]||'gem')):'Empty');
      if(col){tile.style.setProperty('--candy',col);tile.innerHTML='<span class="candy-shine"></span><span class="candy-face">'+(state.theme==='classic'?'':state.theme==='balls'?'⚽':candyEmojis[col])+'</span>';}
      board.appendChild(tile);
    });
  }
  function paintStats(){
    update();
    targetEl.textContent='3';missionKicker.textContent='MATCH 3 OR MORE';$('boardHint').textContent='SWAP NEIGHBOURING CANDIES';$('rainbowNote').textContent='💎 3×3 cube = +100 coins';
    groupsEl.textContent=matchCount;streakEl.textContent=state.combo;groupScoreEl.textContent='+'+(state.combo>=3?50:10);
    if($('miniMissionBar'))$('miniMissionBar').style.width=(state.missionDone?100:Math.min(state.daily,3)/3*100)+'%';
  }
  function removeAndRefill(remove){
    if(!remove.size)return;
    const hadCube=getCube().size>=9;
    if(hadCube){cubeCount++;state.coins+=100;state.combo=Math.max(state.combo+1,3);toastMsg('🌈 AMAZING 3×3 CUBE! +100 coins');playTone('cube');voicePraise('cube');reward.classList.remove('hidden');setTimeout(()=>reward.classList.add('hidden'),1250);}
    else{playTone(remove.size>=5?'big':'merge');if(remove.size>=4){state.coins+=2;toastMsg('✨ Great match! +2 coins');}else toastMsg('Nice match!');voicePraise(state.combo>=5?'excellent':'nice');}
    matchCount++;state.groups=matchCount;state.daily=Math.min(20,state.daily+1);state.combo++;
    state.score+=remove.size*10+(hadCube?100:0)+(remove.size>=4?20:0);state.best=Math.max(state.best,state.score);
    if(state.daily>=3&&!state.missionDone){state.missionDone=true;state.coins+=10;toastMsg('⭐ Little mission complete! +10 coins');}
    if(state.daily>=20&&!state.dailyRewarded){state.dailyRewarded=true;state.coins+=50;toastMsg('🏆 Daily goal complete! +50 coins');}
    remove.forEach(i=>cells[i]=null);
    for(let c=0;c<N;c++){
      const keep=[];for(let r=N-1;r>=0;r--){const v=cells[idx(r,c)];if(v)keep.push(v);}
      for(let r=N-1,k=0;r>=0;r--,k++)cells[idx(r,c)]=k<keep.length?keep[k]:randomColor();
    }
    save();renderBoard();paintStats();
    setTimeout(()=>resolveCascades(0),100);
  }
  function resolveCascades(depth){
    if(depth>12||busy)return;
    const cube=getCube(),runs=getRuns();cube.forEach(i=>runs.add(i));
    if(runs.size){removeAndRefill(runs);return;}
    if(!getRuns().size){tip.textContent='🌟 Keep swapping! Match 3, or build a 3×3 colour cube for a big bonus.';}
  }
  function trySwap(a,b){
    if(busy||!adjacentIndex(a,b))return;
    const tmp=cells[a];cells[a]=cells[b];cells[b]=tmp;renderBoard();
    const cube=getCube(),runs=getRuns();cube.forEach(i=>runs.add(i));
    if(!runs.size){cells[b]=cells[a];cells[a]=tmp;renderBoard();playTone('bad');tip.textContent='👀 Try a swap that makes 3 matching candies.';return;}
    busy=true;state.combo++;animateBoard('down');playTone('swipe');
    setTimeout(()=>{busy=false;removeAndRefill(runs);},90);
  }
  function cellFromPoint(x,y){
    const el=document.elementFromPoint(x,y)?.closest('.candy-tile');
    if(el&&board.contains(el))return +el.dataset.cell;
    return null;
  }
  function onDown(e){
    if(!e.target.closest('.candy-tile'))return;
    e.preventDefault();e.stopImmediatePropagation();
    pointer={id:e.pointerId,from:+e.target.closest('.candy-tile').dataset.cell,x:e.clientX,y:e.clientY};
    try{board.setPointerCapture(e.pointerId);}catch(_){}
  }
  function onUp(e){
    if(!pointer)return;
    e.preventDefault();e.stopImmediatePropagation();
    const start=pointer;pointer=null;
    if(Math.hypot(e.clientX-start.x,e.clientY-start.y)<12)return;
    let to=cellFromPoint(e.clientX,e.clientY);
    if(to===null){const dx=e.clientX-start.x,dy=e.clientY-start.y;const [r,c]=rc(start.from);if(Math.abs(dx)>Math.abs(dy))to=idx(r,c+(dx<0?-1:1));else to=idx(r+(dy<0?-1:1),c);}
    if(to>=0&&to<TOTAL&&to!==start.from)trySwap(start.from,to);
  }
  function onCancel(e){if(pointer){e.preventDefault();e.stopImmediatePropagation();pointer=null;}}
  board.addEventListener('pointerdown',onDown,true);board.addEventListener('pointerup',onUp,true);board.addEventListener('pointercancel',onCancel,true);board.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();},true);
  board.addEventListener('touchstart',e=>{e.stopImmediatePropagation();},{capture:true,passive:false});
  board.addEventListener('touchend',e=>{e.stopImmediatePropagation();},{capture:true,passive:false});
  const oldRestart=$('restart').onclick;
  $('restart').onclick=()=>{state.score=0;state.combo=0;state.groups=0;state.target=3;state.selected=null;matchCount=0;cubeCount=0;makeSafeBoard();renderBoard();save();paintStats();tip.textContent='🍬 Swap neighbouring candies. Match 3 or more. Make a 3×3 cube for +100 coins!';voicePraise('nice');};
  const oldTheme=$('themeBtn').onclick;
  $('themeBtn').onclick=()=>{state.theme=state.theme==='fruit'?'balls':state.theme==='balls'?'classic':'fruit';save();renderBoard();paintStats();toastMsg(state.theme==='fruit'?'🍓 Fruit candies!':state.theme==='balls'?'⚽ Ball theme!':'💎 Jewel mode!');playTone('coin');};
  makeSafeBoard();renderBoard();paintStats();
  tip.textContent='🍬 Swap neighbouring candies. Match 3 or more. Make a 3×3 cube for +100 coins!';
})();
