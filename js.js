// ==== ДАННЫЕ ====
const levelNames = [
  "Базовый", "Новичок", "Продвинутый", "Эксперт", "Профи",
  "Мастер", "Элита", "Легенда", "Герой", "Король"
];

function createUpgrades(baseName, basePrice, baseBonus, multPrice, multBonus, isRegen = false) {
  let arr = [];
  for(let i=1;i<=10;i++) {
    arr.push({
      name: (isRegen?"+":"+") + (baseBonus + (i-1)*multBonus) + " " + baseName,
      price: Math.round(basePrice * Math.pow(multPrice,i-1)),
      bonus: baseBonus + (i-1)*multBonus
    });
  }
  return arr;
}

let upgrades = {
  click: createUpgrades("клик", 50, 1, 1.8, 1),
  autoclick: createUpgrades("/сек", 100, 1, 2, 1),
  energy: createUpgrades("энергия", 80, 5, 1.6, 5),
  regen: createUpgrades("восстановление", 120, 1, 2, 1, true)
};
let bought = {
  click: Array(10).fill(false),
  autoclick: Array(10).fill(false),
  energy: Array(10).fill(false),
  regen: Array(10).fill(false)
};

let coins = 0;
let level = 1;
let perClick = 3;
let perSec = 0;
let energy = 20;
let energyMax = 20;
let energyRegen = 1;
let levelTarget = 100;
let regenTimer = null;
let autoTimer = null;

// ==== ПРОМОКОДЫ ====
const PROMOCODES = {
  "QWERTY": { type: "wheel" }
};

// ==== КОЛЕСО ФОРТУНЫ (только emoji!) ====
const wheelPrizes = [
  { text: "+1 к клику", emoji: "🖐️", type: "click", value: 1 },
  { text: "+25 к энергии", emoji: "⚡", type: "energy", value: 25 },
  { text: "+1 к автоклику", emoji: "🤖", type: "autoclick", value: 1 },
  { text: "+100 монет", emoji: "🪙", type: "coins", value: 100 },
  { text: "+50 монет", emoji: "🪙", type: "coins", value: 50 },
  { text: "+2 к восстановлению", emoji: "🔋", type: "regen", value: 2 },
  { text: "+2 к клику", emoji: "🖐️", type: "click", value: 2 },
  { text: "+50 к энергии", emoji: "⚡", type: "energy", value: 50 }
];

// ==== ОТРИСОВКА ====
function render() {
  document.getElementById('balance').textContent = formatNum(coins);
  document.getElementById('energyText').textContent = energy;
  document.getElementById('energyInner').style.width = (100*energy/energyMax)+"%";
  document.getElementById('levelNum').textContent = level;
  document.getElementById('levelShort').textContent = levelNames[level-1] || "";
  document.getElementById('statPerClick').textContent = perClick;
  document.getElementById('statPerSec').textContent = perSec;
  document.getElementById('statGoal').textContent = formatNum(levelTarget - coins > 0 ? levelTarget - coins : 0);

  // Круговой прогресс уровня
  let prevTarget = level === 1 ? 0 : 100 * Math.pow(2, level-2);
  let prc = Math.max(0, Math.min(1, (coins-prevTarget)/(levelTarget-prevTarget)));
  let circ = 2 * Math.PI * 83;
  let prog = document.getElementById('circleProgress');
  prog.style.strokeDasharray = (circ*prc) + " " + circ;
}

// ==== КЛИК ====
function tryClick() {
  if (energy <= 0) return;
  coins += perClick;
  energy = Math.max(energy - perClick, 0);
  checkLevelUp();
  render();
}
document.getElementById('mainClickBtn').onclick = tryClick;

// ==== УРОВЕНЬ ====
function checkLevelUp() {
  while (coins >= levelTarget) {
    level++;
    levelTarget = 100 * Math.pow(2, level-1);
  }
}

