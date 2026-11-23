'use strict';

// Initial sample state. User changes are saved locally after each action.
const classes = [
  { name: 'Husband', category: 'personal', domain: 'Mental', level: 6, xp: 640, max: 1000, color: '#98606a', tint: '#f3e7e8' },
  { name: 'Homekeeper', category: 'general', domain: 'Shelter', level: 4, xp: 280, max: 600, color: '#8b7040', tint: '#f2eddf' },
  { name: 'Game Designer', category: 'artistic', domain: 'Mental', level: 8, xp: 820, max: 1200, color: '#80659e', tint: '#ede8f4' },
  { name: 'Materials Engineer', category: 'professional', domain: 'Monetary', level: 12, xp: 1450, max: 2000, color: '#517880', tint: '#e6eff0' },
  { name: 'Corporate Team Leader', category: 'professional', domain: 'Monetary', level: 7, xp: 530, max: 1000, color: '#5d7650', tint: '#e9eee3' },
  { name: 'Writer', category: 'artistic', domain: 'Mental', level: 3, xp: 190, max: 500, color: '#946c47', tint: '#f4eadf' },
  { name: 'Self Keeper', category: 'general', domain: 'Physical', level: 1, xp: 0, max: 500, color: '#517880', tint: '#e6eff0' }
];
// Existing sample class progress belongs to General; new skills start at zero.
for (const entry of classes) {
  const extra = entry.name === 'Writer' ? ['Short Stories', 'Characters']
    : entry.name === 'Game Designer' ? ['Mechanics'] : [];
  entry.skills = [{ name: 'General', xp: entry.xp }, ...extra.map(name => ({ name, xp: 0 }))];
}
const SKILL_XP_BASE = 100;
const SKILL_XP_GROWTH = 1.5;
function skillProgress(totalXP) {
  let level = 1, xp = Math.max(0, Number(totalXP) || 0);
  let next = SKILL_XP_BASE;
  while (xp >= next) {
    xp -= next;
    level++;
    next = Math.ceil(SKILL_XP_BASE * SKILL_XP_GROWTH ** (level - 1));
  }
  return { level, xp, next };
}
const domainForClass = classId => classes[classId].domain;

const healthIcons = {
  Shelter: '<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>',
  Monetary: '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 9h18M16 13h5v4h-5a2 2 0 0 1 0-4Z"/>',
  Mental: '<path d="M9 18v3h8v-5a7 7 0 1 0-12-5l-2 4h4v3h2Z"/><path d="m10 10 2 2 4-4"/>',
  Physical: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/><path d="M3 12h5l2-4 3 8 2-4h6"/>'
};
const domains = [
  { name: 'Shelter', value: 86, color: '#7f9272' },
  { name: 'Monetary', value: 74, color: '#9b9b6b' },
  { name: 'Mental', value: 62, color: '#9b8bac' },
  { name: 'Physical', value: 81, color: '#72979a' }
];
const questSizes = {
  tiny: { label: 'Tiny', xp: 25, rate: 1 },
  small: { label: 'Small', xp: 50, rate: 2 },
  medium: { label: 'Medium', xp: 100, rate: 4 },
  large: { label: 'Large', xp: 200, rate: 8 },
  veryLarge: { label: 'Very large', xp: 400, rate: 16 }
};

const DAY = 86400000;
function localDateValue(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
function deadlineForDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 9999) return NaN;
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(23, 59, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return NaN;
  return date.getTime();
}
function dayDeadline(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return deadlineForDate(localDateValue(date));
}
const quests = [
  { title: 'Plan a date night', classId: 0, xp: 120, skill: 'General', deadline: dayDeadline(1), domain: 'Mental', rate: 2 },
  { title: 'Finish the bathroom trim', classId: 1, xp: 180, skill: 'General', deadline: dayDeadline(-1), domain: 'Shelter', rate: 3 },
  { title: 'Playtest the new combat system', classId: 2, xp: 200, skill: 'Mechanics', deadline: dayDeadline(3), domain: 'Mental', rate: 2 }
];

