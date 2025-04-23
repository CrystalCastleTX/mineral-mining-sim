// Add player movement using keyboard (WASD), sprint, jump, joystick control, clamping, rotation, animations, sound effects, and advanced mining particle effects with linked collectible items, inventory filters, and shop support
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let isJumping = false;
let canJump = true;
let isSprinting = false;
let velocity = new THREE.Vector3();
const speed = 0.1;
const sprintMultiplier = 2;
const jumpHeight = 0.25;
const groundLevel = 1;
const boundary = 100;

let mixer;
let actions = {};
let activeAction, previousAction;

const walkSound = new Audio('sounds/walk.mp3');
const jumpSound = new Audio('sounds/jump.mp3');
const landSound = new Audio('sounds/land.mp3');
const mineSound = new Audio('sounds/mine.mp3');
const extractSound = new Audio('sounds/extract.mp3');
const toolSwapSound = new Audio('sounds/tool-swap.mp3');
walkSound.loop = true;

let inventory = [];
let filter = 'All';
let currency = 0;
let ownedTools = [];

const prospectorTips = [
  "If it's got a glow, it might just be a showstopper! Keep that UV handy.",
  "Big ain't always better, sonny — thumbnails pay the bills if they shine right!",
  "Crystals speak true if you take the time to listen. Dig slow, dig smart.",
  "Never underestimate a pocket just ‘cause she’s quiet. Gold’s quiet too.",
  "The rarest finds often come when you're just about ready to quit."
];

function showProspectorIntro(message = null, persistent = false) {
  const box = document.createElement('div');
  box.id = 'prospector-intro';
  box.style.position = 'fixed';
  box.style.bottom = '10%';
  box.style.left = '10%';
  box.style.width = '320px';
  box.style.padding = '16px';
  box.style.backgroundColor = '#221';
  box.style.color = '#fff';
  box.style.fontFamily = 'monospace';
  box.style.fontSize = '13px';
  box.style.border = '2px solid #ccc';
  box.style.borderRadius = '8px';
  box.style.zIndex = '3000';
  const quote = message || prospectorTips[Math.floor(Math.random() * prospectorTips.length)];
  box.innerHTML = `
    <img src="images/prospector.png" style="width:64px; float:left; margin-right:10px;">
    <strong>Howdy, partner! 🤠</strong><br>
    ${quote}<br><br>
  `;
  const btn = document.createElement('button');
  btn.textContent = 'Let’s dig!';
  btn.onclick = () => document.body.removeChild(box);
  box.appendChild(btn);
  document.body.appendChild(box);
  if (!persistent) setTimeout(() => { if (document.body.contains(box)) document.body.removeChild(box); }, 15000);
}

function prospectorOnRareFind(mineral) {
  const message = `Well slap my pan and call it Pyrite! That there ${mineral} is a mighty fine find!`;
  showProspectorIntro(message, true);
}

