// Mercado da bola: valor de mercado, propostas, renovações e empréstimos.

import { clamp, logistic, money, uid } from '../core/utils.js';
import { ALL_CLUBS, getClub, getLeague, salaryBand, squadRating } from '../data/clubs.js';
import { lifeModifier } from '../data/traits.js';
import { seasonRating } from './player.js';

export const ROLES = {
  STAR: { id: 'estrela', label: 'Estrela do time', salaryFactor: 2.3, minutesBias: 0.95, gap: 2 },
  STARTER: { id: 'titular', label: 'Titular absoluto', salaryFactor: 1.45, minutesBias: 0.85, gap: -2 },
  ROTATION: { id: 'rotacao', label: 'Rotação', salaryFactor: 0.95, minutesBias: 0.55, gap: -6 },
  PROSPECT: { id: 'promessa', label: 'Promessa / reserva', salaryFactor: 0.5, minutesBias: 0.3, gap: -11 },
};

export const ROLE_LIST = Object.values(ROLES);

export const getRole = (id) => ROLE_LIST.find((role) => role.id === id) ?? ROLES.ROTATION;

/** Valor de mercado estimado em euros. */
export function marketValue(player) {
  const base = 45_000 * Math.pow(1.195, player.overall - 45);
  const ageFactor =
    player.age <= 21 ? 1.45 : player.age <= 25 ? 1.3 : player.age <= 28 ? 1 : player.age <= 31 ? 0.68 : player.age <= 33 ? 0.4 : 0.2;
  const potentialFactor = 1 + Math.max(0, player.potential - player.overall) * 0.022;
  const fameFactor = 1 + player.life.fame / 400;
  const formFactor = clamp(0.8 + (seasonRating(player.season) || 6.5) / 20, 0.8, 1.25);
  return Math.round((base * ageFactor * potentialFactor * fameFactor * formFactor) / 1000) * 1000;
}

/** Quanto um clube quer este jogador (0..1). */
export function clubInterest(player, clubId, { seasonRatingValue = 6.5 } = {}) {
  const club = getClub(clubId);
  if (!club) return 0;
  const league = getLeague(club.leagueId);
  if (league?.youth) return 0;

  const rating = squadRating(clubId);
  const gap = player.overall - rating;
  const potentialBonus = player.age <= 22 ? Math.max(0, player.potential - player.overall) * 0.18 : 0;
  const reputationBonus = player.life.reputation * 0.07 + player.life.fame * 0.05;
  const formBonus = (seasonRatingValue - 6.5) * 3.2;
  const ageMalus = player.age >= 32 ? (player.age - 31) * 2.4 : 0;
  const prestigeBarrier = Math.max(0, (club.prestige - 58) * 0.3);
  const disciplineMalus = player.life.discipline < 35 ? 3 : 0;
  const scandalMalus = player.flags.includes('doping') || player.flags.includes('investigado') ? 12 : 0;

  const score =
    gap + potentialBonus + reputationBonus + formBonus - ageMalus - prestigeBarrier - disciplineMalus - scandalMalus;
  return clamp(logistic(score, 0, 6), 0, 1);
}

function roleFor(player, clubId) {
  const rating = squadRating(clubId);
  const gap = player.overall - rating;
  if (gap >= ROLES.STAR.gap) return ROLES.STAR;
  if (gap >= ROLES.STARTER.gap) return ROLES.STARTER;
  if (gap >= ROLES.ROTATION.gap) return ROLES.ROTATION;
  return ROLES.PROSPECT;
}

function buildOffer(player, clubId, rng, { loan = false, interest = 0.5 } = {}) {
  const club = getClub(clubId);
  const league = getLeague(club.leagueId);
  const role = roleFor(player, clubId);
  const negotiationBonus = 1 + lifeModifier(player.traits, 'contractBonus') + player.life.charisma / 600;
  const weeklySalary = Math.round(salaryBand(clubId) * role.salaryFactor * negotiationBonus * rng.float(0.9, 1.15));
  const years = loan ? 1 : rng.int(2, 5);
  const value = marketValue(player);

  return {
    id: uid('offer'),
    clubId,
    clubName: club.name,
    leagueId: league.id,
    leagueName: league.name,
    country: league.country,
    prestige: club.prestige,
    squadRating: squadRating(clubId),
    leagueLevel: league.level,
    continental: Boolean(league.continentalSpots),
    role: role.id,
    roleLabel: role.label,
    weeklySalary,
    years,
    signingBonus: loan ? 0 : Math.round(weeklySalary * rng.int(6, 26)),
    releaseClause: loan ? 0 : Math.round(value * rng.float(1.8, 3.4)),
    transferFee: loan ? 0 : Math.round(value * rng.float(0.8, 1.4)),
    loan,
    interest,
    pitch: pitchFor(club, league, role, loan, rng),
  };
}

