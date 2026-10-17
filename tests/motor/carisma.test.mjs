// Carisma: teste passado ensina, eventos de comunicação, falhas, liderança,
// traços e o teto oculto pela rodagem (a loja passa dele).
const R = '../../src/';
const { Game } = await import(R + 'core/game.js');
const { resolveLifeOption, seasonLeadership, charismaCeiling, gainCharisma } = await import(R + 'engine/life.js');
const { getLifeEvent } = await import(R + 'data/lifeEvents.js');
const { buyItem } = await import(R + 'engine/shop.js');
const { createMatch, choose } = await import(R + 'engine/match.js');
const { MATCH_EVENTS } = await import(R + 'data/matchEvents.js');
const { createRng } = await import(R + 'core/rng.js');

let fails = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? 'ok' : 'FALHOU'} - ${msg}`);
  if (!cond) fails++;
};

function fresh(traits = ['driblador', 'motor']) {
  const game = new Game();
  game.rng.seed = 99;
  game.createCareer({ firstName: 'Kauã', lastName: 'Ribeiro', nationality: 'BRA', position: 'MEI', traits, groupPoints: { passe: 8, drible: 8 }, appearance: {} });
  game.acceptTrial(game.state.trials.offers[0].id);
  return game;
}
const always = { chance: () => true, weighted: (list) => list[0], next: () => 0, int: (a) => a, pick: (l) => l[0] };
const never = { chance: () => false, weighted: (list) => list[list.length - 1], next: () => 0.99, int: (a) => a, pick: (l) => l[0] };
const optionIndex = (event, label) => event.options.findIndex((option) => option.label.startsWith(label));

// Teto pela rodagem
{
  const game = fresh();
  const p = game.player;
  ok(charismaCeiling(p) === 65, `estreante tem teto 65 (${charismaCeiling(p)})`);
  p.career.totals.minutes = 8000;
  ok(charismaCeiling(p) === 90, `cascudo tem teto 90 (${charismaCeiling(p)})`);
}

// A: passar no teste da semana ensina +1
{
  const game = fresh();
  const p = game.player;
  p.life.charisma = 55;
  const event = getLifeEvent('torcida_organizada');
  const result = resolveLifeOption(p, event, optionIndex(event, 'Ir conversar'), always);
  ok(p.life.charisma === 56 && result.notes.includes('Carisma +1'), `teste de carisma passado: 55 -> ${p.life.charisma} (${result.notes.join(', ')})`);
  const failed = resolveLifeOption(p, event, optionIndex(event, 'Ir conversar'), never);
  ok(p.life.charisma === 54 && failed.notes.includes('Carisma -2'), `organizada azedou: 56 -> ${p.life.charisma} (${failed.notes.join(', ')})`);
}

// B: boa escolha de comunicação; no teto não aparece; perda passa do teto
{
  const game = fresh();
  const p = game.player;
  p.life.charisma = 60;
  const event = getLifeEvent('briga_vestiario');
  resolveLifeOption(p, event, optionIndex(event, 'Procurar o capitão'), always);
  ok(p.life.charisma === 62, `conversa com o capitão em particular: 60 -> ${p.life.charisma}`);
  p.life.charisma = 65;
  const capped = resolveLifeOption(p, event, optionIndex(event, 'Procurar o capitão'), always);
  ok(p.life.charisma === 65 && !capped.notes.some((note) => note.startsWith('Carisma')), `no teto, o ganho não entra nem aparece (${capped.notes.join(', ')})`);
  const rift = resolveLifeOption(p, event, optionIndex(event, 'Rebater'), never);
  ok(p.life.charisma === 63, `rebater e rachar o vestiário: 65 -> ${p.life.charisma} (${rift.notes.join(', ')})`);
}

// Midiático ganha 50% a mais nos eventos
{
  const game = fresh(['midiatico', 'driblador']);
  const p = game.player;
  p.life.charisma = 55;
  const event = getLifeEvent('briga_vestiario');
  resolveLifeOption(p, event, optionIndex(event, 'Procurar o capitão'), always);
  ok(p.life.charisma === 58, `midiático: +2 vira +3 (55 -> ${p.life.charisma})`);
}

// A loja passa do teto
{
  const game = fresh();
  const p = game.player;
  p.life.charisma = 65;
  p.money = 1_000_000;
  const bought = buyItem(p, 'media_training', { rng: createRng(1) });
  ok(bought.ok && p.life.charisma === 71, `media training passa do teto: 65 -> ${p.life.charisma}`);
  ok(gainCharisma(p, 2) === 0 && p.life.charisma === 71, 'acima do teto, o jogo não tira o que a loja deu');
}

// C: liderança no fim da temporada
{
  const game = fresh();
  const p = game.player;
  p.life.charisma = 50;
  Object.assign(p.season, { apps: 40, starts: 30, minutes: 2800 });
  const lead = seasonLeadership(p, { minutesBefore: 500, minutesAfter: 3300 });
  ok(lead.gain === 2 && p.life.charisma === 52, `30 jogos como titular e 10 entradas: +${lead.gain} (${lead.reasons.join(', ')})`);
  p.career.totals.minutes = 3600;
  const level = seasonLeadership(p, { minutesBefore: 3000, minutesAfter: 3600 });
  ok(level.gain === 4 && level.reasons.some((r) => r.includes('experiente')), `virar Experiente rende extra: +${level.gain} (${level.reasons.join(', ')})`);
  const leader = fresh(['lider', 'driblador']).player;
  leader.life.charisma = 50;
  Object.assign(leader.season, { apps: 40, starts: 30, minutes: 2800 });
  const led = seasonLeadership(leader, { minutesBefore: 500, minutesAfter: 3300 });
  ok(led.gain === 3, `líder de vestiário: +2 vira +${led.gain} (${led.reasons.join(', ')})`);
}

// A na partida: separar a briga ensina; no teto, o lance não promete o que não dá
{
  const game = fresh();
  const p = game.player;
  const brawl = MATCH_EVENTS.find((event) => event.options.some((option) => option.label === 'Separar a briga'));
  const index = brawl.options.findIndex((option) => option.label === 'Separar a briga');
  const play = (charisma) => {
    p.life.charisma = charisma;
    const match = createMatch({ player: p, clubId: p.club, opponentId: p.club, competition: { id: 'league', name: 'X', stage: null, knockout: false }, isHome: true, role: 'titular', rng: createRng(5), round: 1 });
    match.pending = { id: brawl.id, raw: brawl, offBall: true, options: [] };
    const res = choose(match, p, index, { ...always, pick: (l) => l[0] });
    return { res, delta: match.lifeDelta.charisma ?? 0 };
  };
  const low = play(55);
  ok(low.delta === 1 && low.res.extras.includes('Carisma +1'), `separar a briga com 55: ${low.res.extras.join(', ')}`);
  const top = play(65);
  ok(top.delta === 0 && !top.res.extras.some((e) => e.startsWith('Carisma')), `no teto, o lance não mostra carisma (${top.res.extras.join(', ') || 'nada'})`);
}

console.log(fails ? `${fails} falha(s)` : 'tudo certo');
if (fails) process.exitCode = 1;