function prospectorWelcomeToMine(name) {
  let mineLog = JSON.parse(localStorage.getItem('mineLog') || '[]');
  if (!mineLog.includes(name)) {
    mineLog.push(name);
    localStorage.setItem('mineLog', JSON.stringify(mineLog));
  }
  localStorage.setItem('currentMine', name);
  const visitLog = JSON.parse(localStorage.getItem('mineVisits') || '{}');
  if (!visitLog[name]) visitLog[name] = { count: 0, timeSpent: 0 };
  visitLog[name].count++;
  visitLog[name].lastVisit = Date.now();
  visitLog[name].startTime = Date.now();
  localStorage.setItem('mineVisits', JSON.stringify(visitLog));
  const message = `Welcome to the ${name} mine, friend. Keep your pick sharp and your eyes sharper!`;
  window.addEventListener('beforeunload', () => {
    const log = JSON.parse(localStorage.getItem('mineVisits') || '{}');
    const current = log[name];
    if (current && current.startTime) {
      const duration = Math.floor((Date.now() - current.startTime) / 1000);
      current.timeSpent += duration;
      const badges = JSON.parse(localStorage.getItem('badges') || '[]');

  if (minesOwned >= 5 && !badges.includes('Land Baron')) unlockAchievement('Land Baron');
  if (minesOwned >= 10 && !badges.includes('Territory Tycoon')) unlockAchievement('Territory Tycoon');
  if (minesOwned >= 15 && !badges.includes('Mine Magnate')) unlockAchievement('Mine Magnate');
      if (current.timeSpent >= 600 && !badges.includes('Dirt Rookie')) {
        unlockAchievement('Dirt Rookie');
      }
      if (current.timeSpent >= 1800 && !badges.includes('Pickaxe Pro')) {
        unlockAchievement('Pickaxe Pro');
      }
      if (current.timeSpent >= 6000 && !badges.includes('Tunnel Time')) {
        unlockAchievement('Tunnel Time');
      }
      delete current.startTime;
      localStorage.setItem('mineVisits', JSON.stringify(log));
    }
  });
  showProspectorIntro(message);
}

function showProspectorProfile() {
  const page = document.createElement('div');
  page.id = 'prospector-profile';
  page.style.position = 'fixed';
  page.style.top = '5%';
  page.style.left = '50%';
  page.style.transform = 'translateX(-50%)';
  page.style.width = '360px';
  page.style.background = '#111';
  page.style.color = '#fff';
  page.style.border = '2px solid #888';
  page.style.padding = '16px';
  page.style.zIndex = '3001';
  page.style.fontFamily = 'monospace';
  page.innerHTML = `
    <img src="images/prospector.png" style="width:80px; float:right; margin-left:12px;">
    <h3 style="margin-top:0;">Meet the Prospector</h3>
    <p>This here’s your trusty field guide. Been diggin' since '84 — that's 1884! Knows every mine this side o' the Rockies and every mineral worth polishin'.</p>
    <p>If it glows, grows, or breaks clean — he’ll know it. Listen close and keep your boots dry.</p>
    <p><strong>Prospector's Daily Tip:</strong><br><em>${prospectorTips[Math.floor(Math.random() * prospectorTips.length)]}</em></p>
  `;
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Got it, Prospector!';
  closeBtn.onclick = () => document.body.removeChild(page);
  page.appendChild(closeBtn);
  document.body.appendChild(page);
}

// Create Prospector Profile Button
const prospectorBtn = document.createElement('button');
prospectorBtn.textContent = '👴 Meet the Prospector';
prospectorBtn.style.position = 'fixed';
prospectorBtn.style.bottom = '10px';
prospectorBtn.style.right = '10px';
prospectorBtn.style.padding = '8px 12px';
prospectorBtn.style.fontFamily = 'monospace';
prospectorBtn.style.fontSize = '12px';
prospectorBtn.style.zIndex = '1001';
prospectorBtn.onclick = () => showProspectorProfile();
document.body.appendChild(prospectorBtn);

// Create Journal Tab
const journalBtn = document.createElement('button');
journalBtn.textContent = '📓 Collector’s Journal';
journalBtn.style.position = 'fixed';
journalBtn.style.bottom = '45px';
journalBtn.style.right = '10px';
journalBtn.style.padding = '8px 12px';
journalBtn.style.fontFamily = 'monospace';
journalBtn.style.fontSize = '12px';
journalBtn.style.zIndex = '1001';
journalBtn.onclick = () => showJournalTab();
document.body.appendChild(journalBtn);

