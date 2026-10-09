// Motor de partida interativo.
//
// A partida é uma máquina de estados: `advance()` avança o relógio até surgir
// um lance que exige a sua decisão, e `choose()` resolve essa decisão.
// Entre os lances, o motor simula o resto do jogo (gols dos dois times).

import { clamp, average, logistic, round } from '../core/utils.js';
import { getClub, squadRating, getLeague } from '../data/clubs.js';
import { getPosition } from '../data/positions.js';
import { matchModifier } from '../data/traits.js';
import { randomFullName } from '../data/names.js';
import { MOMENTS } from '../data/matchMoments.js';
import { MATCH_EVENTS } from '../data/matchEvents.js';
import { effectiveAttributes, playerOverall } from './overall.js';

export const PLAYER_ROLE = {
  STARTER: 'titular',
  SUB: 'reserva',
  BENCH: 'banco',
  OUT: 'fora',
};

const MOMENT_INDEX = new Map([...MOMENTS, ...MATCH_EVENTS].map((moment) => [moment.id, moment]));

/** Lance ou evento pelo id (para reconectar o save com os dados). */
export const findMoment = (id) => MOMENT_INDEX.get(id) ?? null;

/** Texto que pode ter variações: sorteia uma. */
function pickText(value, rng) {
  if (Array.isArray(value)) return rng ? rng.pick(value) : value[0];
  return value ?? '';
}

// Na chuva, passe, drible e defesa de goleiro ficam mais difíceis.
const RAIN_MODS = new Set(['pass', 'dribble', 'save']);
const RAIN_PENALTY = 4;
// Eventos fora da bola por jogo, no máximo (para não travar a partida).
const MAX_OFF_BALL = 3;

/** Expectativa de gols de um time contra outro. */
function expectedGoals(attackRating, defenseRating) {
  const diff = attackRating - defenseRating;
  return clamp(1.25 + diff * 0.055, 0.25, 3.8);
}

function clubName(clubId) {
  return getClub(clubId)?.name ?? 'Time Desconhecido';
}

/** Cria o estado de uma nova partida. */
export function createMatch({ player, clubId, opponentId, competition, isHome, role, rng, round: roundNumber = 1 }) {
  const position = getPosition(player.position);
  const teamRating = squadRating(clubId);
  const opponentRating = squadRating(opponentId);
  const homeBoost = isHome ? 2 : -2;

  const teammates = Array.from({ length: 4 }, () => randomFullName(rng, getClub(clubId)?.nation ?? player.nationality));

  const playing = role === PLAYER_ROLE.STARTER || role === PLAYER_ROLE.SUB;
  const entryMinute = role === PLAYER_ROLE.SUB ? rng.int(55, 72) : 0;

  const baseMoments = playing ? clamp(Math.round(position.involvement * rng.int(3, 4)), 3, 6) : 0;
  const totalMoments = role === PLAYER_ROLE.SUB ? Math.max(2, Math.round(baseMoments * 0.5)) : baseMoments;

  // Clima e peso do jogo, anunciados no começo como eventos.
  const queue = [];
  const conditions = { skill: 0 };
  if (rng.chance(0.12)) {
    conditions.rain = true;
    queue.push('chuva');
  }
  // Mata-mata de copa ou adversário muito mais forte: às vezes bate o nervoso.
  const knockout = competition?.id === 'copa' || competition?.id === 'continental';
  const giant = opponentRating >= teamRating + 6;
  if (role === PLAYER_ROLE.STARTER && (knockout || giant) && rng.chance(knockout ? 0.45 : 0.25)) queue.push('jogo_grande');

  return {
    id: `${clubId}_${opponentId}_${roundNumber}`,
    competition,
    round: roundNumber,
    clubId,
    opponentId,
    clubName: clubName(clubId),
    opponentName: clubName(opponentId),
    isHome,
    role,
    zone: position.zone,
    teamRating: teamRating + homeBoost,
    opponentRating: opponentRating - homeBoost * 0.5,
    teammates,
    score: { team: 0, opponent: 0 },
    minute: 0,
    entryMinute,
    minutesPlayed: 0,
    onField: role === PLAYER_ROLE.STARTER,
    stamina: clamp(55 + player.life.fitness * 0.45, 40, 100),
    rating: 6.2,
    ratingPoints: 0,
    ratingEvents: 0,
    stats: { goals: 0, assists: 0, saves: 0, tackles: 0, shots: 0, yellowCards: 0, redCards: 0 },
    timeline: [],
    goals: [],
    momentsPlayed: 0,
    totalMoments,
    usedMomentIds: [],
    // Lances do jogo anterior aparecem um pouco menos (memória leve).
    recent: [...(player.recentMoments ?? [])],
    queue,
    conditions,
    xg: { team: 1, opponent: 1 },
    // Um evento fora da bola sorteado no meio do jogo, em 45% das partidas.
    contextMinute: rng.chance(0.45) ? rng.int(25, 82) : null,
    offBall: 0,
    pending: null,
    pendingPenalty: false,
    finished: false,
    sentOff: false,
    substituted: false,
    injured: false,
    lifeDelta: { morale: 0, discipline: 0, fame: 0, managerRelation: 0, fanRelation: 0, happiness: 0, reputation: 0 },
  };
}

