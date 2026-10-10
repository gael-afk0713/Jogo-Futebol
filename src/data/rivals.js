// Clássicos: rivalidades entre clubes do jogo. O nome aparece no calendário,
// no placar e nos eventos do jogo. Só valem quando os dois se enfrentam (na
// liga ou numa copa). Nomes usados como referência de fãs, sem vínculo oficial.

export const RIVALRIES = [
  // Brasil
  { name: 'Fla-Flu', clubs: ['bra1_flamengo', 'bra1_fluminense'] },
  { name: 'Clássico dos Milhões', clubs: ['bra1_flamengo', 'bra1_vasco'] },
  { name: 'Clássico da Rivalidade', clubs: ['bra1_flamengo', 'bra1_botafogo'] },
  { name: 'Clássico dos Gigantes', clubs: ['bra1_vasco', 'bra1_fluminense'] },
  { name: 'Clássico Vovô', clubs: ['bra1_botafogo', 'bra1_fluminense'] },
  { name: 'Derby Paulista', clubs: ['bra1_corinthians', 'bra1_palmeiras'] },
  { name: 'Majestoso', clubs: ['bra1_saopaulo', 'bra1_corinthians'] },
  { name: 'Choque-Rei', clubs: ['bra1_palmeiras', 'bra1_saopaulo'] },
  { name: 'Gre-Nal', clubs: ['bra1_gremio', 'bra1_internacional'] },
  { name: 'Clássico Mineiro', clubs: ['bra1_atleticomg', 'bra1_cruzeiro'] },
  { name: 'Ba-Vi', clubs: ['bra1_bahia', 'bra1_vitoria'] },
  { name: 'Atletiba', clubs: ['bra1_athletico', 'bra2_coritiba'] },
  { name: 'Derby Campineiro', clubs: ['bra2_ponte', 'bra2_guarani'] },
  { name: 'Derby Campineiro da base', clubs: ['base_ponte', 'base_guarani'] },
  { name: 'Re-Pa', clubs: ['bra3_remo', 'bra3_pay'] },
  // Argentina
  { name: 'Superclásico', clubs: ['arg_river', 'arg_boca'] },
  { name: 'Clásico de Avellaneda', clubs: ['arg_racing', 'arg_independiente'] },
  { name: 'Clásico de Boedo', clubs: ['arg_sanlorenzo', 'arg_huracan'] },
  // Portugal
  { name: 'O Clássico', clubs: ['por_benfica', 'por_porto'] },
  { name: 'Derby de Lisboa', clubs: ['por_benfica', 'por_sporting'] },
  { name: 'Clássico Porto x Sporting', clubs: ['por_porto', 'por_sporting'] },
  { name: 'Derby do Minho', clubs: ['por_braga', 'por_vitoria'] },
  // Holanda
  { name: 'De Klassieker', clubs: ['ned_ajax', 'ned_feyenoord'] },
  { name: 'Ajax x PSV', clubs: ['ned_ajax', 'ned_psv'] },
  { name: 'Derby de Roterdã', clubs: ['ned_feyenoord', 'ned_sparta'] },
  // Inglaterra
  { name: 'North West Derby', clubs: ['eng_liverpool', 'eng_manutd'] },
  { name: 'Derby de Manchester', clubs: ['eng_mancity', 'eng_manutd'] },
  { name: 'Derby de Merseyside', clubs: ['eng_liverpool', 'eng_everton'] },
  { name: 'North London Derby', clubs: ['eng_arsenal', 'eng_tottenham'] },
  { name: 'Derby de Londres', clubs: ['eng_chelsea', 'eng_tottenham'] },
  { name: 'Derby de East Midlands', clubs: ['eng_forest', 'eng2_leicester'] },
  // Espanha
  { name: 'El Clásico', clubs: ['esp_real', 'esp_barcelona'] },
  { name: 'Derby de Madrid', clubs: ['esp_real', 'esp_atletico'] },
  { name: 'Derby Basco', clubs: ['esp_athletic', 'esp_sociedad'] },
  { name: 'Derby de Sevilha', clubs: ['esp_betis', 'esp_sevilla'] },
  // Itália
  { name: 'Derby della Madonnina', clubs: ['ita_inter', 'ita_milan'] },
  { name: "Derby d'Italia", clubs: ['ita_inter', 'ita_juventus'] },
  { name: 'Derby della Capitale', clubs: ['ita_roma', 'ita_lazio'] },
  { name: 'Derby della Mole', clubs: ['ita_juventus', 'ita_torino'] },
  // Alemanha
  { name: 'Der Klassiker', clubs: ['ger_bayern', 'ger_dortmund'] },
  // França
  { name: 'Le Classique', clubs: ['fra_psg', 'fra_marseille'] },
  { name: 'Derby du Nord', clubs: ['fra_lille', 'fra_lens'] },
  { name: "Derby da Côte d'Azur", clubs: ['fra_nice', 'fra_monaco'] },
  // Turquia
  { name: 'Derby Intercontinental', clubs: ['tur_galatasaray', 'tur_fener'] },
  { name: 'Derby de Istambul', clubs: ['tur_galatasaray', 'tur_besiktas'] },
  { name: 'Derby Fener x Beşiktaş', clubs: ['tur_fener', 'tur_besiktas'] },
  // México, EUA, Japão, Arábia
  { name: 'Clásico Nacional', clubs: ['mex_america', 'mex_chivas'] },
  { name: 'Clásico Regio', clubs: ['mex_tigres', 'mex_monterrey'] },
  { name: 'Clásico Capitalino', clubs: ['mex_america', 'mex_pumas'] },
  { name: 'Clásico Joven', clubs: ['mex_america', 'mex_cruzazul'] },
  { name: 'El Tráfico', clubs: ['usa_lafc', 'usa_galaxy'] },
  { name: 'Clássico do Tama', clubs: ['jpn_kawasaki', 'jpn_frontale'] },
  { name: 'Derby de Riad', clubs: ['sau_hilal', 'sau_nassr'] },
  { name: 'Derby de Jidá', clubs: ['sau_ittihad', 'sau_ahli'] },
];

const key = (a, b) => [a, b].sort().join('|');
const BY_PAIR = new Map(RIVALRIES.map((rivalry) => [key(...rivalry.clubs), rivalry]));

/** O clássico entre dois clubes, se houver. */
export const rivalryBetween = (a, b) => (a && b ? BY_PAIR.get(key(a, b)) ?? null : null);