function showJournalTab() {
  const contentSections = [];
  const sections = journalTabs.map(tab => {
    const div = document.createElement('div');
    div.style.display = 'none';
    contentSections.push(div);
    journal.appendChild(div);
    return div;
  });
  contentSections[0].style.display = '';
  const journal = document.createElement('div');
  journal.id = 'prospector-journal';
  journal.style.position = 'fixed';
  journal.style.top = '5%';
  journal.style.left = '50%';
  journal.style.transform = 'translateX(-50%)';
  journal.style.width = '400px';
  journal.style.maxHeight = '80%';
  journal.style.overflowY = 'scroll';
  journal.style.background = '#111';
  journal.style.color = '#fff';
  journal.style.border = '2px solid #888';
  journal.style.padding = '16px';
  journal.style.zIndex = '3002';
  journal.style.fontFamily = 'monospace';
  journal.innerHTML = '';
  createJournalTabs(journal, contentSections);
  prospectorTips.forEach((tip, i) => {
    const entry = document.createElement('p');
    entry.textContent = `• ${tip}`;
    sections[0].appendChild(entry);
  });

  const sectionBreak = document.createElement('hr');
  journal.appendChild(sectionBreak);

  const notesLabel = document.createElement('h4');
  notesLabel.textContent = 'Your Notes:';
  journal.appendChild(notesLabel);

  const notesArea = document.createElement('textarea');
  notesArea.style.width = '100%';
  notesArea.style.height = '80px';
  notesArea.style.marginBottom = '8px';
  notesArea.value = localStorage.getItem('playerNotes') || '';
  notesArea.oninput = () => localStorage.setItem('playerNotes', notesArea.value);
  sections[1].appendChild(notesArea);

  const mineLogLabel = document.createElement('h4');
  mineLogLabel.textContent = 'Visited Mines:';
  journal.appendChild(mineLogLabel);

  const mineLog = document.createElement('ul');
  mineLog.style.listStyle = 'square';
  const mineEntries = JSON.parse(localStorage.getItem('mineLog') || '[]');
  mineEntries.forEach(name => {
    const li = document.createElement('li');
    const stats = JSON.parse(localStorage.getItem('mineVisits') || '{}')[name] || { count: 0, timeSpent: 0 };
    const minutes = Math.floor(stats.timeSpent / 60);
    li.textContent = `${name} — Visits: ${stats.count}, Time Spent: ${minutes} min`;
    mineLog.appendChild(li);
  });
  sections[1].appendChild(mineLog);

  const favoriteLabel = document.createElement('h4');
  favoriteLabel.textContent = 'Favorite Specimens:';
  journal.appendChild(favoriteLabel);

  const favoriteList = document.createElement('ul');
  favoriteList.style.listStyle = 'circle';
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  favorites.forEach(spec => {
    const li = document.createElement('li');
    li.innerHTML = `<a href='https://www.mindat.org/search.php?search=${encodeURIComponent(spec)}' target='_blank'>${spec}</a>`;
    favoriteList.appendChild(li);
  });
  sections[2].appendChild(favoriteList);

  const specimenInput = document.createElement('input');
  specimenInput.placeholder = 'Enter specimen name to favorite...';
  specimenInput.style.width = '70%';
  specimenInput.style.marginRight = '4px';
  const addFavBtn = document.createElement('button');
  addFavBtn.textContent = '⭐ Add';
  addFavBtn.onclick = () => {
    const val = specimenInput.value.trim();
    if (val) {
      const current = JSON.parse(localStorage.getItem('favorites') || '[]');
      current.push(val);
      localStorage.setItem('favorites', JSON.stringify(current));
      saveGame();
      showJournalTab();
    }
  };
  sections[2].appendChild(specimenInput);
  sections[2].appendChild(addFavBtn);

  const searchLabel = document.createElement('h4');
  searchLabel.textContent = 'Search Your Journal:';
  journal.appendChild(searchLabel);

  const searchInput = document.createElement('input');
  searchInput.placeholder = 'Type to filter...';
  searchInput.style.width = '100%';
  searchInput.oninput = () => {
    const filter = searchInput.value.toLowerCase();
    const allText = journal.querySelectorAll('ul li, p');
    allText.forEach(el => {
      el.style.display = el.textContent.toLowerCase().includes(filter) ? '' : 'none';
    });
  };
  sections[2].appendChild(searchInput);

  const rareCount = inventory.filter(i => i.rarity === 'Rare' || i.rarity === 'Legendary').length;
  const uniqueCount = new Set(inventory.map(i => i.name)).size;
  const totalCount = inventory.length;

  const totalProgress = document.createElement('p');
  totalProgress.innerHTML = `📦 <strong>Total Collected:</strong> ${totalCount} (${Math.round((totalCount / 100) * 100)}%)`;
  totalProgress.style.margin = '0 0 6px 0';
  totalProgress.style.color = '#aaa';
  sections[4].appendChild(totalProgress);

  const uniqueProgress = document.createElement('p');
  uniqueProgress.innerHTML = `🧬 <strong>Unique Minerals:</strong> ${uniqueCount} / 50 (${Math.round((uniqueCount / 50) * 100)}%)`;
  uniqueProgress.style.margin = '0 0 6px 0';
  uniqueProgress.style.color = '#aac';
  sections[4].appendChild(uniqueProgress);
  const mineCount = JSON.parse(localStorage.getItem('mineLog') || '[]').length;

  const mineStat = document.createElement('p');
  mineStat.innerHTML = `⛏️ <strong>Mines Owned:</strong> ${mineCount} / 15 (${Math.round((mineCount / 15) * 100)}%)`;
  mineStat.style.color = '#ffcc99';
  mineStat.style.margin = '0 0 6px 0';
  sections[4].appendChild(mineStat);

  const rareIcon = document.createElement('p');
  rareIcon.innerHTML = `💎 <strong>Rare Minerals Found:</strong> ${rareCount} / 30 (${Math.round((rareCount / 30) * 100)}%)`;
  rareIcon.style.color = '#99f';
  rareIcon.style.margin = '0 0 6px 0';
  // Summary panel
  const summaryBox = document.createElement('div');
  summaryBox.style.background = '#222';
  summaryBox.style.border = '1px solid #444';
  summaryBox.style.borderRadius = '8px';
  summaryBox.style.padding = '10px';
  summaryBox.style.margin = '10px 0 14px';
  summaryBox.innerHTML = `
    <strong>📊 Summary:</strong><br>
    🔹 Total: ${totalCount} | Unique: ${uniqueCount}/50<br>
    💎 Rare: ${rareCount}/30 | ⛏️ Mines: ${mineCount}/15
  `;
  sections[4].appendChild(summaryBox);

  sections[4].appendChild(rareIcon);
  rareProgress.style.margin = '0 0 10px 0';
  rareProgress.style.color = '#99f';
  sections[4].appendChild(rareProgress);

  const badgeLabel = document.createElement('h4');
  badgeLabel.textContent = 'Your Achievements:';
  journal.appendChild(badgeLabel);

  const badgeList = document.createElement('div');
  badgeList.style.display = 'flex';
  badgeList.style.flexWrap = 'wrap';
  badgeList.style.gap = '10px';
  badgeList.style.marginBottom = '10px';
  const badges = JSON.parse(localStorage.getItem('badges') || '[]');
  const allBadges = [
  { name: 'Land Baron', description: 'Claimed 5 mines.', rarity: 'Common' },
  { name: 'Territory Tycoon', description: 'Claimed 10 mines.', rarity: 'Rare' },
  { name: 'Mine Magnate', description: 'Claimed 15 mines.', rarity: 'Legendary' },
  { name: 'Rare Hunter', description: 'Collected 5 rare or legendary minerals.', rarity: 'Rare' },
  { name: 'Crystal Curator', description: 'Collected 15 rare or legendary minerals.', rarity: 'Rare' },
  { name: 'Elite Collector', description: 'Collected 30 rare or legendary minerals.', rarity: 'Legendary' },
  { name: 'Rockhound', description: 'Collected 5 different minerals.', rarity: 'Common' },
  { name: 'Beginner Collector', description: 'Collected 10 different minerals.', rarity: 'Common' },
  { name: 'Seasoned Collector', description: 'Collected 25 different minerals.', rarity: 'Rare' },
  { name: 'Competition Collector', description: 'Collected 40 different minerals.', rarity: 'Rare' },
  { name: 'Master Collector', description: 'Collected 50 different minerals.', rarity: 'Legendary' },
  { name: 'Dirt Rookie', description: 'Spent 10+ minutes underground.', rarity: 'Common' },
  { name: 'Pickaxe Pro', description: 'Spent 30+ minutes underground.', rarity: 'Rare' },
  { name: 'Master Collector', description: 'Collected one of each mineral type.', rarity: 'Legendary' },
  { name: 'Tunnel Time', description: 'Spent 100+ minutes underground.', rarity: 'Rare' },
  { name: 'First Find', description: 'Extracted your first mineral!', rarity: 'Common' },
  { name: 'Mine Explorer', description: 'Visited 5 different mines.', rarity: 'Rare' },
  { name: 'Pocket Master', description: 'Named and saved a crystal pocket.', rarity: 'Rare' },
  { name: 'Legendary Pull', description: 'Pulled a Legendary specimen.', rarity: 'Legendary' },
  { name: 'Journalist', description: 'Saved your first personal note.', rarity: 'Common' }
];

allBadges.forEach(badge => {
  const badgeBox = document.createElement('div');
  const isUnlocked = badges.includes(badge.name);
  badgeBox.style.background = isUnlocked ? (badge.rarity === 'Legendary' ? '#6a0dad' : badge.rarity === 'Rare' ? '#1e90ff' : '#333') : '#444';
  badgeBox.style.color = isUnlocked ? '#fff' : '#888';
  badgeBox.style.border = '1px solid #666';
  badgeBox.style.padding = '4px 8px';
  badgeBox.style.borderRadius = '4px';
  badgeBox.style.cursor = 'default';
  badgeBox.title = isUnlocked ? badge.description : '??? — keep exploring!';
  badgeBox.textContent = isUnlocked ? `🏅 ${badge.name}` : '🔒 ???';
  badgeList.appendChild(badgeBox);
});
  });
  sections[4].appendChild(badgeList);

  const pocketLabel = document.createElement('h4');
  pocketLabel.textContent = 'Crystal Pockets Discovered:';
  sections[3].appendChild(pocketLabel);

  const pocketList = document.createElement('ul');
  pocketList.style.listStyle = 'circle';
  const pockets = JSON.parse(localStorage.getItem('pocketLog') || '[]');
  pockets.forEach(p => {
    const li = document.createElement('li');
    li.textContent = `${p.name} (${p.mine}, ${p.timestamp}): ${p.notes}`;
    pocketList.appendChild(li);
  });
  sections[3].appendChild(pocketList);

  const pocketName = document.createElement('input');
  pocketName.placeholder = 'Pocket name';
  pocketName.style.marginRight = '4px';
  const pocketNote = document.createElement('input');
  pocketNote.placeholder = 'Short notes...';
  pocketNote.style.marginRight = '4px';
  const addPocketBtn = document.createElement('button');
  addPocketBtn.textContent = '➕ Save Pocket';
  addPocketBtn.onclick = () => {
    const name = pocketName.value.trim();
    const notes = pocketNote.value.trim();
    if (name) {
      addToPocketsLog(name, notes);
      showJournalTab();
    }
  };
  sections[3].appendChild(pocketName);
  sections[3].appendChild(pocketNote);
  sections[3].appendChild(addPocketBtn);

  const captureBtn = document.createElement('button');
  captureBtn.textContent = '📸 Snapshot This View';
  captureBtn.style.marginTop = '10px';
  captureBtn.onclick = () => {
    html2canvas(document.getElementById('prospector-journal')).then(canvas => {
      const link = document.createElement('a');
      link.download = 'specimen-journal.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  };
  const mineralLookupLabel = document.createElement('h4');
  mineralLookupLabel.textContent = '🔍 Mineral ID Lookup:';
  sections[5].appendChild(mineralLookupLabel);

  const idInput = document.createElement('input');
  idInput.placeholder = 'Enter mineral name...';
  idInput.style.width = '75%';
  idInput.style.marginRight = '4px';
  const suggestions = Array.from(new Set(inventory.map(i => i.name))).sort();
  const datalist = document.createElement('datalist');
  datalist.id = 'mineral-suggestions';
  suggestions.forEach(mineral => {
    const opt = document.createElement('option');
    opt.value = mineral;
    datalist.appendChild(opt);
  });
  document.body.appendChild(datalist);
  idInput.setAttribute('list', 'mineral-suggestions');

  const idBtn = document.createElement('button');
  idBtn.textContent = 'Search';

  const idResult = document.createElement('div');
  idResult.style.marginTop = '10px';
  idResult.style.fontSize = '13px';
  idResult.style.lineHeight = '1.4';

  idBtn.onclick = () => {
    const val = idInput.value.trim();
    if (val) {
      const link = `https://www.mindat.org/search.php?search=${encodeURIComponent(val)}`;
      idResult.innerHTML = `Results for <strong>${val}</strong>:<br><a href='${link}' target='_blank'>View on Mindat.org</a>`;
      window.open(link, '_blank');
    }
  };

  idInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      idBtn.click();
    }
  });

  sections[5].appendChild(idInput);
  sections[5].appendChild(idBtn);
  sections[5].appendChild(idResult);

  sections[5].appendChild(captureBtn);
  closeBtn.textContent = 'Close Journal';
  closeBtn.onclick = () => document.body.removeChild(journal);
  journal.appendChild(closeBtn); closeBtn.style.marginTop = '12px';
}