/**
 * Nota do jogador: média da qualidade das decisões, não soma.
 * Assim quem participa de muitos lances não infla a nota automaticamente.
 */
export function computeRating(match) {
  const average = match.ratingEvents ? match.ratingPoints / match.ratingEvents : 0;
  // Defensores e goleiros brilham "não errando", então ganham um piso melhor
  // e são premiados pelo volume de desarmes e defesas.
  const zoneBonus = { defesa: 0.2, gol: 0.12, meio: 0.05, ataque: 0 }[match.zone] ?? 0;
  const raw =
    6.2 +
    zoneBonus +
    average * 1.35 +
    match.stats.goals * 0.25 +
    match.stats.assists * 0.15 +
    match.stats.saves * 0.08 +
    match.stats.tackles * 0.09;
  return clamp(raw, 1, 10);
}

function addRatingPoints(match, value) {
  match.ratingPoints += value;
  match.ratingEvents += 1;
  match.rating = round(computeRating(match), 1);
}

function log(match, text, type = 'info', icon = null, minute = match.minute, mark = null) {
  match.timeline.push({ minute, text, type, icon, ...(mark ? { mark } : {}) });
}

/** Sobrenome curto para a súmula do placar ("Silva 34'"). */
const shortName = (name = '') => name.trim().split(/\s+/).pop();

function fillText(template, match, player) {
  return String(template ?? '')
    .replaceAll('{minute}', String(match.minute))
    .replaceAll('{opponent}', match.opponentName)
    .replaceAll('{club}', match.clubName)
    .replaceAll('{teammate}', match.teammates[0])
    .replaceAll('{player}', player.nickname);
}

/** É o jogador quem bate as faltas / pênaltis? */
function isSetPieceTaker(player) {
  const attrs = effectiveAttributes(player);
  return attrs.freeKick >= 62 || player.traits.includes('canhota_magica');
}

function isPenaltyTaker(player) {
  const attrs = effectiveAttributes(player);
  return attrs.penalties >= 60 || ['ATA', 'SA', 'MEI', 'PON'].includes(player.position);
}