function pitchFor(club, league, role, loan, rng) {
  if (loan) return `O ${club.name} quer te levar por empréstimo de uma temporada para você ganhar minutos.`;
  const lines = {
    estrela: [
      `O ${club.name} quer construir o time em volta de você.`,
      `A diretoria do ${club.name} te vê como o grande nome do projeto.`,
    ],
    titular: [
      `O ${club.name} promete a titularidade absoluta na sua posição.`,
      `O técnico do ${club.name} já te desenhou no esquema como titular.`,
    ],
    rotacao: [
      `No ${club.name} você entra para disputar posição em pé de igualdade.`,
      `O ${club.name} oferece rotação e vitrine na ${league.name}.`,
    ],
    promessa: [
      `O ${club.name} te quer como aposta de futuro, com minutos aos poucos.`,
      `No ${club.name} você começa atrás na fila, mas num clube grande.`,
    ],
  };
  return rng.pick(lines[role.id]);
}

/**
 * Propostas de fim de temporada.
 * Considera desempenho, idade, fama e o tamanho dos clubes interessados.
 */
export function generateOffers(player, { seasonRatingValue, rng, max = 5 }) {
  const candidates = ALL_CLUBS.filter((club) => club.id !== player.club)
    .map((club) => ({ club, interest: clubInterest(player, club.id, { seasonRatingValue }) }))
    .filter((entry) => entry.interest > 0.34);

  if (!candidates.length) return [];

  // Evita 5 propostas do mesmo país: pondera por interesse e diversifica.
  const chosen = [];
  const pool = [...candidates];
  const limit = Math.min(max, pool.length, 2 + Math.floor(player.life.fame / 25) + (player.age <= 23 ? 1 : 0));

  while (chosen.length < limit && pool.length) {
    const entry = rng.weighted(pool, (item) => item.interest ** 2 * (1 + item.club.prestige / 120));
    pool.splice(pool.indexOf(entry), 1);
    const sameLeagueCount = chosen.filter((offer) => offer.leagueId === entry.club.leagueId).length;
    if (sameLeagueCount >= 2) continue;
    chosen.push(buildOffer(player, entry.club.id, rng, { interest: entry.interest }));
  }

  return chosen.sort((a, b) => b.prestige - a.prestige);
}

/** Propostas de empréstimo para quem não está jogando. */
export function generateLoanOffers(player, { rng, max = 3 }) {
  if (!player.club) return [];
  const currentRating = squadRating(player.club);
  const candidates = ALL_CLUBS.filter((club) => {
    if (club.id === player.club) return false;
    const rating = squadRating(club.id);
    return rating < currentRating + 2 && rating > currentRating - 18 && player.overall >= rating - 8;
  });
  if (!candidates.length) return [];
  return rng
    .shuffle(candidates)
    .slice(0, max)
    .map((club) => buildOffer(player, club.id, rng, { loan: true, interest: 0.6 }));
}

// Idade máxima na base: depois disso o jogador precisa subir para o profissional.
export const YOUTH_AGE_LIMIT = 19;

export const isYouthClub = (clubId) => Boolean(getLeague(getClub(clubId)?.leagueId)?.youth);

/** O jogador estourou a idade da base (a idade já é a da próxima temporada). */
export const agedOutOfYouth = (player) => isYouthClub(player.club) && player.age > YOUTH_AGE_LIMIT;

/** O time profissional do mesmo clube chama o jogador da base. */
export function promotionOffer(player, rng) {
  const parentId = getClub(player.club)?.parent;
  if (!parentId || !isYouthClub(player.club) || player.age < 18) return null;
  // Antes de estourar a idade, só sobe quem já está perto do nível do time de cima.
  if (!agedOutOfYouth(player) && player.overall < squadRating(parentId) - 8) return null;
  const parent = getClub(parentId);
  const offer = buildOffer(player, parentId, rng, { interest: 0.7 });
  return {
    ...offer,
    promotion: true,
    transferFee: 0,
    signingBonus: Math.round(offer.weeklySalary * rng.int(2, 6)),
    pitch: `O ${parent.name} quer subir você da base para o time profissional.`,
  };
}