// Collector's Journal Tabs and Features
const journalTabs = ['Tips', 'Mines', 'Favorites', 'Pockets', 'Achievements', 'Mineral ID'];

function createJournalTabs(container, contentSections) {
  const tabBar = document.createElement('div');
  tabBar.style.display = 'flex';
  tabBar.style.gap = '6px';
  tabBar.style.marginBottom = '10px';

  journalTabs.forEach((tab, index) => {
    const btn = document.createElement('button');
    btn.textContent = tab;
    btn.style.flex = '1';
    btn.onclick = () => {
      contentSections.forEach((s, i) => s.style.display = i === index ? '' : 'none');
    };
    tabBar.appendChild(btn);
  });

  container.appendChild(tabBar);
}

// Title screen overlay
function showTitleScreen() {
  const title = document.createElement('div');
  title.id = 'title-screen';
  title.style.position = 'fixed';
  title.style.top = '0';
  title.style.left = '0';
  title.style.width = '100vw';
  title.style.height = '100vh';
  title.style.background = "url('images/title-background.jpg') center center / cover no-repeat, radial-gradient(circle at top, #111, #222)";
  title.style.color = '#fff';
  title.style.display = 'flex';
  title.style.animation = 'fadeIn 2s ease';
  title.style.flexDirection = 'column';
  title.style.alignItems = 'center';
  title.style.justifyContent = 'center';
  title.style.zIndex = '99999';
  title.style.fontFamily = 'monospace';

  const logo = document.createElement('h1');
  logo.textContent = 'Mineral Mining Sim';
  logo.style.fontSize = '36px';
  logo.style.marginBottom = '10px';

  const subtitle = document.createElement('p');
  subtitle.textContent = 'A Collector’s Journey';
  subtitle.style.fontSize = '18px';
  subtitle.style.marginBottom = '40px';
  subtitle.style.color = '#bbb';

  const startBtn = document.createElement('button');
  startBtn.textContent = 'Start Your Journey';
  startBtn.style.padding = '12px 20px';
  startBtn.style.fontSize = '14px';
  startBtn.style.cursor = 'pointer';
  const loadBtn = document.createElement('button');
  loadBtn.textContent = 'Continue';
  loadBtn.style.padding = '10px 18px';
  loadBtn.style.fontSize = '14px';
  loadBtn.style.marginTop = '8px';
  loadBtn.onclick = () => {
    document.body.removeChild(title);
    showProspectorIntro();
  };

  title.appendChild(loadBtn);

  startBtn.onclick = () => {
    alert('Your game will be saved automatically on your device. Progress is stored locally.');
    if (localStorage.length > 0) {
      const confirmNew = confirm('Starting a new journey will erase your current progress. Are you sure?');
      if (!confirmNew) return;
    }
    localStorage.clear();
    document.body.removeChild(title);
    showProspectorIntro();

function playMiningEffect(mineral = null, rarity = null) {
  mineSound.play();
  const phrases = ["That’s a good one!", "We hit a pocket!", "Diggin’ a hole!", "Crack that matrix!", "Nice crystal strike!"];
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];

  const fx1 = document.createElement('div');
  fx1.textContent = `✨ ${phrase}`;
  fx1.style.position = 'fixed';
  fx1.style.top = '50%';
  fx1.style.left = '50%';
  fx1.style.transform = 'translate(-50%, -50%)';
  fx1.style.fontSize = '20px';
  fx1.style.color = '#ffd700';
  fx1.style.fontFamily = 'monospace';
  fx1.style.zIndex = '9999';
  fx1.style.opacity = '1';
  fx1.style.transition = 'opacity 1s ease-out, top 1s ease-out';
  document.body.appendChild(fx1);
  setTimeout(() => { fx1.style.opacity = '0'; fx1.style.top = '45%'; }, 100);
  setTimeout(() => document.body.removeChild(fx1), 1100);

  if (mineral && rarity) {
    const fx2 = document.createElement('div');
    fx2.textContent = `💎 ${mineral} (${rarity})`;
    fx2.style.position = 'fixed';
    fx2.style.top = '58%';
    fx2.style.left = '50%';
    fx2.style.transform = 'translate(-50%, -50%)';
    fx2.style.fontSize = '18px';
    fx2.style.fontFamily = 'monospace';
    fx2.style.zIndex = '9999';
    fx2.style.opacity = '1';
    fx2.style.transition = 'opacity 1.2s ease-out, top 1s ease-out';
    fx2.style.color = rarity === 'Legendary' ? '#cc00ff' : rarity === 'Rare' ? '#33ccff' : rarity === 'Uncommon' ? '#aaff00' : '#ccc';
    document.body.appendChild(fx2);
    setTimeout(() => { fx2.style.opacity = '0'; fx2.style.top = '53%'; }, 200);
    setTimeout(() => document.body.removeChild(fx2), 1200);

    if (rarity === 'Legendary' || rarity === 'Rare') {
      const glow = document.createElement('div');
      glow.style.position = 'fixed';
      glow.style.top = '50%';
      glow.style.left = '50%';
      glow.style.transform = 'translate(-50%, -50%)';
      glow.style.width = '200px';
      glow.style.height = '200px';
      glow.style.borderRadius = '50%';
      glow.style.background = rarity === 'Legendary' ? 'radial-gradient(circle, rgba(204,0,255,0.4), transparent)' : 'radial-gradient(circle, rgba(51,204,255,0.3), transparent)';
      glow.style.zIndex = '9998';
      glow.style.opacity = '1';
      glow.style.pointerEvents = 'none';
      glow.style.transition = 'opacity 1.2s ease-out';
      document.body.appendChild(glow);
      setTimeout(() => glow.style.opacity = '0', 200);
      setTimeout(() => document.body.removeChild(glow), 1000);
    }
  }
  }
}