/** Sorteia o próximo lance compatível com o contexto atual. */
function pickMoment(match, player, rng) {
  const lateGame = match.minute >= 76;
  const tired = match.stamina <= 45;

  const candidates = MOMENTS.filter((moment) => {
    if (!moment.zones.includes(match.zone)) return false;
    if (moment.lateGameOnly && !lateGame) return false;
    if (moment.requiresTired && !tired) return false;
    if (moment.requiresLosing && match.score.team >= match.score.opponent) return false;
    if (moment.requiresWinning && match.score.team <= match.score.opponent) return false;
    if (moment.positions && !moment.positions.includes(player.position)) return false;
    if (moment.requiresSetPiece && !isSetPieceTaker(player)) return false;
    if (moment.requiresPenalty && !isPenaltyTaker(player)) return false;
    if (match.usedMomentIds.includes(moment.id) && !moment.requiresPenalty) return false;
    return true;
  });

  const pool = candidates.length ? candidates : MOMENTS.filter((moment) => moment.zones.includes(match.zone));
  return rng.weighted(pool, (moment) => {
    let weight = moment.weight ?? 5;
    if (moment.requiresTired && tired) weight *= 3;
    if (moment.lateGameOnly && lateGame) weight *= 2.5;
    if (moment.tag === 'penalti') weight *= 0.6;
    if (match.recent?.includes(moment.id)) weight *= 0.7;
    // O jogo tende a procurar quem sabe jogar: um meia técnico recebe mais
    // lances de passe e drible do que disputas aéreas. Sem zerar nenhum lance:
    // às vezes a bola cai na sua cabeça mesmo.
    const bestChance = Math.max(...moment.options.map((option) => successChance(player, option, match)));
    weight *= 0.35 + bestChance * 1.3;
    return weight;
  });
}

/**
 * Dificuldade extra por tipo de desfecho: gol é a coisa mais difícil do
 * futebol, então finalizar vale bem mais e falha bem mais do que tocar a bola.
 */
const KIND_PENALTY = { goal: 11, assist: 8 };

/** Chance de sucesso de uma opção, de 5% a 95%. */
export function successChance(player, option, match) {
  // Eventos fora da bola: chance fixa (o VAR não liga para atributo) ou um
  // teste de vida (carisma para separar uma briga).
  if (typeof option.chance === 'number') return option.chance;
  if (option.lifeCheck) {
    const value = player.life[option.lifeCheck] ?? 50;
    return clamp(logistic(value - 50 - (option.difficulty ?? 0), 0, 14), 0.08, 0.92);
  }
  const attrs = effectiveAttributes(player);
  const skill = average((option.attrs ?? ['composure']).map((id) => attrs[id] ?? 40));
  const kindPenalty = KIND_PENALTY[option.success?.kind] ?? 0;
  const traitBonus = option.mod ? matchModifier(player.traits, option.mod) * 55 : 0;
  const clutchBonus = match.minute >= 80 ? matchModifier(player.traits, 'clutch') * 20 : 0;
  const staminaPenalty = (1 - match.stamina / 100) * 16;
  const condition = (player.life.fitness - 60) * 0.1 + (player.life.morale - 50) * 0.05 + (player.life.happiness - 50) * 0.03;

  // Condições do jogo: confiança ou nervosismo, chuva.
  const mood = match.conditions?.skill ?? 0;
  const rain = match.conditions?.rain && !match.conditions.rainProof && RAIN_MODS.has(option.mod) ? RAIN_PENALTY : 0;

  const effective = skill + traitBonus + clutchBonus + condition + mood - rain - staminaPenalty - (option.difficulty ?? 0) - kindPenalty;
  // O -4 e o spread largo evitam dois extremos chatos: o iniciante que nunca
  // acerta nada e o craque que nunca erra.
  const probability = logistic(effective - (match.opponentRating - 4), 0, 11);
  return clamp(probability, 0.05, 0.95);
}

function concede(match, reason, minute = match.minute) {
  match.score.opponent += 1;
  (match.goals ??= []).push({ side: 'opponent', minute, scorer: null });
  log(match, `Gol do ${match.opponentName}. ${reason}`, 'bad', 'soccer-ball', minute, 'goal-against');
}

function teamScores(match, text, minute = match.minute, scorer = null, mine = false) {
  match.score.team += 1;
  (match.goals ??= []).push({ side: 'team', minute, scorer: scorer ? shortName(scorer) : null, mine });
  log(match, `Gol do ${match.clubName}. ${text}`, 'good', 'soccer-ball', minute, 'goal-for');
}

