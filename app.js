const jobs = [
  { name: 'Install DMR radios at school', reward: 900, rep: 2, duration: 1 },
  { name: 'Emergency repeater fault at stadium', reward: 1400, rep: 3, duration: 1, urgent: true },
  { name: 'Program radios for construction site', reward: 700, rep: 2, duration: 1 },
  { name: 'Marine antenna alignment at harbour', reward: 1200, rep: 3, duration: 2 },
  { name: 'Hotel system health-check', reward: 650, rep: 1, duration: 1 },
  { name: 'Festival communications setup', reward: 2000, rep: 4, duration: 2, urgent: true },
];

const techPath = ['Analog Systems', 'DMR Digital', 'Repeaters', 'Bodycams', 'LTE/WAVE', 'AI Monitoring'];
const weatherTypes = ['☀️ Clear', '🌦️ Showers', '🌧️ Rain', '⛅ Cloudy', '🌩️ Storm'];

let state = JSON.parse(localStorage.getItem('radio-empire-uk')) || {
  started: false, avatar: null, day: 1, cash: 3500, rep: 10, engineers: 1, vanLevel: 1,
  office: 'Small Garage Office', territory: 'Local Town', techIndex: 0, tasks: [], feed: []
};

const $ = (id) => document.getElementById(id);
function money(v) { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v); }
function log(message) { state.feed.unshift(`Day ${state.day}: ${message}`); state.feed = state.feed.slice(0, 80); render(); }

function randJob() { return { ...jobs[Math.floor(Math.random() * jobs.length)], id: crypto.randomUUID(), left: 2 + Math.floor(Math.random() * 3) }; }
function seedTasks() { while (state.tasks.length < 3) state.tasks.push(randJob()); }

function render() {
  $('cash').textContent = money(state.cash);
  $('reputation').textContent = state.rep;
  $('engineers').textContent = state.engineers;
  $('day').textContent = state.day;

  $('companyList').innerHTML = [
    `Office: ${state.office}`,
    `Territory: ${state.territory}`,
    `Van Level: ${state.vanLevel}`,
    `Team Capacity: ${state.engineers * 2} active jobs/day`,
  ].map((x) => `<li>${x}</li>`).join('');

  $('techTree').innerHTML = techPath.map((t, i) => `<li>${i <= state.techIndex ? '✅' : '⬜'} ${t}</li>`).join('');

  $('taskList').innerHTML = state.tasks.map((t) => `
    <div class="task">
      <h4>${t.urgent ? '🚨 ' : ''}${t.name}</h4>
      <small>Reward ${money(t.reward)} · Rep +${t.rep} · Timer ${t.left}</small>
      <div class="row" style="margin-top:8px">
        <button class="btn" onclick="completeJob('${t.id}')">Dispatch</button>
      </div>
    </div>`).join('');

  $('feed').innerHTML = state.feed.map((e) => `<p>${e}</p>`).join('');

  const weather = weatherTypes[state.day % weatherTypes.length];
  $('weatherBadge').textContent = weather;
  $('sky').style.background = weather.includes('Storm')
    ? 'linear-gradient(180deg,#45546f,#202f4f)'
    : weather.includes('Rain') ? 'linear-gradient(180deg,#6194c4,#36679f)' : 'linear-gradient(180deg,#4db8ff,#2d75c8)';

  localStorage.setItem('radio-empire-uk', JSON.stringify(state));
}

window.completeJob = (id) => {
  const i = state.tasks.findIndex((x) => x.id === id);
  if (i < 0) return;
  const t = state.tasks[i];
  state.cash += t.reward;
  state.rep += t.rep;
  state.tasks.splice(i, 1);
  log(`Completed: ${t.name}. Earned ${money(t.reward)}.`);
  if (state.rep > 25 && state.office === 'Small Garage Office') { state.office = 'Local Workshop'; log('Expansion unlocked: Local Workshop.'); }
  if (state.rep > 50 && state.territory === 'Local Town') { state.territory = 'Regional Zone'; log('Territory expanded to Regional Zone.'); }
  render();
};

function nextTick() {
  state.day += 1;
  state.tasks.forEach((t) => t.left -= 1);
  const expired = state.tasks.filter((t) => t.left <= 0);
  if (expired.length) {
    state.tasks = state.tasks.filter((t) => t.left > 0);
    state.rep = Math.max(0, state.rep - expired.length * 2);
    log(`${expired.length} job(s) expired. Reputation decreased.`);
  }
  if (Math.random() < 0.6) { state.tasks.push(randJob()); log('Incoming enquiry received.'); }
  seedTasks();
  render();
}

function start() {
  state.started = true;
  seedTasks();
  $('onboarding').classList.add('hidden');
  $('game').classList.remove('hidden');
  log('Company launched with one van and starter tools.');
  render();
}

document.querySelectorAll('.avatar-choice').forEach((b) => b.onclick = () => {
  state.avatar = b.dataset.avatar;
  log(`Selected ${state.avatar === 'male' ? 'male' : 'female'} engineer profile.`);
});
$('startBtn').onclick = start;
$('nextTick').onclick = nextTick;
$('newLead').onclick = () => { state.tasks.push(randJob()); log('Networking event generated a new lead.'); render(); };
$('hireBtn').onclick = () => {
  if (state.cash < 2500) return log('Not enough cash to hire engineer.');
  state.cash -= 2500; state.engineers += 1; log('Hired engineer. Team capacity improved.'); render();
};
$('vanBtn').onclick = () => {
  if (state.cash < 1800) return log('Not enough cash for van upgrade.');
  state.cash -= 1800; state.vanLevel += 1; log('Van upgraded: better storage and fuel efficiency.'); render();
};
$('researchBtn').onclick = () => {
  if (state.cash < 2000) return log('Not enough cash for R&D.');
  if (state.techIndex >= techPath.length - 1) return log('All available technology unlocked.');
  state.cash -= 2000; state.techIndex += 1; log(`Unlocked technology: ${techPath[state.techIndex]}.`); render();
};
$('saveBtn').onclick = () => { localStorage.setItem('radio-empire-uk', JSON.stringify(state)); log('Manual save complete.'); };

if (state.started) { $('onboarding').classList.add('hidden'); $('game').classList.remove('hidden'); seedTasks(); render(); }
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