// Mineral extraction and inventory logic
function triggerExtraction() {
  const types = ['Fluorite', 'Quartz', 'Wulfenite', 'Azurite', 'Calcite', 'Rhodochrosite', 'Vanadinite'];
  const fluorescent = ['Fluorite', 'Wulfenite', 'Calcite'];
  const rarities = ['Common', 'Uncommon', 'Rare', 'Legendary'];
  const sizes = ['Micro', 'Thumbnail', 'Miniature', 'Cabinet'];

  let type = types[Math.floor(Math.random() * types.length)];
  let rarityRoll = Math.random();
  if (ownedTools.includes('UV Flashlight') && fluorescent.includes(type)) {
    rarityRoll -= 0.1;
  }

  let rarity;
  if (rarityRoll < 0.05) rarity = 'Legendary';
  else if (rarityRoll < 0.2) rarity = 'Rare';
  else if (rarityRoll < 0.5) rarity = 'Uncommon';
  else rarity = 'Common';

  const item = {
    name: type,
    rarity: rarity,
    size: sizes[Math.floor(Math.random() * sizes.length)],
    value: Math.floor(Math.random() * 1000) + 100
  };

  inventory.push(item);
  saveGame();
  playMiningEffect(item.name, item.rarity);
  extractSound.play();
  checkCollectorMilestones();
  if (rarity === 'Legendary') prospectorOnRareFind(type);
  updateInventoryUI && updateInventoryUI();
}