/** Simula o que acontece no jogo fora dos seus lances. */
function simulateBackground(match, player, rng, minutes) {
  if (minutes <= 0) return;
  const share = minutes / 90;
  const playerBoost = match.onField ? (playerOverall(player) - match.teamRating) * 0.02 : -0.05;

  const teamXg = expectedGoals(match.teamRating, match.opponentRating) * share * (1 + playerBoost) * (match.xg?.team ?? 1);
  const oppXg = expectedGoals(match.opponentRating, match.teamRating) * share * (match.xg?.opponent ?? 1);

  // O gol acontece em algum minuto dentro do trecho simulado, não no início dele.
  const goalMinute = () => clamp(match.minute + rng.int(1, Math.max(1, Math.round(minutes))), 1, 90);
  if (rng.chance(clamp(teamXg, 0, 0.9))) {
    const scorer = rng.pick(match.teammates);
    teamScores(match, `${scorer} finaliza bem.`, goalMinute(), scorer);
  }
  if (rng.chance(clamp(oppXg, 0, 0.9))) {
    concede(match, 'Falha coletiva na marcação.', goalMinute());
  }
}

/** Monta o lance (ou evento) pendente, com um dos textos sorteado. */
function present(match, player, moment, rng, { offBall = false } = {}) {
  if (offBall) match.offBall += 1;
  match.pending = {
    id: moment.id,
    title: moment.title,
    text: fillText(pickText(moment.text, rng), match, player),
    tag: moment.tag ?? (offBall ? 'fora' : 'jogo'),
    offBall,
    options: moment.options.map((option, index) => ({
      index,
      label: option.label,
      hint: option.hint ?? '',
      chance: successChance(player, option, match),
      sure: option.chance === 1,
    })),
    raw: moment,
  };
  return match.pending;
}

/** Sorteia um evento fora da bola que combine com o momento do jogo. */
function pickContextEvent(match, player, rng) {
  const diff = match.score.team - match.score.opponent;
  const pool = MATCH_EVENTS.filter((event) => {
    if (event.trigger !== 'context') return false;
    const when = event.when ?? {};
    if (when.minMinute && match.minute < when.minMinute) return false;
    if (when.close && Math.abs(diff) > 1) return false;
    if (when.winning && diff <= 0) return false;
    if (when.notWinning && diff > 0) return false;
    if (when.cheered && !(match.rating >= 7 || player.life.fanRelation >= 65)) return false;
    if (when.booed && !(match.rating < 6 || player.life.fanRelation < 35)) return false;
    if (when.notCaptain && match.conditions.captain) return false;
    return true;
  });
  return pool.length ? rng.weighted(pool) : null;
}

/**
 * Avança a partida. Retorna:
 *   { type: 'moment', moment }  -> precisa da sua decisão
 *   { type: 'finished', report } -> jogo encerrado
 */