const STORAGE_KEY = 'quest-character-v1';
let profile = { firstName: 'Douglas', lastName: '', pronouns: '', location: '', bio: '' };
let storageAvailable = true;
function validStoredClass(entry) {
  return entry && typeof entry.name === 'string' && entry.name.trim() &&
    ['Mental','Monetary','Shelter','Physical'].includes(entry.domain) &&
    Number.isSafeInteger(entry.level) && entry.level >= 1 && Number.isFinite(entry.xp) && entry.xp >= 0 &&
    Number.isFinite(entry.max) && entry.max > entry.xp && Array.isArray(entry.skills) &&
    entry.skills.some(skill => skill.name === 'General') && entry.skills.every(skill =>
      typeof skill.name === 'string' && Number.isSafeInteger(skill.xp) && skill.xp >= 0);
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.version !== 1 || !Array.isArray(saved.classes) || !saved.classes.length ||
        !saved.classes.every(validStoredClass) || !Array.isArray(saved.quests)) return;
    const validQuests = saved.quests.every(quest => quest && typeof quest.title === 'string' &&
      Number.isInteger(quest.classId) && saved.classes[quest.classId] &&
      saved.classes[quest.classId].skills.some(skill => skill.name === quest.skill) &&
      Number.isFinite(quest.deadline) && !Number.isNaN(new Date(quest.deadline).getTime()) &&
      Number.isFinite(quest.xp) && quest.xp >= 0 && Number.isFinite(quest.rate) && quest.rate >= 0);
    if (!validQuests) return;
    classes.splice(0, classes.length, ...saved.classes);
    quests.splice(0, quests.length, ...saved.quests);
    if (saved.profile) for (const key of Object.keys(profile)) {
      if (typeof saved.profile[key] === 'string') profile[key] = saved.profile[key];
    }
  } catch { storageAvailable = false; }
}
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, profile, classes, quests }));
    return true;
  } catch {
    storageAvailable = false;
    $('#storage-note').textContent = 'Browser storage is unavailable. Changes last until you close or reload this page.';
    toast('Changes applied, but browser storage is unavailable.');
    return false;
  }
}
loadState();

const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

// Only the center icon changes hue: red -> amber -> green as health rises.
function healthIconColor(value) {
  const health = Math.max(0, Math.min(100, value));
  return `hsl(${health * 1.2}, 58%, 40%)`;
}

function renderHealth() {
  $('#health-grid').innerHTML = domains.map((domain, index) => `
    <button class="health-domain" type="button" data-domain="${index}"
      style="--domain-color:${domain.color};--health-icon-color:${healthIconColor(domain.value)}" aria-label="${domain.name} Health: ${domain.value}%">
      <span class="health-ring">
        <svg class="health-ring-track" viewBox="0 0 100 100" aria-hidden="true">
          <circle class="ring-track" cx="50" cy="50" r="44"/>
          <circle class="ring-value" cx="50" cy="50" r="44" pathLength="100"
            stroke-dasharray="100 100" stroke-dashoffset="${100 - domain.value}"/>
        </svg>
        <span class="health-domain-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${healthIcons[domain.name]}</svg></span>
      </span>
    </button>`).join('');
}

function renderClasses() {
  $('#classes').innerHTML = classes.map((entry, index) => `
    <button class="class-tag" type="button" data-class="${index}" aria-expanded="false"
      style="--color:${entry.color};--tint:${entry.tint};--tag-border:${entry.color}40">
      <span>${escapeHTML(entry.name)}</span><b>${entry.level}</b>
    </button>`).join('');
}

function renderQuests() {
  $('#quest-count').textContent = quests.length;
  const questMarkup = quests.map((quest, index) => {
    const overdue = quest.deadline < Date.now();
    const days = Math.max(1, Math.ceil(Math.abs(quest.deadline - Date.now()) / DAY));
    const deadline = overdue ? `Overdue &middot; ${days}d` : days === 1 ? 'Due within 24 hours' : `Due in ${days} days`;
    const dueDate = new Date(quest.deadline);
    const dateLabel = dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const domain = domainForClass(quest.classId);
    const hasDamage = !quest.noDamage && quest.rate > 0;
    const penalty = !hasDamage ? `${domain} &middot; No damage` : overdue
      ? `&minus;${quest.rate} ${domain.toLowerCase()} / day`
      : `${domain} &middot; &minus;${quest.rate}/day if overdue`;
    return `
      <article class="quest ${overdue ? 'overdue' : ''}">
        <button class="complete-button" type="button" data-complete="${index}" aria-label="Complete ${escapeHTML(quest.title)}"></button>
        <div class="quest-copy"><h3>${escapeHTML(quest.title)}</h3><p class="quest-class">${escapeHTML(classes[quest.classId].name)} &middot; ${escapeHTML(quest.skill || 'General')}</p></div>
        <span class="reward">+${quest.xp} XP</span>
        <div class="quest-meta"><time class="deadline" datetime="${dueDate.toISOString()}">${deadline} &middot; ${dateLabel}, 11:59 PM</time><span class="${overdue && hasDamage ? 'damage' : ''}">${penalty}</span></div>
      </article>`;
  });
  const empty = '<p class="empty-state">All clear. A little breathing room, well earned.</p>';
  $('#quest-list').innerHTML = questMarkup.join('') || empty;
  $('#home-quest-list').innerHTML = questMarkup.slice(0, 3).join('') || empty;
}

