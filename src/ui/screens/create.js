// Criação do personagem: identidade, posição, aparência, traços e atributos.

import { esc, toast } from '../dom.js';
import { createRng } from '../../core/rng.js';
import { clamp, plural } from '../../core/utils.js';
import { ATTRIBUTE_GROUPS } from '../../data/attributes.js';
import { POSITIONS } from '../../data/positions.js';
import { NATIONS, getNation } from '../../data/nations.js';
import { TRAITS } from '../../data/traits.js';
import { randomName, suggestNickname } from '../../data/names.js';
import { CREATION_GROUP_CAP, CREATION_POINT_POOL, createPlayer, groupPointsSpent } from '../../engine/player.js';
import { ACCESSORIES, BEARD_STYLES, HAIR_COLORS, HAIR_STYLES, SKIN_TONES, icon, pitch, playerSticker } from '../components.js';

const MAX_TRAITS = 2;

const blankForm = () => ({
  seed: Math.floor(Math.random() * 2 ** 31),
  firstName: '',
  lastName: '',
  nickname: '',
  nationality: 'BRA',
  position: 'MEI',
  foot: 'direito',
  height: 178,
  weight: 72,
  appearance: { skin: 3, hair: 'curto', hairColor: '#3d2314', beard: 'nenhuma', accessory: 'nenhum', kitNumber: 10 },
  traits: [],
  groupPoints: {},
});

const form = blankForm();
let formFor = null;

/** Cada carreira nova começa com o formulário limpo. */
function ensureFreshForm(state) {
  const key = state.seed;
  if (formFor === key) return;
  formFor = key;
  Object.assign(form, blankForm());
}

const previewPlayer = () => createPlayer(form, createRng(form.seed));

function randomizeIdentity() {
  const { firstName, lastName } = randomName(createRng(Date.now()), form.nationality);
  form.firstName = firstName;
  form.lastName = lastName;
  form.nickname = suggestNickname(createRng(Date.now() + 7), firstName, lastName);
}

function missingSteps() {
  const missing = [];
  if (form.firstName.trim().length < 2 || form.lastName.trim().length < 2) missing.push('nome e sobrenome');
  if (form.traits.length !== MAX_TRAITS) missing.push(plural(MAX_TRAITS - form.traits.length, 'traço', 'traços'));
  return missing;
}

function selectOptions(list, current) {
  return list
    .map((item) => `<option value="${esc(item.id)}" ${item.id === current ? 'selected' : ''}>${esc(item.label)}</option>`)
    .join('');
}

/**
 * Atualiza só o que depende dos campos de texto, sem redesenhar a tela.
 * Redesenhar trocaria o campo em que a pessoa acabou de clicar.
 */
function refreshLive() {
  const missing = missingSteps();
  const band = document.querySelector('.create__preview .sticker__band');
  if (band) band.textContent = form.nickname || form.firstName || 'Seu nome';
  const name = document.querySelector('[data-live="name"]');
  if (name) name.textContent = `${form.firstName || 'Nome'} ${form.lastName || 'Sobrenome'}`;
  const kit = document.querySelector('[data-live="kit"]');
  if (kit) kit.textContent = String(form.appearance.kitNumber);
  const shirt = document.querySelector('.create__preview .avatar__kit');
  if (shirt) shirt.textContent = String(form.appearance.kitNumber);
  const status = document.querySelector('[data-live="status"]');
  if (status) status.textContent = missing.length ? `Falta: ${missing.join(', ')}.` : 'Tudo pronto.';
  const button = document.querySelector('[data-action="confirm-create"]');
  if (button) button.disabled = missing.length > 0;
}