export function advance(match, player, rng) {
  if (match.finished) return { type: 'finished' };
  if (match.pending) return { type: 'moment', moment: match.pending };

  // Jogador que começa no banco entra no minuto sorteado.
  if (!match.onField && !match.substituted && !match.sentOff && match.role === PLAYER_ROLE.SUB) {
    if (match.minute < match.entryMinute) {
      const step = match.entryMinute - match.minute;
      simulateBackground(match, player, rng, step);
      match.minute = match.entryMinute;
      match.onField = true;
      log(match, `Você entra em campo no lugar de ${rng.pick(match.teammates)}.`, 'info', 'arrow-right');
    }
  }

  const stillActive = match.onField && !match.sentOff && !match.substituted && !match.injured;

  // Eventos na fila (chuva no começo, VAR e comemoração depois do seu gol,
  // pênalti que você sofreu) acontecem na hora, sem o relógio andar.
  while (stillActive && match.queue?.length) {
    const queued = findMoment(match.queue.shift());
    if (!queued) continue;
    const ball = MOMENTS.includes(queued);
    if (!ball && match.offBall >= MAX_OFF_BALL) continue;
    return { type: 'moment', moment: present(match, player, queued, rng, { offBall: !ball }) };
  }

  const hasMomentsLeft = match.momentsPlayed < match.totalMoments;

  if (stillActive && hasMomentsLeft) {
    const remainingMoments = match.totalMoments - match.momentsPlayed;
    const remainingMinutes = Math.max(1, 90 - match.minute);
    const step = clamp(Math.round(remainingMinutes / (remainingMoments + 1)) + rng.int(-3, 3), 2, 30);

    simulateBackground(match, player, rng, step);
    match.minute = clamp(match.minute + step, 1, 89);
    if (match.onField) match.minutesPlayed += step;
    match.stamina = clamp(match.stamina - step * 0.35 * (1 + matchModifier(player.traits, 'staminaDrain')), 0, 100);

    // Um evento fora da bola sorteado para algum momento do jogo.
    if (match.contextMinute && match.minute >= match.contextMinute && match.offBall < MAX_OFF_BALL) {
      match.contextMinute = null;
      const event = pickContextEvent(match, player, rng);
      if (event) return { type: 'moment', moment: present(match, player, event, rng, { offBall: true }) };
    }

    const moment = pickMoment(match, player, rng);
    match.usedMomentIds.push(moment.id);
    match.momentsPlayed += 1;
    return { type: 'moment', moment: present(match, player, moment, rng) };
  }

  // Nada mais a decidir: simula o resto e encerra.
  const remaining = 90 - match.minute;
  simulateBackground(match, player, rng, remaining);
  if (match.onField && !match.substituted && !match.sentOff) match.minutesPlayed += remaining;
  match.minute = 90;
  finish(match, player, rng);
  return { type: 'finished', report: match.report };
}

/** Aplica o resultado de uma escolha sua em um lance. */
export function choose(match, player, optionIndex, rng) {
  if (!match.pending) return null;
  const moment = match.pending.raw;
  const option = moment.options[optionIndex];
  if (!option) return null;

  const chance = successChance(player, option, match);
  const success = rng.chance(chance);
  const outcome = success ? option.success : option.failure;
  const offBall = Boolean(match.pending.offBall);
  match.stamina = clamp(match.stamina - (option.stamina ?? 2), 0, 100);
  match.pending = null;

  const resolution = {
    success,
    chance,
    offBall,
    text: fillText(pickText(outcome?.text, rng), match, player),
    kind: outcome?.kind ?? 'neutral',
    extras: [],
  };

  // Evento fora da bola mexe pouco na nota e não conta como lance.
  if (offBall) {
    match.ratingPoints += outcome?.rating ?? 0;
    match.rating = round(computeRating(match), 1);
  } else {
    addRatingPoints(match, outcome?.rating ?? 0);
  }
  log(match, resolution.text, success ? 'good' : 'bad', success ? 'check' : 'x');

  const before = { ...match.score };
  applyKind(match, player, resolution.kind, rng, resolution);
  resolution.minute = match.minute;
  resolution.teamGoal = match.score.team > before.team;
  resolution.opponentGoal = match.score.opponent > before.opponent;

  // Depois do seu gol: às vezes o VAR chama, às vezes é hora de comemorar.
  if (resolution.kind === 'goal' && resolution.teamGoal) {
    if (rng.chance(0.12)) match.queue.push('var_gol');
    else if (rng.chance(0.4)) match.queue.push('comemoracao');
  }

  // Efeitos extras declarados no lance (vida e condições do jogo).
  for (const [key, label] of Object.entries(LIFE_LABELS)) {
    if (outcome?.[key]) {
      match.lifeDelta[key] = (match.lifeDelta[key] ?? 0) + outcome[key];
      resolution.extras.push(`${label} ${outcome[key] > 0 ? '+' : ''}${outcome[key]}`);
    }
  }
  if (outcome?.effect) applyEffect(match, outcome.effect, resolution);
  if (outcome?.then) match.queue.push(outcome.then);

  // Riscos independentes do sucesso.
  const cardRisk = (option.risk?.card ?? 0) * (1 + matchModifier(player.traits, 'cardRisk'));
  if (cardRisk > 0 && rng.chance(success ? cardRisk * 0.3 : cardRisk)) {
    giveCard(match, player, rng, resolution);
  }
  const injuryRisk = (option.risk?.injury ?? 0) * (1 + matchModifier(player.traits, 'injuryRisk'));
  if (injuryRisk > 0 && rng.chance(injuryRisk)) {
    injure(match, resolution);
  }

  return resolution;
}