// ==== ТАЙМЕРЫ ====
function startTimers() {
  if (regenTimer) clearInterval(regenTimer);
  regenTimer = setInterval(() => {
    if (energy < energyMax) {
      energy = Math.min(energy + energyRegen, energyMax);
      render();
    }
  }, 1000);
  if (autoTimer) clearInterval(autoTimer);
  autoTimer = setInterval(() => {
    if (perSec > 0 && energy >= perSec) {
      coins += perSec;
      energy -= perSec;
      checkLevelUp();
      render();
    }
  }, 1000);
}
startTimers();

// ==== ФОРМАТИРОВАНИЕ ====
function formatNum(num) {
  if (num >= 1e9) return (num/1e9).toFixed(1)+'B';
  if (num >= 1e6) return (num/1e6).toFixed(1)+'M';
  if (num >= 1e3) return (num/1e3).toFixed(1)+'K';
  return Math.floor(num);
}

// ==== УЛУЧШЕНИЯ ====
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.onclick = () => {
    const type = btn.dataset.upg;
    if (type === 'energy-group') openEnergyGroupPanel();
    else if (type === 'other') openOtherPanel();
    else openUpgradePanel(type);
  };
});

// Панель для "Клик" и "Автоклик"
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
    {click:"Клик",autoclick:"Автоклик"}[type]
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
    info.innerHTML = `<strong>${upg.name}</strong><span>Цена: ${formatNum(upg.price)}</span>`;
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