// Shared fixed popup: clamp it to the viewport instead of guessing tag alignment.
const popup = $('#detail-popup');
let popupTarget = null;
let pinned = false;
let dismissTimer;
function closeDetails() {
  clearTimeout(dismissTimer);
  if (popupTarget) {
    popupTarget.removeAttribute('aria-describedby');
    if (popupTarget.matches('.class-tag')) popupTarget.setAttribute('aria-expanded', 'false');
  }
  popup.hidden = true;
  popupTarget = null;
  pinned = false;
}
function positionDetails() {
  if (!popupTarget || popup.hidden) return;
  const target = popupTarget.getBoundingClientRect();
  const bounds = popup.getBoundingClientRect();
  const gutter = 12;
  const left = Math.max(gutter, Math.min(target.left, window.innerWidth - bounds.width - gutter));
  let top = target.bottom + 10;
  if (top + bounds.height > window.innerHeight - gutter) top = target.top - bounds.height - 10;
  popup.style.left = `${left}px`;
  popup.style.top = `${Math.max(gutter, Math.min(top, window.innerHeight - bounds.height - gutter))}px`;
}
function showDetails(target, pin = false) {
  if (pinned && !pin) return;
  closeDetails();
  popupTarget = target;
  pinned = pin;
  if (target.matches('.class-tag')) {
    const entry = classes[Number(target.dataset.class)];
    popup.className = 'detail-popup';
    popup.style.setProperty('--color', entry.color);
    popup.innerHTML = `
      <div class="detail-heading">${escapeHTML(entry.name)}<span>Level ${entry.level}</span></div>
      <p class="detail-domain">${entry.domain} domain</p>
      <div class="xp-label"><b>${entry.xp.toLocaleString()} / ${entry.max.toLocaleString()} XP</b><span>${(entry.max - entry.xp).toLocaleString()} to next level</span></div>
      <div class="bar" role="progressbar" aria-label="${escapeHTML(entry.name)} experience" aria-valuenow="${entry.xp}" aria-valuemin="0" aria-valuemax="${entry.max}"><span style="width:${entry.xp / entry.max * 100}%"></span></div>`;
    target.setAttribute('aria-expanded', 'true');
  } else {
    const domain = domains[Number(target.dataset.domain)];
    popup.className = 'detail-popup health-detail';
    popup.innerHTML = `<div class="detail-heading">${domain.name} Health<span>${domain.value}% healthy</span></div>`;
  }
  target.setAttribute('aria-describedby', 'detail-popup');
  popup.hidden = false;
  positionDetails();
}
const detailSelector = '.class-tag, .health-domain';
document.addEventListener('pointerover', event => {
  const target = event.target.closest(detailSelector);
  if (event.pointerType === 'mouse' && target && !target.contains(event.relatedTarget)) showDetails(target);
});
document.addEventListener('pointerout', event => {
  if (!pinned && popupTarget && popupTarget.contains(event.target) && !popupTarget.contains(event.relatedTarget)) closeDetails();
});
document.addEventListener('focusin', event => {
  if (event.target.matches(detailSelector) && event.target.matches(':focus-visible')) showDetails(event.target);
});
document.addEventListener('focusout', event => {
  if (!pinned && event.target === popupTarget) closeDetails();
});
document.addEventListener('click', event => {
  const target = event.target.closest(detailSelector);
  if (!target) return;
  if (popupTarget === target && pinned) closeDetails();
  else showDetails(target, true);
});
document.addEventListener('pointerdown', event => {
  if (!event.target.closest(detailSelector)) closeDetails();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeDetails();
});
window.addEventListener('resize', positionDetails);
window.addEventListener('scroll', closeDetails, true);