function applyKind(match, player, kind, rng, resolution) {
  switch (kind) {
    case 'goal':
      match.stats.goals += 1;
      match.stats.shots += 1;
      teamScores(match, `${player.nickname} marca!`, match.minute, player.nickname, true);
      break;
    case 'assist':
      // O passe saiu perfeito, mas ainda depende do companheiro acertar o gol.
      if (rng.chance(0.42)) {
        match.stats.assists += 1;
        const scorer = rng.pick(match.teammates);
        teamScores(match, `${scorer} finaliza após seu passe.`, match.minute, scorer);
      } else {
        log(match, 'Passe perfeito, mas o companheiro desperdiçou a chance.', 'info');
      }
      break;
    case 'chance':
      match.stats.shots += 1;
      if (rng.chance(0.45)) {
        if (rng.chance(0.6)) match.stats.assists += 1;
        const scorer = rng.pick(match.teammates);
        teamScores(match, `${scorer} aproveita a jogada que você criou.`, match.minute, scorer);
      } else {
        log(match, 'A chance criada não terminou em gol.', 'info');
      }
      break;
    case 'save':
      match.stats.saves += 1;
      break;
    case 'tackle':
      match.stats.tackles += 1;
      break;
    case 'penaltyConceded': {
      if (rng.chance(0.78)) concede(match, 'Pênalti convertido.');
      else log(match, 'O batedor perdeu o pênalti! Você escapou dessa.', 'good');
      giveCard(match, player, rng, resolution);
      break;
    }
    case 'foul':
      if (rng.chance(0.18)) concede(match, 'Gol na cobrança da falta.');
      break;
    case 'card':
      giveCard(match, player, rng, resolution);
      break;
    case 'yellow':
      giveCard(match, player, rng, resolution, { yellowOnly: true });
      break;
    case 'penaltyWon':
      // Você sofreu o pênalti: se é o cobrador, a bola é sua.
      if (isPenaltyTaker(player)) {
        match.queue.push('penalti');
      } else if (rng.chance(0.78)) {
        const scorer = rng.pick(match.teammates);
        teamScores(match, `${scorer} cobra o pênalti que você sofreu.`, match.minute, scorer);
      } else {
        log(match, 'O companheiro perdeu o pênalti que você sofreu.', 'info');
      }
      break;
    case 'goalAnnulled': {
      // O VAR anulou o seu gol.
      const index = (match.goals ?? []).map((goal) => goal.mine).lastIndexOf(true);
      if (index >= 0) {
        match.goals.splice(index, 1);
        match.score.team = Math.max(0, match.score.team - 1);
        match.stats.goals = Math.max(0, match.stats.goals - 1);
        log(match, 'Gol anulado pelo VAR.', 'bad', 'x');
      }
      break;
    }
    case 'injury':
      injure(match, resolution);
      break;
    case 'substitution':
      match.substituted = true;
      match.onField = false;
      log(match, 'Você deixa o campo.', 'info', 'sign-out');
      break;
    case 'lost': {
      const concedeChance = { gol: 1, defesa: 0.4, meio: 0.2, ataque: 0.05 }[match.zone] ?? 0.1;
      if (rng.chance(concedeChance)) concede(match, 'O adversário aproveitou a falha.');
      break;
    }
    default:
      break;
  }
}

