// Seleções e países de origem. "strength" afeta o quão difícil é ser convocado
// e o peso da seleção em torneios; "league" é a liga doméstica onde você começa.

export const NATIONS = [
  { id: 'BRA', name: 'Brasil', strength: 92, league: 'BRA1', demonym: 'brasileiro' },
  { id: 'ARG', name: 'Argentina', strength: 93, league: 'ARG1', demonym: 'argentino' },
  { id: 'FRA', name: 'França', strength: 94, league: 'FRA1', demonym: 'francês' },
  { id: 'ENG', name: 'Inglaterra', strength: 91, league: 'ENG1', demonym: 'inglês' },
  { id: 'ESP', name: 'Espanha', strength: 91, league: 'ESP1', demonym: 'espanhol' },
  { id: 'POR', name: 'Portugal', strength: 88, league: 'POR1', demonym: 'português' },
  { id: 'GER', name: 'Alemanha', strength: 89, league: 'GER1', demonym: 'alemão' },
  { id: 'ITA', name: 'Itália', strength: 87, league: 'ITA1', demonym: 'italiano' },
  { id: 'NED', name: 'Holanda', strength: 86, league: 'NED1', demonym: 'holandês' },
  { id: 'URU', name: 'Uruguai', strength: 83, league: 'ARG1', demonym: 'uruguaio' },
  { id: 'COL', name: 'Colômbia', strength: 82, league: 'BRA1', demonym: 'colombiano' },
  { id: 'MEX', name: 'México', strength: 76, league: 'MEX1', demonym: 'mexicano' },
  { id: 'USA', name: 'Estados Unidos', strength: 74, league: 'USA1', demonym: 'norte-americano' },
  { id: 'JPN', name: 'Japão', strength: 78, league: 'JPN1', demonym: 'japonês' },
  { id: 'MAR', name: 'Marrocos', strength: 80, league: 'POR1', demonym: 'marroquino' },
  { id: 'NGA', name: 'Nigéria', strength: 75, league: 'POR1', demonym: 'nigeriano' },
  { id: 'SEN', name: 'Senegal', strength: 79, league: 'FRA1', demonym: 'senegalês' },
  { id: 'NOR', name: 'Noruega', strength: 72, league: 'NED1', demonym: 'norueguês' },
  { id: 'TUR', name: 'Turquia', strength: 70, league: 'TUR1', demonym: 'turco' },
  { id: 'KSA', name: 'Arábia Saudita', strength: 66, league: 'SAU1', demonym: 'saudita' },
];

const BY_ID = new Map(NATIONS.map((nation) => [nation.id, nation]));

export const getNation = (id) => BY_ID.get(id) ?? NATIONS[0];