// Touch-and-hold reveals a domain without interfering with scrolling.
let holdTimer;
let holdOrigin;
let heldTarget = null;
$('#health-grid').addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse') return;
  const target = event.target.closest('.health-domain');
  if (!target) return;
  clearTimeout(holdTimer);
  heldTarget = null;
  holdOrigin = { x: event.clientX, y: event.clientY };
  holdTimer = setTimeout(() => {
    heldTarget = target;
    showDetails(target, true);
    dismissTimer = setTimeout(closeDetails, 4000);
  }, 450);
});
$('#health-grid').addEventListener('pointermove', event => {
  if (holdOrigin && Math.hypot(event.clientX - holdOrigin.x, event.clientY - holdOrigin.y) > 10) clearTimeout(holdTimer);
});
for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
  $('#health-grid').addEventListener(type, () => {
    clearTimeout(holdTimer);
    holdOrigin = null;
  });
}
$('#health-grid').addEventListener('click', event => {
  if (heldTarget && heldTarget.contains(event.target)) {
    event.stopPropagation();
    event.preventDefault();
  }
  heldTarget = null;
});
$('#health-grid').addEventListener('contextmenu', event => event.preventDefault());

let toastTimer;
function toast(message) {
  $('#toast').textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('#toast').textContent = ''; }, 4000);
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-complete]');
  if (!button) return;
  const quest = quests.splice(Number(button.dataset.complete), 1)[0];
  const entry = classes[quest.classId];
  const skill = entry.skills.find(skill => skill.name === (quest.skill || 'General'));
  skill.xp += quest.xp;
  entry.xp += quest.xp;
  let leveled = false;
  while (entry.xp >= entry.max) {
    entry.xp -= entry.max;
    entry.level++;
    entry.max += 200;
    leveled = true;
  }
  closeDetails();
  renderClasses();
  renderClassCards();
  renderQuests();
  saveState();
  toast(`${quest.title} complete! +${quest.xp} ${entry.name} XP${leveled ? ' | Level up!' : ''}`);
  const next = location.hash === '#/home' || !location.hash ? $('#home-quest-list .complete-button') || $('.text-link') : $('#quest-list .complete-button') || $('#add-quest');
  next.focus({ preventScroll: true });
});
const dialog = $('#quest-dialog');
$('#add-quest').addEventListener('click', () => {
  $('[name=deadline]').value = localDateValue(new Date(dayDeadline(1)));
  $('[name=deadline]').setCustomValidity('');
  updateQuestOptions();
  dialog.showModal();
});
$('#cancel').addEventListener('click', () => dialog.close());
$('#quest-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = new FormData(event.target);
  const title = form.get('title').trim();
  if (!title) {
    $('[name=title]').setCustomValidity('Enter a quest objective.');
    $('[name=title]').reportValidity();
    return;
  }
  const size = form.get('size');
  const reward = questSizes[size];
  if (!reward) return;
  const classId = Number(form.get('classId'));
  if (!classes[classId]) return;
  const skill = form.get('skill');
  if (!classes[classId].skills.some(entry => entry.name === skill)) return;
  const deadline = deadlineForDate(form.get('deadline'));
  if (!Number.isFinite(deadline)) {
    $('[name=deadline]').setCustomValidity('Enter a valid date.');
    $('[name=deadline]').reportValidity();
    return;
  }
  const noDamage = form.get('noDamage') === 'on';
  quests.push({ title, classId, skill, deadline, domain: domainForClass(classId), size, xp: reward.xp, noDamage, rate: noDamage ? 0 : reward.rate });
  dialog.close();
  event.target.reset();
  updateSkillOptions();
  updateQuestOptions();
  renderQuests();
  saveState();
  toast('Quest added. Your next step is ready.');
});
$('[name=title]').addEventListener('input', event => event.target.setCustomValidity(''));
$('#quest-size-options').innerHTML = Object.entries(questSizes).map(([key, size]) => `
  <label class="size-option">
    <input type="radio" name="size" value="${key}" ${key === 'medium' ? 'checked' : ''} required>
    <span class="size-card"><strong>${size.label}</strong><span>${size.xp} XP</span><small data-size-damage="${key}">&minus;${size.rate}/day</small></span>
  </label>`).join('');