const LIFE_LABELS = {
  morale: 'Vestiário',
  discipline: 'Disciplina',
  fame: 'Fama',
  managerRelation: 'Técnico',
  fanRelation: 'Torcida',
  happiness: 'Felicidade',
  reputation: 'Reputação',
};

/** Muda as condições do jogo depois de um evento (confiança, chuva, tática). */
function applyEffect(match, effect, resolution) {
  const conditions = match.conditions;
  if (effect.skill) {
    conditions.skill = clamp((conditions.skill ?? 0) + effect.skill, -6, 6);
    resolution.extras.push(effect.skill > 0 ? `Confiante: +${effect.skill} nos lances` : `Nervoso: ${effect.skill} nos lances`);
  }
  if (effect.rainProof) {
    conditions.rainProof = true;
    resolution.extras.push('A chuva não te atrapalha mais');
  }
  if (effect.captain) {
    conditions.captain = true;
    resolution.extras.push('Você é o capitão');
  }
  if (effect.tactic === 'segurar') {
    conditions.tactic = 'segurar';
    match.xg = { team: 0.7, opponent: 0.7 };
    resolution.extras.push('Time fechado: menos gols dos dois lados');
  }
  if (effect.tactic === 'pressionar') {
    conditions.tactic = 'pressionar';
    match.xg = { team: 1.3, opponent: 1.25 };
    resolution.extras.push('Time no ataque: mais gols dos dois lados');
  }
  if (effect.stamina) {
    match.stamina = clamp(match.stamina + effect.stamina, 0, 100);
    resolution.extras.push(`Energia ${effect.stamina > 0 ? '+' : ''}${effect.stamina}`);
  }
}

function giveCard(match, player, rng, resolution, { yellowOnly = false } = {}) {
  if (match.stats.yellowCards >= 1 || (!yellowOnly && rng.chance(0.12))) {
    match.stats.redCards = 1;
    match.sentOff = true;
    match.onField = false;
    match.ratingPoints -= 2.2;
    match.rating = round(computeRating(match), 1);
    log(match, 'Cartão vermelho. Você está expulso.', 'bad', 'cards', match.minute, 'red');
    resolution?.extras.push('Cartão vermelho');
  } else {
    match.stats.yellowCards += 1;
    match.ratingPoints -= 0.35;
    match.rating = round(computeRating(match), 1);
    log(match, 'Cartão amarelo.', 'bad', 'cards', match.minute, 'yellow');
    resolution?.extras.push('Cartão amarelo');
  }
}

function injure(match, resolution) {
  match.injured = true;
  match.onField = false;
  log(match, 'Você se machuca e precisa sair.', 'bad', 'first-aid-kit');
  resolution?.extras.push('Lesão');
}

