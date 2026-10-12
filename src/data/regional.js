// Estaduais e copas regionais do Brasil. Quem joga a Série B ou a C abre o ano
// numa delas (a Série A não tem semana sobrando no calendário). Os estados com
// poucos clubes no jogo entram na copa regional da sua região.
// Nomes usados como referência de fãs, sem vínculo oficial.

export const REGIONAL_CUPS = [
  {
    id: 'paulista',
    name: 'Campeonato Paulista',
    clubs: ['bra1_palmeiras', 'bra1_saopaulo', 'bra1_corinthians', 'bra2_santos', 'bra2_ponte', 'bra2_guarani', 'bra2_mirassol', 'bra2_novorizontino'],
  },
  { id: 'carioca', name: 'Campeonato Carioca', clubs: ['bra1_flamengo', 'bra1_fluminense', 'bra1_vasco', 'bra1_botafogo', 'bra3_volta'] },
  { id: 'gaucho', name: 'Campeonato Gaúcho', clubs: ['bra1_gremio', 'bra1_internacional', 'bra1_juventude', 'bra3_caxias', 'bra3_sanjose'] },
  { id: 'paranaense', name: 'Campeonato Paranaense', clubs: ['bra1_athletico', 'bra2_coritiba', 'bra2_operario', 'bra3_londrina'] },
  { id: 'catarinense', name: 'Campeonato Catarinense', clubs: ['bra2_avai', 'bra2_chapecoense', 'bra3_figueirense'] },
  {
    id: 'nordeste',
    name: 'Copa do Nordeste',
    clubs: ['bra1_bahia', 'bra1_vitoria', 'bra1_fortaleza', 'bra2_crb', 'bra3_abc', 'bra3_sampaio', 'bra3_itabaiana'],
  },
  { id: 'verde', name: 'Copa Verde', clubs: ['bra2_goias', 'bra2_amazonas', 'bra3_pay', 'bra3_remo'] },
];

// Ligas cujos clubes jogam estadual ou copa regional no começo do ano.
export const REGIONAL_LEAGUES = new Set(['BRA2', 'BRA3']);

const BY_CLUB = new Map(REGIONAL_CUPS.flatMap((cup) => cup.clubs.map((id) => [id, cup])));

/** O estadual (ou a copa regional) de um clube, se ele jogar um. */
export const regionalCupFor = (clubId) => BY_CLUB.get(clubId) ?? null;