function populateQuestClasses() {
  const selected = $('#class-select').value;
  $('#class-select').innerHTML = classes.map((entry, index) => `<option value="${index}">${escapeHTML(entry.name)}</option>`).join('');
  if (classes[Number(selected)]) $('#class-select').value = selected;
}
populateQuestClasses();
function updateQuestOptions() {
  $('#quest-domain').textContent = domainForClass(Number($('#class-select').value));
  const noDamage = $('#no-damage').checked;
  for (const [key, size] of Object.entries(questSizes)) {
    $('[data-size-damage="' + key + '"]').textContent = noDamage ? 'No damage' : '-' + size.rate + '/day';
  }
  $('#size-help').textContent = noDamage
    ? 'XP on completion. This quest never deals overdue damage.'
    : 'XP on completion. Health damage per day after the deadline.';
}
function updateSkillOptions() {
  const entry = classes[Number($('#class-select').value)];
  $('#skill-select').innerHTML = entry.skills.map(skill =>
    `<option value="${escapeHTML(skill.name)}">${escapeHTML(skill.name)}</option>`).join('');
  $('#skill-select').value = 'General';
}
$('#class-select').addEventListener('change', () => {
  updateSkillOptions();
  updateQuestOptions();
});
$('[name=deadline]').addEventListener('input', event => event.target.setCustomValidity(''));
$('#no-damage').addEventListener('change', updateQuestOptions);

function renderProfile() {
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Adventurer';
  $('#display-name').textContent = name;
  $('#sidebar-name').textContent = name;
  $('#avatar').textContent = (Array.from(profile.firstName)[0] || 'A').toUpperCase();
  const details = [profile.pronouns, profile.location].filter(Boolean).join(' / ');
  $('#profile-details').hidden = !details && !profile.bio;
  $('#profile-details').innerHTML = (details ? '<p>' + escapeHTML(details) + '</p>' : '') +
    (profile.bio ? '<p class="profile-bio">' + escapeHTML(profile.bio) + '</p>' : '');
}
function fillProfileForm() {
  for (const [key, value] of Object.entries(profile)) $('#about-form [name="' + key + '"]').value = value;
}
$('#about-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.target);
  const name = data.get('firstName').trim();
  if (!name) {
    $('#about-form [name="firstName"]').setCustomValidity('Enter your first name.');
    $('#about-form [name="firstName"]').reportValidity();
    return;
  }
  for (const key of Object.keys(profile)) profile[key] = data.get(key).trim();
  renderProfile();
  if (saveState()) toast('Profile saved. Your home screen is updated.');
});
$('#about-form [name="firstName"]').addEventListener('input', event => event.target.setCustomValidity(''));