/** Encerra a partida e monta o relatório. */
export function finish(match, player, rng) {
  if (match.finished) return match.report;
  match.finished = true;
  match.minute = 90;

  const result = match.score.team > match.score.opponent ? 'V' : match.score.team === match.score.opponent ? 'E' : 'D';

  // Ajuste de nota pelo resultado coletivo e pela participação.
  let rating = computeRating(match);
  if (result === 'V') rating += 0.25;
  if (result === 'D') rating -= 0.25;
  if (match.minutesPlayed < 20 && match.role !== PLAYER_ROLE.BENCH) rating = Math.min(rating, 6.9);
  const defensiveZone = match.zone === 'gol' || match.zone === 'defesa';
  const cleanSheet = defensiveZone && match.score.opponent === 0 && match.minutesPlayed >= 70;
  if (cleanSheet) rating += match.zone === 'gol' ? 0.55 : 0.3;
  if (match.zone === 'gol' && match.score.opponent >= 4) rating -= 0.5;
  rating = clamp(round(rating, 1), 1, 10);
  match.rating = rating;

  // Cartões de rotina: faltas táticas fora dos lances que você decidiu.
  if (rng && !match.stats.yellowCards && !match.stats.redCards && match.minutesPlayed >= 45) {
    const attrs = effectiveAttributes(player);
    const zoneRisk = { defesa: 0.075, meio: 0.06, ataque: 0.03, gol: 0.01 }[match.zone] ?? 0.04;
    const risk = clamp(zoneRisk + attrs.aggression / 1400, 0, 0.2);
    if (rng.chance(risk)) {
      match.stats.yellowCards = 1;
      rating -= 0.1;
      log(match, 'Cartão amarelo por falta tática.', 'bad', 'cards', match.minute, 'yellow');
    }
  }

  const motm = rating >= 8 && result !== 'D';

  match.report = {
    competition: match.competition,
    opponentName: match.opponentName,
    isHome: match.isHome,
    score: { ...match.score },
    goals: [...(match.goals ?? [])],
    clubName: match.clubName,
    result,
    rating,
    motm,
    cleanSheet,
    minutesPlayed: Math.min(90, Math.round(match.minutesPlayed)),
    stats: { ...match.stats },
    timeline: match.timeline,
    sentOff: match.sentOff,
    injured: match.injured,
    staminaLeft: Math.round(match.stamina),
    lifeDelta: match.lifeDelta,
    role: match.role,
  };

  log(match, `Fim de jogo: ${match.clubName} ${match.score.team} x ${match.score.opponent} ${match.opponentName}`, 'info', 'timer', 90, 'final');
  if (motm) log(match, 'Você foi eleito o melhor da partida.', 'good', 'medal');
  return match.report;
}

/**
 * Simulação automática (sem interação): resolve os lances escolhendo
 * a opção com melhor valor esperado.
 */
export function autoPlay(match, player, rng) {
  let guard = 0;
  while (!match.finished && guard < 60) {
    guard += 1;
    const step = advance(match, player, rng);
    if (step.type === 'finished') break;
    const moment = match.pending;
    const best = moment.raw.options
      .map((option, index) => {
        const chance = successChance(player, option, match);
        const upside = option.success?.rating ?? 0;
        const downside = option.failure?.rating ?? 0;
        // A simulação automática é levemente ambiciosa: prefere criar jogo
        // a só tocar a bola de lado, mas sem rifar a partida.
        return { index, value: chance * upside * 1.25 + (1 - chance) * downside * 0.85 };
      })
      .sort((a, b) => b.value - a.value)[0];
    choose(match, player, best.index, rng);
  }
  if (!match.finished) finish(match, player, rng);
  return match.report;
}

/** Simula uma partida em que você não entrou em campo. */
export function simulateWithoutPlayer({ clubId, opponentId, isHome, rng }) {
  const teamRating = squadRating(clubId) + (isHome ? 2 : -2);
  const opponentRating = squadRating(opponentId) - (isHome ? 1 : -1);
  const teamGoals = samplePoisson(expectedGoals(teamRating, opponentRating), rng);
  const oppGoals = samplePoisson(expectedGoals(opponentRating, teamRating), rng);
  return { team: teamGoals, opponent: oppGoals };
}

export function samplePoisson(mean, rng) {
  const limit = Math.exp(-mean);
  let product = rng.next();
  let count = 0;
  while (product > limit && count < 8) {
    product *= rng.next();
    count += 1;
  }
  return count;
}

/** Texto curto de contexto para a tela de pré-jogo. */
export function matchPreview(match) {
  const league = getLeague(getClub(match.opponentId)?.leagueId);
  const diff = match.teamRating - match.opponentRating;
  let forecast = 'Jogo equilibrado.';
  if (diff > 8) forecast = 'Vocês são amplamente favoritos.';
  else if (diff > 3) forecast = 'Leve favoritismo do seu time.';
  else if (diff < -8) forecast = 'Adversário muito superior no papel.';
  else if (diff < -3) forecast = 'Adversário favorito.';
  return {
    forecast,
    opponentRating: Math.round(match.opponentRating),
    teamRating: Math.round(match.teamRating),
    leagueName: league?.name ?? '',
  };
}
