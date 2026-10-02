// Criação do personagem: nome, posição, aparência, traços e atributos.

import { esc, toast } from '../dom.js';
import { createRng } from '../../core/rng.js';
import { clamp } from '../../core/utils.js';
import { ATTRIBUTE_GROUPS } from '../../data/attributes.js';
import { POSITIONS } from '../../data/positions.js';
import { NATIONS, getNation } from '../../data/nations.js';
import { TRAITS } from '../../data/traits.js';
import { randomName, suggestNickname } from '../../data/names.js';
import {
  CREATION_GROUP_CAP,
  CREATION_POINT_POOL,
  createPlayer,
  groupPointsSpent,
} from '../../engine/player.js';
import {
  ACCESSORIES,
  BEARD_STYLES,
  HAIR_COLORS,
  HAIR_STYLES,
  SKIN_TONES,
  attributeGrid,
  avatarSvg,
  overallBadge,
} from '../components.js';

const MAX_TRAITS = 2;

const form = {
  seed: Math.floor(Math.random() * 2 ** 31),
  firstName: '',
  lastName: '',
  nickname: '',
  nationality: 'BRA',
  position: 'MEI',
  foot: 'direito',
  height: 178,
  weight: 72,
  appearance: { skin: 3, hair: 'curto', hairColor: '#2b1d14', beard: 'nenhuma', accessory: 'nenhum', kitNumber: 10 },
  traits: [],
  groupPoints: {},
};

function previewPlayer() {
  return createPlayer(form, createRng(form.seed));
}

function randomizeIdentity() {
  const { firstName, lastName } = randomName(createRng(Date.now()), form.nationality);
  form.firstName = firstName;
  form.lastName = lastName;
  form.nickname = suggestNickname(createRng(Date.now() + 7), firstName, lastName);
}