function renderClassCards() {
  $('#class-cards').innerHTML = classes.map((entry, index) => {
    const totalXP = entry.skills.reduce((sum, skill) => sum + skill.xp, 0);
    const active = quests.filter(quest => quest.classId === index).length;
    return `<article class="class-card" style="--color:${entry.color};--tint:${entry.tint}">
      <header class="card-heading"><h2>${escapeHTML(entry.name)}</h2><span class="level-badge">Level ${entry.level}</span></header>
      <p class="class-domain">${entry.domain} domain</p>
      <p class="class-summary">${escapeHTML(entry.summary || 'Grow through the skills you practice and the quests you complete.')}</p>
      <p class="class-stats">${totalXP.toLocaleString()} total XP &middot; ${active} active quest${active === 1 ? '' : 's'} &middot; ${entry.skills.length} skill${entry.skills.length === 1 ? '' : 's'}</p>
      <div class="xp-label"><b>${entry.xp} / ${entry.max} class XP</b><span>${entry.max - entry.xp} to next level</span></div>
      <div class="bar"><span style="width:${entry.xp / entry.max * 100}%"></span></div>
      <h3 class="skills-heading" id="skills-label-${index}">Skills</h3>
      <ul class="skill-list" tabindex="0" aria-labelledby="skills-label-${index}">
        ${entry.skills.map(skill => {
          const progress = skillProgress(skill.xp);
          return `<li class="skill-row"><div class="skill-name"><strong>${escapeHTML(skill.name)}</strong><span>Level ${progress.level}</span></div>
            <div class="xp-label"><span>${progress.xp} / ${progress.next} XP</span><span>${progress.next - progress.xp} to next level</span></div>
            <div class="bar" role="progressbar" aria-label="${escapeHTML(skill.name)} experience" aria-valuenow="${progress.xp}" aria-valuemin="0" aria-valuemax="${progress.next}"><span style="width:${progress.xp / progress.next * 100}%"></span></div></li>`;
        }).join('')}
      </ul>
      <form class="new-skill-form" data-class-id="${index}"><label class="sr-only" for="new-skill-${index}">New skill for ${escapeHTML(entry.name)}</label><input id="new-skill-${index}" name="skillName" placeholder="New skill name" maxlength="50" required><button type="submit" class="small-button">+ Add skill</button></form>
    </article>`;
  }).join('');
}
$('#class-cards').addEventListener('input', event => {
  if (event.target.name === 'skillName') event.target.setCustomValidity('');
});
$('#class-cards').addEventListener('submit', event => {
  const form = event.target.closest('.new-skill-form');
  if (!form) return;
  event.preventDefault();
  const entry = classes[Number(form.dataset.classId)];
  const input = form.querySelector('[name="skillName"]');
  const name = input.value.trim();
  if (!name || entry.skills.some(skill => skill.name.toLowerCase() === name.toLowerCase())) {
    input.setCustomValidity(name ? 'That skill already exists in this class.' : 'Enter a skill name.');
    input.reportValidity();
    return;
  }
  entry.skills.push({ name, xp: 0 });
  const selectedClass = Number($('#class-select').value);
  const selectedSkill = $('#skill-select').value;
  renderClassCards();
  if (classes[selectedClass] === entry) {
    updateSkillOptions();
    $('#skill-select').value = selectedSkill;
  }
  saveState();
  toast(name + ' added to ' + entry.name + '.');
  const list = $('#class-cards .class-card:nth-child(' + (classes.indexOf(entry) + 1) + ') .skill-list');
  list.scrollTop = list.scrollHeight;
  $('#new-skill-' + classes.indexOf(entry)).focus({ preventScroll: true });
});
const classDialog = $('#class-dialog');
function newClassDomain() {
  const category = $('#new-class-category').value;
  return category === 'general' ? $('#general-domain').value : { professional: 'Monetary', artistic: 'Mental', personal: 'Mental' }[category];
}
function updateNewClassDomain() {
  $('#general-domain-field').hidden = $('#new-class-category').value !== 'general';
  $('#new-class-domain').textContent = newClassDomain();
}
$('#new-class-category').addEventListener('change', updateNewClassDomain);
$('#general-domain').addEventListener('change', updateNewClassDomain);
$('#add-class').addEventListener('click', () => {
  $('#class-form').reset();
  $('#class-form [name="className"]').setCustomValidity('');
  updateNewClassDomain();
  classDialog.showModal();
});
$('#cancel-class').addEventListener('click', () => classDialog.close());
$('#class-form [name="className"]').addEventListener('input', event => event.target.setCustomValidity(''));
$('#class-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.target);
  const name = data.get('className').trim();
  const input = $('#class-form [name="className"]');
  if (!name || classes.some(entry => entry.name.toLowerCase() === name.toLowerCase())) {
    input.setCustomValidity(name ? 'A class with this name already exists.' : 'Enter a class name.');
    input.reportValidity();
    return;
  }
  const domain = newClassDomain();
  if (!['Mental','Monetary','Shelter','Physical'].includes(domain)) return;
  classes.push({ name, category: data.get('category'), domain, summary: data.get('summary').trim(), level: 1, xp: 0, max: 500, color: '#637b56', tint: '#e9eee3', skills: [{ name: 'General', xp: 0 }] });
  classDialog.close();
  renderClasses();
  renderClassCards();
  populateQuestClasses();
  updateSkillOptions();
  updateQuestOptions();
  saveState();
  toast(name + ' created with the General skill.');
});

const pages = { home: 'Home', about: 'About', classes: 'Classes', quests: 'Quests' };
function showPage(focus = false) {
  const key = location.hash.replace(/^#\//, '') || 'home';
  const page = Object.hasOwn(pages, key) ? key : 'home';
  closeDetails();
  document.querySelectorAll('.page').forEach(section => { section.hidden = section.id !== 'page-' + page; });
  document.querySelectorAll('.nav a').forEach(link => {
    const active = link.dataset.page === page;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  $('#page-name').textContent = pages[page];
  document.title = 'Quest | ' + pages[page];
  if (page === 'classes') renderClassCards();
  if (page === 'quests') renderQuests();
  if (focus) {
    window.scrollTo(0, 0);
    const heading = page === 'home' ? $('#display-name') : $('#page-' + page + ' h1');
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
}
window.addEventListener('hashchange', () => showPage(true));
fillProfileForm();
renderProfile();
renderClassCards();
if (!storageAvailable) $('#storage-note').textContent = 'Browser storage is unavailable. Changes last until reload.';
showPage();

updateSkillOptions();
updateQuestOptions();
renderHealth();
renderClasses();
renderQuests();
