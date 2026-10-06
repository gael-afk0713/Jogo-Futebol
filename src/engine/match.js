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
import { effectiveAttributes, playerOverall } from './overall.js';

export const PLAYER_ROLE = {
  STARTER: 'titular',
  SUB: 'reserva',
  BENCH: 'banco',
  OUT: 'fora',
};

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
    momentsPlayed: 0,
    totalMoments,
    usedMomentIds: [],
    pending: null,
    pendingPenalty: false,
    finished: false,
    sentOff: false,
    substituted: false,
    injured: false,
    lifeDelta: { morale: 0, discipline: 0, fame: 0 },
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

function log(match, text, type = 'info', icon = null, minute = match.minute) {
  match.timeline.push({ minute, text, type, icon });
}

function fillText(template, match, player) {
  return template
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
  const attrs = effectiveAttributes(player);
  const skill = average((option.attrs ?? ['composure']).map((id) => attrs[id] ?? 40));
  const kindPenalty = KIND_PENALTY[option.success?.kind] ?? 0;
  const traitBonus = option.mod ? matchModifier(player.traits, option.mod) * 55 : 0;
  const clutchBonus = match.minute >= 80 ? matchModifier(player.traits, 'clutch') * 20 : 0;
  const staminaPenalty = (1 - match.stamina / 100) * 16;
  const condition = (player.life.fitness - 60) * 0.1 + (player.life.morale - 50) * 0.05 + (player.life.happiness - 50) * 0.03;

  const effective = skill + traitBonus + clutchBonus + condition - staminaPenalty - (option.difficulty ?? 0) - kindPenalty;
  // O -4 e o spread largo evitam dois extremos chatos: o iniciante que nunca
  // acerta nada e o craque que nunca erra.
  const probability = logistic(effective - (match.opponentRating - 4), 0, 11);
  return clamp(probability, 0.05, 0.95);
}

function concede(match, reason, minute = match.minute) {
  match.score.opponent += 1;
  log(match, `Gol do ${match.opponentName}. ${reason}`, 'bad', 'soccer-ball', minute);
}

function teamScores(match, scorer, minute = match.minute) {
  match.score.team += 1;
  log(match, `Gol do ${match.clubName}. ${scorer}`, 'good', 'soccer-ball', minute);
}

/** Simula o que acontece no jogo fora dos seus lances. */
function simulateBackground(match, player, rng, minutes) {
  if (minutes <= 0) return;
  const share = minutes / 90;
  const playerBoost = match.onField ? (playerOverall(player) - match.teamRating) * 0.02 : -0.05;

  const teamXg = expectedGoals(match.teamRating, match.opponentRating) * share * (1 + playerBoost);
  const oppXg = expectedGoals(match.opponentRating, match.teamRating) * share;

  // O gol acontece em algum minuto dentro do trecho simulado, não no início dele.
  const goalMinute = () => clamp(match.minute + rng.int(1, Math.max(1, Math.round(minutes))), 1, 90);
  if (rng.chance(clamp(teamXg, 0, 0.9))) {
    teamScores(match, `${rng.pick(match.teammates)} finaliza bem.`, goalMinute());
  }
  if (rng.chance(clamp(oppXg, 0, 0.9))) {
    concede(match, 'Falha coletiva na marcação.', goalMinute());
  }
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
  const hasMomentsLeft = match.momentsPlayed < match.totalMoments;

  if (stillActive && hasMomentsLeft) {
    const remainingMoments = match.totalMoments - match.momentsPlayed;
    const remainingMinutes = Math.max(1, 90 - match.minute);
    const step = clamp(Math.round(remainingMinutes / (remainingMoments + 1)) + rng.int(-3, 3), 2, 30);

    simulateBackground(match, player, rng, step);
    match.minute = clamp(match.minute + step, 1, 89);
    if (match.onField) match.minutesPlayed += step;
    match.stamina = clamp(match.stamina - step * 0.35 * (1 + matchModifier(player.traits, 'staminaDrain')), 0, 100);

    const moment = pickMoment(match, player, rng);
    match.usedMomentIds.push(moment.id);
    match.momentsPlayed += 1;
    match.pending = {
      id: moment.id,
      title: moment.title,
      text: fillText(moment.text, match, player),
      tag: moment.tag ?? 'jogo',
      options: moment.options.map((option, index) => ({
        index,
        label: option.label,
        hint: option.hint ?? '',
        chance: successChance(player, option, match),
      })),
      raw: moment,
    };
    return { type: 'moment', moment: match.pending };
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
  match.stamina = clamp(match.stamina - (option.stamina ?? 2), 0, 100);
  match.pending = null;

  const resolution = {
    success,
    chance,
    text: fillText(outcome?.text ?? '', match, player),
    kind: outcome?.kind ?? 'neutral',
    extras: [],
  };

  addRatingPoints(match, outcome?.rating ?? 0);
  log(match, resolution.text, success ? 'good' : 'bad', success ? 'check' : 'x');

  applyKind(match, player, resolution.kind, rng, resolution);

  // Efeitos extras declarados no lance (moral, disciplina, fama).
  for (const key of ['morale', 'discipline', 'fame']) {
    if (outcome?.[key]) {
      match.lifeDelta[key] += outcome[key];
      resolution.extras.push(`${key === 'morale' ? 'Vestiário' : key === 'fame' ? 'Fama' : 'Disciplina'} ${outcome[key] > 0 ? '+' : ''}${outcome[key]}`);
    }
  }

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
      teamScores(match, `${player.nickname} marca!`);
      break;
    case 'assist':
      // O passe saiu perfeito, mas ainda depende do companheiro acertar o gol.
      if (rng.chance(0.42)) {
        match.stats.assists += 1;
        teamScores(match, `${rng.pick(match.teammates)} finaliza após seu passe.`);
      } else {
        log(match, 'Passe perfeito, mas o companheiro desperdiçou a chance.', 'info');
      }
      break;
    case 'chance':
      match.stats.shots += 1;
      if (rng.chance(0.45)) {
        if (rng.chance(0.6)) match.stats.assists += 1;
        teamScores(match, `${rng.pick(match.teammates)} aproveita a jogada que você criou.`);
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

function giveCard(match, player, rng, resolution) {
  if (match.stats.yellowCards >= 1 || rng.chance(0.12)) {
    match.stats.redCards = 1;
    match.sentOff = true;
    match.onField = false;
    match.ratingPoints -= 2.2;
    match.rating = round(computeRating(match), 1);
    log(match, 'Cartão vermelho. Você está expulso.', 'bad', 'cards');
    resolution?.extras.push('Cartão vermelho');
  } else {
    match.stats.yellowCards += 1;
    match.ratingPoints -= 0.35;
    match.rating = round(computeRating(match), 1);
    log(match, 'Cartão amarelo.', 'bad', 'cards');
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
      log(match, 'Cartão amarelo por falta tática.', 'bad', 'cards');
    }
  }

  const motm = rating >= 8 && result !== 'D';

  match.report = {
    competition: match.competition,
    opponentName: match.opponentName,
    isHome: match.isHome,
    score: { ...match.score },
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

  log(match, `Fim de jogo: ${match.clubName} ${match.score.team} x ${match.score.opponent} ${match.opponentName}`, 'info', 'timer');
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