export default {
  id: 'create',

  render(state, ctx) {
    const player = previewPlayer();
    const spent = groupPointsSpent(form.groupPoints);
    const remaining = CREATION_POINT_POOL - spent;
    const position = POSITIONS.find((item) => item.id === form.position);
    const ready = form.firstName.trim().length >= 2 && form.lastName.trim().length >= 2 && form.traits.length === MAX_TRAITS;

    return `
      <div class="screen screen--create">
        <header class="screen__head">
          <h1>Monte o seu jogador</h1>
          <p class="muted">Tudo aqui define como você joga e como a sua carreira começa.</p>
        </header>

        <section class="preview">
          <div class="preview__avatar">${avatarSvg(form.appearance, 128)}</div>
          <div class="preview__info">
            <h2>${esc(form.firstName || 'Nome')} ${esc(form.lastName || 'Sobrenome')}</h2>
            <p>${esc(getNation(form.nationality).flag)} ${esc(getNation(form.nationality).name)} ·
               ${esc(position.name)} · 16 anos · camisa ${esc(form.appearance.kitNumber)}</p>
            <p class="muted">${esc(position.description)}</p>
          </div>
          ${overallBadge(player.overall, { label: position.short, size: 'lg' })}
        </section>

        <!-- IDENTIDADE -->
        <section class="card">
          <h3>1. Identidade</h3>
          <div class="grid grid--2">
            <label class="field">
              <span>Nome</span>
              <input data-field="firstName" value="${esc(form.firstName)}" maxlength="18" placeholder="Ex: Gabriel" />
            </label>
            <label class="field">
              <span>Sobrenome</span>
              <input data-field="lastName" value="${esc(form.lastName)}" maxlength="20" placeholder="Ex: Oliveira" />
            </label>
            <label class="field">
              <span>Nome na camisa</span>
              <input data-field="nickname" value="${esc(form.nickname)}" maxlength="18" placeholder="Ex: Gabi" />
            </label>
            <label class="field">
              <span>Número</span>
              <input data-field="kitNumber" type="number" min="1" max="99" value="${esc(form.appearance.kitNumber)}" />
            </label>
            <label class="field">
              <span>Nacionalidade</span>
              <select data-field="nationality">
                ${NATIONS.map(
                  (nation) =>
                    `<option value="${nation.id}" ${nation.id === form.nationality ? 'selected' : ''}>${esc(nation.flag)} ${esc(nation.name)}</option>`,
                ).join('')}
              </select>
            </label>
            <label class="field">
              <span>Pé preferido</span>
              <select data-field="foot">
                ${['direito', 'esquerdo', 'ambidestro']
                  .map((foot) => `<option value="${foot}" ${foot === form.foot ? 'selected' : ''}>${foot}</option>`)
                  .join('')}
              </select>
            </label>
            <label class="field">
              <span>Altura: ${form.height} cm</span>
              <input data-field="height" type="range" min="160" max="203" value="${form.height}" />
            </label>
            <label class="field">
              <span>Peso: ${form.weight} kg</span>
              <input data-field="weight" type="range" min="55" max="100" value="${form.weight}" />
            </label>
          </div>
          <button class="btn btn--ghost" data-action="random-name">🎲 Sortear nome</button>
        </section>

        <!-- POSIÇÃO -->
        <section class="card">
          <h3>2. Posição</h3>
          <div class="pos-grid">
            ${POSITIONS.map(
              (item) => `
              <button class="pos ${item.id === form.position ? 'is-active' : ''}" data-action="pick-position" data-position="${item.id}">
                <strong>${esc(item.short)}</strong>
                <span>${esc(item.name)}</span>
              </button>`,
            ).join('')}
          </div>
          <p class="muted">${esc(position.description)}</p>
        </section>

        <!-- APARÊNCIA -->
        <section class="card">
          <h3>3. Aparência</h3>
          <div class="field">
            <span>Tom de pele</span>
            <div class="swatches">
              ${SKIN_TONES.map(
                (tone, index) => `
                <button class="swatch ${index === form.appearance.skin ? 'is-active' : ''}"
                        style="background:${tone}" data-action="pick-skin" data-index="${index}"
                        aria-label="Tom de pele ${index + 1}"></button>`,
              ).join('')}
            </div>
          </div>
          <div class="field">
            <span>Cor do cabelo</span>
            <div class="swatches">
              ${HAIR_COLORS.map(
                (color) => `
                <button class="swatch ${color === form.appearance.hairColor ? 'is-active' : ''}"
                        style="background:${color}" data-action="pick-hair-color" data-color="${color}"
                        aria-label="Cor de cabelo"></button>`,
              ).join('')}
            </div>
          </div>
          <div class="grid grid--3">
            <label class="field">
              <span>Cabelo</span>
              <select data-field="hair">
                ${HAIR_STYLES.map(
                  (style) => `<option value="${style.id}" ${style.id === form.appearance.hair ? 'selected' : ''}>${esc(style.label)}</option>`,
                ).join('')}
              </select>
            </label>
            <label class="field">
              <span>Barba</span>
              <select data-field="beard">
                ${BEARD_STYLES.map(
                  (style) => `<option value="${style.id}" ${style.id === form.appearance.beard ? 'selected' : ''}>${esc(style.label)}</option>`,
                ).join('')}
              </select>
            </label>
            <label class="field">
              <span>Acessório</span>
              <select data-field="accessory">
                ${ACCESSORIES.map(
                  (style) => `<option value="${style.id}" ${style.id === form.appearance.accessory ? 'selected' : ''}>${esc(style.label)}</option>`,
                ).join('')}
              </select>
            </label>
          </div>
        </section>

        <!-- TRAÇOS -->
        <section class="card">
          <h3>4. Traços <small class="muted">(escolha ${MAX_TRAITS})</small></h3>
          <div class="trait-grid">
            ${TRAITS.map((trait) => {
              const active = form.traits.includes(trait.id);
              const blocked = !active && form.traits.length >= MAX_TRAITS;
              return `
                <button class="trait ${active ? 'is-active' : ''}" data-action="toggle-trait" data-trait="${trait.id}" ${blocked ? 'disabled' : ''}>
                  <span class="trait__icon">${esc(trait.icon)}</span>
                  <strong>${esc(trait.name)}</strong>
                  <small>${esc(trait.description)}</small>
                  <em class="trait__tag">${trait.category === 'jogo' ? 'Em campo' : 'Fora de campo'}</em>
                </button>`;
            }).join('')}
          </div>
        </section>

        <!-- ATRIBUTOS -->
        <section class="card">
          <h3>5. Distribua seus pontos</h3>
          <p class="points ${remaining === 0 ? 'is-done' : ''}">
            Pontos restantes: <strong>${remaining}</strong> / ${CREATION_POINT_POOL}
            <small class="muted">(máx. ${CREATION_GROUP_CAP} por área)</small>
          </p>
          <div class="alloc">
            ${ATTRIBUTE_GROUPS.filter((group) => (group.goalkeeperOnly ? form.position === 'GOL' : true))
              .map((group) => {
                const value = clamp(form.groupPoints[group.id] ?? 0, 0, CREATION_GROUP_CAP);
                return `
                  <div class="alloc__row">
                    <span class="alloc__label">${esc(group.icon)} ${esc(group.label)}</span>
                    <div class="alloc__controls">
                      <button class="btn btn--mini" data-action="alloc" data-group="${group.id}" data-delta="-1" ${value <= 0 ? 'disabled' : ''}>−</button>
                      <strong class="alloc__value">${value}</strong>
                      <button class="btn btn--mini" data-action="alloc" data-group="${group.id}" data-delta="1"
                        ${value >= CREATION_GROUP_CAP || remaining <= 0 ? 'disabled' : ''}>+</button>
                    </div>
                  </div>`;
              })
              .join('')}
          </div>
          <details class="details">
            <summary>Ver atributos detalhados</summary>
            <div class="attr-wrap">${attributeGrid(player)}</div>
          </details>
        </section>

        <div class="sticky-actions">
          <button class="btn btn--ghost" data-action="back-auth">Voltar</button>
          <button class="btn btn--primary" data-action="confirm-create" ${ready ? '' : 'disabled'}>
            ${ready ? 'Começar carreira ⚽' : 'Preencha nome e escolha 2 traços'}
          </button>
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
        return { silent: true };
      case 'nationality':
        form.nationality = value;
        break;
      case 'foot':
        form.foot = value;
        break;
      case 'height':
        form.height = Number(value);
        break;
      case 'weight':
        form.weight = Number(value);
        break;
      case 'kitNumber':
        form.appearance.kitNumber = clamp(Number(value) || 10, 1, 99);
        return { silent: true };
      case 'hair':
      case 'beard':
      case 'accessory':
        form.appearance[field] = value;
        break;
      default:
        return { silent: true };
    }
    ctx.rerender();
    return {};
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
      if (form.traits.length !== MAX_TRAITS) {
        toast(`Escolha ${MAX_TRAITS} traços.`, 'warn');
        return;
      }
      if (!form.firstName.trim() || !form.lastName.trim()) {
        toast('Preencha nome e sobrenome.', 'warn');
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