/**
 * Quem estourou a idade da base e não recebeu nenhuma proposta ainda arranja
 * um clube profissional pequeno do próprio país para começar.
 */
export function firstProOffers(player, rng, count = 2) {
  const nation = getLeague(getClub(player.club)?.leagueId)?.nation;
  const pool = ALL_CLUBS.filter((club) => {
    const league = getLeague(club.leagueId);
    return !league.youth && league.nation === nation;
  }).sort((a, b) => Math.abs(squadRating(a.id) - player.overall + 4) - Math.abs(squadRating(b.id) - player.overall + 4));
  return pool.slice(0, count * 3).filter((_, index) => index % 3 === 0).slice(0, count).map((club) => buildOffer(player, club.id, rng, { interest: 0.5 }));
}

/** Oferta de renovação do clube atual. */
export function renewalOffer(player, rng) {
  if (!player.club) return null;
  // A base não renova com quem já passou da idade e não prende ninguém além dela.
  const youth = isYouthClub(player.club);
  if (youth && player.age > YOUTH_AGE_LIMIT) return null;
  const role = roleFor(player, player.club);
  const current = player.contract?.weeklySalary ?? salaryBand(player.club);
  const performance = clamp((seasonRating(player.season) || 6.5) - 6.4, -0.6, 1.6);
  const raise = clamp(1 + performance * 0.45 + lifeModifier(player.traits, 'contractBonus'), 0.9, 2.4);
  const weeklySalary = Math.round(Math.max(current * 1.02, salaryBand(player.club) * role.salaryFactor * raise));

  return {
    id: uid('renew'),
    clubId: player.club,
    clubName: getClub(player.club)?.name ?? '',
    leagueId: getClub(player.club)?.leagueId,
    leagueName: getLeague(getClub(player.club)?.leagueId)?.name ?? '',
    role: role.id,
    roleLabel: role.label,
    weeklySalary,
    years: youth ? Math.max(1, Math.min(rng.int(2, 4), YOUTH_AGE_LIMIT + 1 - player.age)) : rng.int(2, 4),
    signingBonus: Math.round(weeklySalary * rng.int(4, 14)),
    releaseClause: Math.round(marketValue(player) * rng.float(2, 3.5)),
    renewal: true,
    pitch: `O ${getClub(player.club)?.name} quer te manter e oferece ${money(weeklySalary)} por semana.`,
  };
}

/** Peneiras do começo de carreira, para quem ainda não tem clube. */
export function generateTrialOffers(player, rng, { nationLeagueId }) {
  const league = getLeague(nationLeagueId) ?? getLeague('BRA_BASE');
  const pool = league.teams.filter((team) => Math.abs(squadRating(team.id) - player.overall) < 16);
  const teams = (pool.length >= 3 ? pool : league.teams).slice();
  return rng
    .shuffle(teams)
    .slice(0, 3)
    .map((team) => {
      const offer = buildOffer(player, team.id, rng, { interest: 0.6 });
      return {
        ...offer,
        trial: true,
        weeklySalary: Math.max(300, Math.round(offer.weeklySalary * 0.3)),
        signingBonus: 0,
        releaseClause: 0,
        years: 2,
        role: ROLES.PROSPECT.id,
        roleLabel: 'Base / promessa',
        pitch: `O ${team.name} te chamou para a peneira. É a sua chance de virar profissional.`,
      };
    });
}

/** Assina um contrato: atualiza clube, salário e histórico. */
export function signContract(player, offer, { year }) {
  const previousClub = player.club;
  player.club = offer.clubId;
  player.contract = {
    clubId: offer.clubId,
    weeklySalary: offer.weeklySalary,
    years: offer.years,
    role: offer.role,
    releaseClause: offer.releaseClause ?? 0,
    signedAt: year,
    loan: Boolean(offer.loan),
    parentClub: offer.loan ? previousClub : null,
  };
  player.money += offer.signingBonus ?? 0;

  if (!offer.loan && previousClub !== offer.clubId) {
    player.career.transfers.push({
      year,
      from: previousClub,
      to: offer.clubId,
      fee: offer.transferFee ?? 0,
      salary: offer.weeklySalary,
    });
  }
  if (!player.career.clubs.includes(offer.clubId)) player.career.clubs.push(offer.clubId);
  return player.contract;
}