// Continuous Save System
function saveGame() {
  localStorage.setItem('inventory', JSON.stringify(inventory));
  localStorage.setItem('currency', JSON.stringify(currency));
  localStorage.setItem('ownedTools', JSON.stringify(ownedTools));
}

// Auto-track favorite specimens and badges
function checkCollectorMilestones() {
  const minesOwned = JSON.parse(localStorage.getItem('mineLog') || '[]').length;
  const unique = new Set(inventory.map(i => i.name));
  const count = unique.size;
  const rareCount = inventory.filter(i => i.rarity === 'Rare' || i.rarity === 'Legendary').length;
  const badges = JSON.parse(localStorage.getItem('badges') || '[]');

  if (count >= 5 && !badges.includes('Rockhound')) unlockAchievement('Rockhound');
  if (count >= 10 && !badges.includes('Beginner Collector')) unlockAchievement('Beginner Collector');
  if (count >= 25 && !badges.includes('Seasoned Collector')) unlockAchievement('Seasoned Collector');
  if (count >= 40 && !badges.includes('Competition Collector')) unlockAchievement('Competition Collector');
  if (count >= 50 && !badges.includes('Master Collector')) unlockAchievement('Master Collector');

  if (rareCount >= 5 && !badges.includes('Rare Hunter')) unlockAchievement('Rare Hunter');
  if (rareCount >= 15 && !badges.includes('Crystal Curator')) unlockAchievement('Crystal Curator');
  if (rareCount >= 30 && !badges.includes('Elite Collector')) unlockAchievement('Elite Collector');
}
function addToPocketsLog(pocketName, notes = '') {
  const timestamp = new Date().toLocaleString();
  const mine = localStorage.getItem('currentMine') || 'Unknown Mine';
  const pockets = JSON.parse(localStorage.getItem('pocketLog') || '[]');
  pockets.push({ name: pocketName, notes, mine, timestamp });
  localStorage.setItem('pocketLog', JSON.stringify(pockets));
}

function unlockAchievement(name) {
  if (name === 'Master Collector') return;
  const badges = JSON.parse(localStorage.getItem('badges') || '[]');
  const badges = JSON.parse(localStorage.getItem('badges') || '[]');
  if (!badges.includes(name)) {
    badges.push(name);
    localStorage.setItem('badges', JSON.stringify(badges));
    showProspectorIntro(`🎖️ Yeehaw! You just unlocked a badge: "${name}"!`, true);
  }
}
