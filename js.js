const levelNames = [
  "Базовый", "Новичок", "Продвинутый", "Эксперт", "Профи",
  "Мастер", "Элита", "Легенда", "Герой", "Король"
];

let coins = 999;
let level = 1;
let perClick = 3;
let perSec = 0;
let energy = 20;
let energyMax = 20;
let energyRegen = 1;
let regenInterval = 1000;
let regenTimer = null;
let autoTimer = null;
let levelTarget = 100;

let upgrades = {
  click: [
    {name: "+1 клик", price:50, bonus:1},
    {name:"+2 клик", price:120, bonus:2},
    {name:"+5 клик", price:250, bonus:5}
  ],
  autoclick: [
    {name:"+1/сек", price:150, bonus:1},
    {name:"+2/сек", price:300, bonus:2},
    {name:"+5/сек", price:600, bonus:5}
  ],
  energy: [
    {name:"+5 энергия", price:80, bonus:5},
    {name:"+10 энергия", price:200, bonus:10}
  ],
  regen: [
    {name:"+1 восстановление", price:120, bonus:1},
    {name:"+2 восстановление", price:400, bonus:2},
    {name:"+3 восстановление", price:1200, bonus:3}
  ]
};
let bought = {
  click: [false,false,false],
  autoclick: [false,false,false],
  energy: [false,false],
  regen: [false,false,false]
};

function render() {
  document.getElementById('balance').textContent = formatNum(coins);
  document.getElementById('statPerClick').textContent = perClick;
  document.getElementById('statPerSec').textContent = perSec;
  document.getElementById('statGoal').textContent = formatNum(levelTarget - coins > 0 ? levelTarget - coins : 0);
  document.getElementById('energyText').textContent = energy+" / "+energyMax;
  document.getElementById('energyInner').style.width = (100*energy/energyMax)+"%";
  let name = `${level} уровень ${levelNames[level-1] || ""}`;
  document.getElementById('levelName').textContent = name;
  let prevTarget = level === 1 ? 0 : 100 * Math.pow(2, level-2);
  let prc = 100 * (coins - prevTarget) / (levelTarget - prevTarget);
  document.getElementById('progressInner').style.width = (prc<0?0:prc>100?100:prc) + "%";
}
function formatNum(n) {
  if (n>=1e6) return (n/1e6).toFixed(2)+"M";
  if (n>=1e3) return (n/1e3).toFixed(1)+"K";
  return n;
}
function addCoins(amount) {
  coins += amount;
  checkLevel();
  render();
}
function checkLevel() {
  while(coins >= levelTarget && level < 10) {
    level++;
    levelTarget = 100 * Math.pow(2, level-1);
  }
}
function tryClick() {
  if(energy>=perClick) {
    energy -= perClick;
    addCoins(perClick);
  }
  render();
}
function autoIncome() {
  if (perSec > 0) addCoins(perSec);
}
function regenEnergy() {
  if(energy < energyMax) {
    energy = Math.min(energy + energyRegen, energyMax);
    render();
  }
}
function startTimers() {
  if(regenTimer) clearInterval(regenTimer);
  regenTimer = setInterval(regenEnergy, regenInterval);
  if(autoTimer) clearInterval(autoTimer);
  autoTimer = setInterval(autoIncome, 1000);
}
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.onclick = () => openUpgradePanel(btn.dataset.upg);
});
function openUpgradePanel(type) {
  let bg = document.getElementById('upgradePanel');
  bg.innerHTML = '';
  bg.classList.add('active');
  bg.style.display = 'block';
  let panel = document.createElement('div');
  panel.className = 'panel';

  let header = document.createElement('div');
  header.className = 'panel-header';
  header.innerHTML = `<span>Улучшения: ${
    {click:"Клик",autoclick:"Автоклик",energy:"Энергия",regen:"Восстановление"}[type]
  }</span>`;
  let closeBtn = document.createElement('button');
  closeBtn.className = 'panel-close';
  closeBtn.textContent = '✕';
  closeBtn.onclick = closeUpgradePanel;
  header.appendChild(closeBtn);
  panel.appendChild(header);

  let list = document.createElement('div');
  list.className = 'panel-list';

  upgrades[type].forEach((upg, idx) => {
    let card = document.createElement('div');
    card.className = 'panel-item' + (bought[type][idx] ? ' bought' : '');
    let info = document.createElement('div');
    info.className = 'info';
    info.innerHTML = `<strong>${upg.name}</strong><span>Цена: ${upg.price}</span>`;
    card.appendChild(info);
    let btn = document.createElement('button');
    btn.textContent = bought[type][idx] ? 'Куплено' : 'Купить';
    btn.disabled = bought[type][idx];
    btn.onclick = e=>{
      e.stopPropagation();
      if(coins<upg.price) { btn.textContent='Не хватает!'; setTimeout(()=>btn.textContent='Купить',900); return;}
      coins -= upg.price;
      bought[type][idx] = true;
      if(type==='click') perClick += upg.bonus;
      if(type==='autoclick') perSec += upg.bonus;
      if(type==='energy') {
        energyMax += upg.bonus;
        energy = Math.max(energy, energyMax);
      }
      if(type==='regen') {
        energyRegen += upg.bonus;
      }
      render();
      btn.textContent = 'Куплено';
      btn.disabled = true;
      card.classList.add('bought');
    };
    card.appendChild(btn);
    list.appendChild(card);
  });

  panel.appendChild(list);
  bg.appendChild(panel);
}
function closeUpgradePanel() {
  let bg = document.getElementById('upgradePanel');
  bg.classList.remove('active');
  bg.style.display = 'none';
  bg.innerHTML = '';
}
document.getElementById('mainClickBtn').onclick = tryClick;
startTimers();
render();