export default {
  id: 'create',

  render(state) {
    ensureFreshForm(state);
    const player = previewPlayer();
    const spent = groupPointsSpent(form.groupPoints);
    const remaining = CREATION_POINT_POOL - spent;
    const position = POSITIONS.find((item) => item.id === form.position);
    const nation = getNation(form.nationality);
    const missing = missingSteps();
    const ready = missing.length === 0;
    const previewView = {
      ...player,
      nickname: form.nickname || form.firstName || 'Seu nome',
    };

    return `
      <div class="screen">
        <header class="section">
          <h1>Monte o seu jogador</h1>
          <p class="lede">Você começa com 16 anos e sem clube. Tudo o que escolher aqui muda como você joga e como a carreira começa.</p>
        </header>

        <div class="create">
          <aside class="create__preview" aria-label="Prévia da sua figurinha">
            ${playerSticker(previewView, { size: 'lg', meta: `${nation.id} · ${position.name}` })}
            <div class="create__summary">
              <span><strong data-live="name">${esc(form.firstName || 'Nome')} ${esc(form.lastName || 'Sobrenome')}</strong></span>
              <span>${esc(position.name)}, ${esc(nation.name)}, camisa <span class="num" data-live="kit">${esc(form.appearance.kitNumber)}</span></span>
              <span>Overall inicial <strong class="num">${player.overall}</strong></span>
            </div>
            <div class="create__bar">
              <p data-live="status" aria-live="polite">${ready ? 'Tudo pronto.' : `Falta: ${esc(missing.join(', '))}.`}</p>
              <div class="actions">
                <button class="btn btn--quiet" data-action="back-auth">Voltar</button>
                <button class="btn btn--primary" data-action="confirm-create" ${ready ? '' : 'disabled'}>Começar carreira ${icon('arrow-right')}</button>
              </div>
            </div>
          </aside>

          <div class="stack stack--lg">
            <section class="sheet section" aria-labelledby="c-identidade">
              <div class="section__head">
                <h2 id="c-identidade">Identidade</h2>
                <button class="btn btn--sm btn--quiet" data-action="random-name">${icon('shuffle')}Sortear nome</button>
              </div>
              <div class="form-grid">
                <label class="field">
                  <span class="field__label">Nome</span>
                  <input class="input" data-field="firstName" value="${esc(form.firstName)}" maxlength="18" autocomplete="off" placeholder="Ex.: Gabriel" />
                </label>
                <label class="field">
                  <span class="field__label">Sobrenome</span>
                  <input class="input" data-field="lastName" value="${esc(form.lastName)}" maxlength="20" autocomplete="off" placeholder="Ex.: Oliveira" />
                </label>
                <label class="field">
                  <span class="field__label">Nome na camisa</span>
                  <input class="input" data-field="nickname" value="${esc(form.nickname)}" maxlength="18" autocomplete="off" placeholder="Ex.: Gabi" />
                </label>
                <label class="field">
                  <span class="field__label">Número da camisa</span>
                  <input class="input num" data-field="kitNumber" type="number" inputmode="numeric" min="1" max="99" value="${esc(form.appearance.kitNumber)}" />
                </label>
                <label class="field">
                  <span class="field__label">Nacionalidade</span>
                  <select class="select" data-field="nationality">
                    ${NATIONS.map(
                      (item) => `<option value="${item.id}" ${item.id === form.nationality ? 'selected' : ''}>${esc(item.name)} (${item.id})</option>`,
                    ).join('')}
                  </select>
                </label>
                <label class="field">
                  <span class="field__label">Pé preferido</span>
                  <select class="select" data-field="foot">
                    ${['direito', 'esquerdo', 'ambidestro']
                      .map((foot) => `<option value="${foot}" ${foot === form.foot ? 'selected' : ''}>${foot[0].toUpperCase()}${foot.slice(1)}</option>`)
                      .join('')}
                  </select>
                </label>
                <label class="field">
                  <span class="field__label">Altura <output class="num">${form.height} cm</output></span>
                  <input class="range" data-field="height" type="range" min="160" max="203" value="${form.height}" />
                </label>
                <label class="field">
                  <span class="field__label">Peso <output class="num">${form.weight} kg</output></span>
                  <input class="range" data-field="weight" type="range" min="55" max="100" value="${form.weight}" />
                </label>
              </div>
            </section>

            <section class="sheet section" aria-labelledby="c-posicao">
              <h2 id="c-posicao">Posição</h2>
              <div class="position-map">${pitch({ mode: 'positions', position: form.position, label: `Sua posição no campo: ${position.name}` })}</div>
              <div class="segmented" role="group" aria-label="Posição">
                ${POSITIONS.map(
                  (item) => `
                  <button class="segmented__item" aria-pressed="${item.id === form.position}" data-action="pick-position" data-position="${item.id}">
                    <strong>${esc(item.short)}</strong><span>${esc(item.name)}</span>
                  </button>`,
                ).join('')}
              </div>
              <p class="lede">${esc(position.description)}</p>
            </section>

            <section class="sheet section" aria-labelledby="c-aparencia">
              <h2 id="c-aparencia">Aparência</h2>
              <div class="field">
                <span class="field__label">Tom de pele</span>
                <div class="swatches" role="group" aria-label="Tom de pele">
                  ${SKIN_TONES.map(
                    (tone, index) => `
                    <button class="swatch" style="--swatch:${tone}" aria-pressed="${index === form.appearance.skin}"
                      data-action="pick-skin" data-index="${index}" aria-label="Tom de pele ${index + 1}"></button>`,
                  ).join('')}
                </div>
              </div>
              <div class="field">
                <span class="field__label">Cor do cabelo</span>
                <div class="swatches" role="group" aria-label="Cor do cabelo">
                  ${HAIR_COLORS.map(
                    (color) => `
                    <button class="swatch" style="--swatch:${color.value}" aria-pressed="${color.value === form.appearance.hairColor}"
                      data-action="pick-hair-color" data-color="${color.value}" aria-label="${esc(color.label)}"></button>`,
                  ).join('')}
                </div>
              </div>
              <div class="form-grid">
                <label class="field">
                  <span class="field__label">Cabelo</span>
                  <select class="select" data-field="hair">${selectOptions(HAIR_STYLES, form.appearance.hair)}</select>
                </label>
                <label class="field">
                  <span class="field__label">Barba</span>
                  <select class="select" data-field="beard">${selectOptions(BEARD_STYLES, form.appearance.beard)}</select>
                </label>
                <label class="field">
                  <span class="field__label">Acessório</span>
                  <select class="select" data-field="accessory">${selectOptions(ACCESSORIES, form.appearance.accessory)}</select>
                </label>
              </div>
            </section>

            <section class="sheet section" aria-labelledby="c-tracos">
              <div class="section__head">
                <h2 id="c-tracos">Traços</h2>
                <p><span class="num">${form.traits.length}</span> de <span class="num">${MAX_TRAITS}</span> escolhidos</p>
              </div>
              <ul class="traitpick">
                ${TRAITS.map((trait) => {
                  const active = form.traits.includes(trait.id);
                  const blocked = !active && form.traits.length >= MAX_TRAITS;
                  return `<li>
                    <button class="option" aria-pressed="${active}" data-action="toggle-trait" data-trait="${trait.id}" ${blocked ? 'disabled' : ''}>
                      <span class="option__icon">${icon(trait.icon)}</span>
                      <span class="option__text">
                        <span class="option__title">${esc(trait.name)}</span>
                        <span class="option__desc">${esc(trait.description)}</span>
                        <span class="option__effects"><span>${trait.category === 'jogo' ? 'Em campo' : 'Fora de campo'}</span></span>
                      </span>
                      <span class="option__check">${icon('check')}</span>
                    </button>
                  </li>`;
                }).join('')}
              </ul>
            </section>

            <section class="sheet section" aria-labelledby="c-pontos">
              <div class="section__head">
                <h2 id="c-pontos">Pontos de atributo</h2>
                <p class="budget ${remaining === 0 ? 'is-done' : ''}"><strong>${remaining}</strong> de ${CREATION_POINT_POOL} livres</p>
              </div>
              <p class="lede">Cada ponto sobe todos os atributos da área. Máximo de ${CREATION_GROUP_CAP} por área.</p>
              <ul class="alloc">
                ${ATTRIBUTE_GROUPS.filter((group) => (group.goalkeeperOnly ? form.position === 'GOL' : true))
                  .map((group) => {
                    const value = clamp(form.groupPoints[group.id] ?? 0, 0, CREATION_GROUP_CAP);
                    return `
                      <li class="alloc__row">
                        <span class="alloc__label">${icon(group.icon)}${esc(group.label)}</span>
                        <span class="alloc__controls">
                          <button class="stepbtn" data-action="alloc" data-group="${group.id}" data-delta="-1" ${value <= 0 ? 'disabled' : ''} aria-label="Tirar ponto de ${esc(group.label)}">${icon('minus')}</button>
                          <span class="pips" role="img" aria-label="${value} de ${CREATION_GROUP_CAP} pontos em ${esc(group.label)}">
                            ${Array.from({ length: CREATION_GROUP_CAP }, (_, index) => `<span class="${index < value ? 'is-on' : ''}"></span>`).join('')}
                          </span>
                          <button class="stepbtn" data-action="alloc" data-group="${group.id}" data-delta="1"
                            ${value >= CREATION_GROUP_CAP || remaining <= 0 ? 'disabled' : ''} aria-label="Adicionar ponto em ${esc(group.label)}">${icon('plus')}</button>
                        </span>
                      </li>`;
                  })
                  .join('')}
              </ul>
            </section>
          </div>
        </div>

      </div>`;
  },

  onInput(ctx, dataset, event) {
    const field = dataset.field;
    const value = event.target.value;
    switch (field) {
      case 'firstName':
      case 'lastName':
      case 'nickname':
        form[field] = value;
        refreshLive();
        return;
      case 'kitNumber':
        form.appearance.kitNumber = clamp(Number(value) || 10, 1, 99);
        refreshLive();
        return;
      case 'nationality':
        form.nationality = value;
        break;
      case 'foot':
        form.foot = value;
        break;
      case 'height':
      case 'weight': {
        form[field] = Number(value);
        // Durante o arrasto só atualiza o número, para não interromper o gesto.
        const output = event.target.closest('.field')?.querySelector('output');
        if (output) output.textContent = `${value} ${field === 'height' ? 'cm' : 'kg'}`;
        if (event.type === 'change') ctx.rerender();
        return;
      }
      case 'hair':
      case 'beard':
      case 'accessory':
        form.appearance[field] = value;
        break;
      default:
        return;
    }
    ctx.rerender();
  },

  actions: {
    'pick-position': (ctx, dataset) => {
      form.position = dataset.position;
      if (form.position !== 'GOL') delete form.groupPoints.goleiro;
      ctx.rerender();
    },
    'pick-skin': (ctx, dataset) => {
      form.appearance.skin = Number(dataset.index);
      ctx.rerender();
    },
    'pick-hair-color': (ctx, dataset) => {
      form.appearance.hairColor = dataset.color;
      ctx.rerender();
    },
    'toggle-trait': (ctx, dataset) => {
      const id = dataset.trait;
      if (form.traits.includes(id)) form.traits = form.traits.filter((item) => item !== id);
      else if (form.traits.length < MAX_TRAITS) form.traits.push(id);
      ctx.rerender();
    },
    alloc: (ctx, dataset) => {
      const group = dataset.group;
      const delta = Number(dataset.delta);
      const current = clamp(form.groupPoints[group] ?? 0, 0, CREATION_GROUP_CAP);
      const spent = groupPointsSpent(form.groupPoints);
      if (delta > 0 && (spent >= CREATION_POINT_POOL || current >= CREATION_GROUP_CAP)) return;
      if (delta < 0 && current <= 0) return;
      form.groupPoints[group] = current + delta;
      ctx.rerender();
    },
    'random-name': (ctx) => {
      randomizeIdentity();
      ctx.rerender();
    },
    'back-auth': (ctx) => {
      ctx.game.setScreen('auth');
    },
    'confirm-create': (ctx) => {
      const missing = missingSteps();
      if (missing.length) {
        toast(`Falta: ${missing.join(', ')}.`, 'warn');
        return;
      }
      ctx.game.rng = createRng(form.seed);
      ctx.game.createCareer({
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        nickname: (form.nickname || form.firstName).trim(),
      });
      ctx.save.schedule(300);
    },
  },
};