// ==== Панель для "Энергия" + "Восстановление" ====
function openEnergyGroupPanel() {
  let bg = document.getElementById('upgradePanel');
  bg.innerHTML = '';
  bg.classList.add('active');
  bg.style.display = 'block';

  let panel = document.createElement('div');
  panel.className = 'panel';

  // Вкладки
  let tabWrap = document.createElement('div');
  tabWrap.className = 'energy-tabs';
  let tab1 = document.createElement('button');
  tab1.textContent = "Энергия";
  tab1.className = 'energy-tab active';
  let tab2 = document.createElement('button');
  tab2.textContent = "Восстановление";
  tab2.className = 'energy-tab';

  tabWrap.appendChild(tab1);
  tabWrap.appendChild(tab2);
  panel.appendChild(tabWrap);

  // Список улучшений
  let list = document.createElement('div');
  list.className = 'panel-list';

  function renderEnergyOrRegen(which) {
    list.innerHTML = '';
    let type = which === 'energy' ? 'energy' : 'regen';
    upgrades[type].forEach((upg, idx) => {
      let card = document.createElement('div');
      card.className = 'panel-item' + (bought[type][idx] ? ' bought' : '');
      let info = document.createElement('div');
      info.className = 'info';
      info.innerHTML = `<strong>${upg.name}</strong><span>Цена: ${formatNum(upg.price)}</span>`;
      card.appendChild(info);
      let btn = document.createElement('button');
      btn.textContent = bought[type][idx] ? 'Куплено' : 'Купить';
      btn.disabled = bought[type][idx];
      btn.onclick = e=>{
        e.stopPropagation();
        if(coins<upg.price) { btn.textContent='Не хватает!'; setTimeout(()=>btn.textContent='Купить',900); return;}
        coins -= upg.price;
        bought[type][idx] = true;
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
  }

  renderEnergyOrRegen('energy');

  tab1.onclick = () => {
    tab1.classList.add('active');
    tab2.classList.remove('active');
    renderEnergyOrRegen('energy');
  };
  tab2.onclick = () => {
    tab1.classList.remove('active');
    tab2.classList.add('active');
    renderEnergyOrRegen('regen');
  };

  // Закрыть
  let header = document.createElement('div');
  header.className = 'panel-header';
  header.innerHTML = '<span>Улучшения</span>';
  let closeBtn = document.createElement('button');
  closeBtn.className = 'panel-close';
  closeBtn.textContent = '✕';
  closeBtn.onclick = closeUpgradePanel;
  header.appendChild(closeBtn);

  panel.appendChild(header);
  panel.appendChild(list);
  bg.appendChild(panel);
}

// ==== ПРОЧЕЕ ====
function openOtherPanel() {
  let bg = document.getElementById('upgradePanel');
  bg.innerHTML = '';
  bg.classList.add('active');
  bg.style.display = 'block';

  let panel = document.createElement('div');
  panel.className = 'panel';

  let header = document.createElement('div');
  header.className = 'panel-header';
  header.innerHTML = '<span>Прочее</span>';
  let closeBtn = document.createElement('button');
  closeBtn.className = 'panel-close';
  closeBtn.textContent = '✕';
  closeBtn.onclick = closeUpgradePanel;
  header.appendChild(closeBtn);
  panel.appendChild(header);

  let list = document.createElement('div');
  list.className = 'panel-list';

  // Задания
  let questBtn = document.createElement('button');
  questBtn.className = 'other-big-btn';
  questBtn.textContent = "Задания";
  questBtn.onclick = () => alert("Задания (реализуй свою логику)");
  list.appendChild(questBtn);

  // Промокод
  let promoBtn = document.createElement('button');
  promoBtn.className = 'other-big-btn';
  promoBtn.textContent = "Промокод";
  promoBtn.onclick = () => openPromoInputPanel();
  list.appendChild(promoBtn);

  // Настройки
  let settingsBtn = document.createElement('button');
  settingsBtn.className = 'other-big-btn';
  settingsBtn.textContent = "Настройки";
  settingsBtn.onclick = () => alert("Настройки (реализуй свою логику)");
  list.appendChild(settingsBtn);

  panel.appendChild(list);
  bg.appendChild(panel);
}

// ==== Ввод промокода ====
function openPromoInputPanel() {
  let bg = document.getElementById('upgradePanel');
  bg.innerHTML = '';
  bg.classList.add('active');
  bg.style.display = 'block';

  let panel = document.createElement('div');
  panel.className = 'panel';

  let header = document.createElement('div');
  header.className = 'panel-header';
  header.innerHTML = '<span>Промокод</span>';
  let closeBtn = document.createElement('button');
  closeBtn.className = 'panel-close';
  closeBtn.textContent = '✕';
  closeBtn.onclick = closeUpgradePanel;
  header.appendChild(closeBtn);
  panel.appendChild(header);

  let list = document.createElement('div');
  list.className = 'panel-list';

  let promoInput = document.createElement('input');
  promoInput.className = 'promo-input';
  promoInput.placeholder = "Введите промокод";
  let promoEnter = document.createElement('button');
  promoEnter.className = 'other-big-btn';
  promoEnter.textContent = "Активировать";
  promoEnter.onclick = () => {
    applyPromo(promoInput.value);
    promoInput.value = "";
  };
  list.appendChild(promoInput);
  list.appendChild(promoEnter);

  panel.appendChild(list);
  bg.appendChild(panel);
}

// ==== Обработка промокода ====
function applyPromo(code) {
  const promo = PROMOCODES[code.toUpperCase()];
  if (!promo) return showPromoModal("Промокод не найден!", "❌");
  if (promo.type === "wheel") {
    showWheelModal();
  }
}

function showPromoModal(text, emoji) {
  let bg = document.getElementById('upgradePanel');
  bg.innerHTML = '';
  bg.classList.add('active');
  bg.style.display = 'block';
  let panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <div style="font-size:2.5em;text-align:center;margin-bottom:0.6em;">${emoji}</div>
    <div style="font-size:1.33em;text-align:center;font-weight:700;margin-bottom:1.3em;">
      ${text}
    </div>
    <button class="other-big-btn" style="margin-bottom:0" onclick="closeUpgradePanel()">Ок</button>
  `;
  bg.appendChild(panel);
}

function showWheelModal() {
  let bg = document.getElementById('upgradePanel');
  bg.innerHTML = '';
  bg.classList.add('active');
  bg.style.display = 'block';

  const size = 340;
  const radius = size / 2 - 26;
  const emojiRadius = size / 2 - 64;
  const sectors = wheelPrizes.length;
  const sectorAngle = 360 / sectors;

  let panel = document.createElement('div');
  panel.className = 'panel wheel-panel';
  panel.innerHTML = `
    <div class="wheel-title">Крути колесо!</div>
    <div class="wheel-wrap" style="width:${size}px;height:${size}px;">
      <svg class="wheel-svg" width="${size}" height="${size}">
        ${wheelPrizes.map((prize, i) => {
          // Начало сектора
          const startAngle = i * sectorAngle;
          // Середина сектора (идеально для emoji)
          const midAngle = (i + 0.5) * sectorAngle;
          // Вектор для дуги
          return `
            <path d="
              M ${size/2} ${size/2}
              L ${size/2 + Math.cos((startAngle)*Math.PI/180)*radius} ${size/2 + Math.sin((startAngle)*Math.PI/180)*radius}
              A ${radius} ${radius} 0 0 1 ${size/2 + Math.cos((startAngle+sectorAngle)*Math.PI/180)*radius} ${size/2 + Math.sin((startAngle+sectorAngle)*Math.PI/180)*radius}
              Z
            "
            fill="${i%2===0 ? '#213928' : '#1e4534'}"
            stroke="#39ffbe88"
            stroke-width="2"/>
          `;
        }).join("")}
        ${wheelPrizes.map((prize, i) => {
          const midAngle = (i + 0.5) * sectorAngle - 90;
          const x = size/2 + Math.cos(midAngle * Math.PI / 180) * emojiRadius;
          const y = size/2 + Math.sin(midAngle * Math.PI / 180) * emojiRadius + 7;
          return `
            <text x="${x}" y="${y}" text-anchor="middle" font-size="36" font-weight="900" fill="#39ffbe"
              dominant-baseline="middle"
              style="pointer-events:none;"
              >${prize.emoji}</text>
          `;
        }).join("")}
        <circle cx="${size/2}" cy="${size/2}" r="${radius-56}" fill="#101817" />
      </svg>
      <div class="wheel-arrow"></div>
    </div>
    <button class="other-big-btn" id="spinBtn">Крутить</button>
  `;
  bg.appendChild(panel);

  let isSpinning = false;
  document.getElementById('spinBtn').onclick = function() {
    if (isSpinning) return;
    isSpinning = true;
    const count = wheelPrizes.length;
    const prizeIdx = Math.floor(Math.random() * count);

    // Теперь правильное направление:
    // 0 сектор "сверху" (минус 90 град), prizeIdx на середину сектора
    const angleToPrize = 360 - ((prizeIdx + 0.5) * sectorAngle - 90) % 360;
    // Много оборотов + остановка на нужном секторе
    const fullRotation = 360 * 6 + angleToPrize;
    const svg = document.querySelector('.wheel-svg');
    svg.style.transition = "transform 3s cubic-bezier(.3,1.7,.5,1)";
    svg.style.transform = `rotate(${fullRotation}deg)`;
    setTimeout(() => {
      giveWheelPrize(prizeIdx);
      closeUpgradePanel();
      setTimeout(() => showWheelResult(prizeIdx), 200);
    }, 3200);
  };
}


function giveWheelPrize(idx) {
  const prize = wheelPrizes[idx];
  if (prize.type === "click") perClick += prize.value;
  else if (prize.type === "autoclick") perSec += prize.value;
  else if (prize.type === "energy") {
    energyMax += prize.value; energy += prize.value;
  }
  else if (prize.type === "regen") energyRegen += prize.value;
  else if (prize.type === "coins") coins += prize.value;
  render();
}

function showWheelResult(idx) {
  let bg = document.getElementById('upgradePanel');
  bg.innerHTML = '';
  bg.classList.add('active');
  bg.style.display = 'block';
  const prize = wheelPrizes[idx];
  let panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <div style="font-size:2.7em;text-align:center;margin-bottom:0.6em;">${prize.emoji}</div>
    <div style="font-size:1.45em;text-align:center;font-weight:700;margin-bottom:1.2em;">
      Вы выиграли:<br><b>${prize.text}</b>
    </div>
    <button class="other-big-btn" style="margin-bottom:0" onclick="closeUpgradePanel()">Ура!</button>
  `;
  bg.appendChild(panel);
}

// ==== Закрыть панель ====
function closeUpgradePanel() {
  let bg = document.getElementById('upgradePanel');
  bg.classList.remove('active');
  bg.style.display = 'none';
  bg.innerHTML = '';
}

// ==== Первый запуск ====
render();
