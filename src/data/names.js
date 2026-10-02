// Nomes usados para gerar companheiros de equipe, adversários e sugestões
// aleatórias na criação do personagem.

const POOLS = {
  BRA: {
    first: ['Gabriel', 'Lucas', 'Matheus', 'Rafael', 'Thiago', 'Vinícius', 'Bruno', 'Caio', 'Everton', 'Wesley', 'Igor', 'Murilo', 'Kauã', 'Pedro', 'Léo', 'Danilo', 'Felipe', 'Richarlison'],
    last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Almeida', 'Ribeiro', 'Carvalho', 'Gomes', 'Barbosa', 'Rocha', 'Nascimento', 'Araújo', 'Moraes'],
  },
  ARG: {
    first: ['Julián', 'Enzo', 'Facundo', 'Nicolás', 'Lautaro', 'Agustín', 'Matías', 'Gonzalo', 'Tomás', 'Franco', 'Emiliano', 'Valentín'],
    last: ['Martínez', 'Fernández', 'González', 'Álvarez', 'Romero', 'Paredes', 'Acuña', 'Correa', 'Dybala', 'Molina', 'Benedetto'],
  },
  FRA: {
    first: ['Hugo', 'Théo', 'Kylian', 'Lucas', 'Antoine', 'Jules', 'Mattéo', 'Enzo', 'Rayan', 'Noah', 'Eduardo', 'Ousmane'],
    last: ['Dubois', 'Lefevre', 'Moreau', 'Laurent', 'Girard', 'Mendy', 'Camavinga', 'Thuram', 'Bernard', 'Rousseau'],
  },
  ENG: {
    first: ['Jack', 'Harry', 'Oliver', 'Jude', 'Mason', 'Declan', 'Phil', 'Reece', 'Cole', 'Bukayo', 'Ollie', 'Levi'],
    last: ['Smith', 'Walker', 'Bennett', 'Thompson', 'Clarke', 'Foster', 'Hughes', 'Wright', 'Palmer', 'Rowe'],
  },
  ESP: {
    first: ['Pablo', 'Álvaro', 'Sergio', 'Marco', 'Gavi', 'Nico', 'Hugo', 'Iker', 'Dani', 'Pedro', 'Fermín'],
    last: ['García', 'Torres', 'Ruiz', 'Navas', 'Olmo', 'Cubarsí', 'Baena', 'Merino', 'Zubimendi', 'Llorente'],
  },
  POR: {
    first: ['João', 'Diogo', 'Rafael', 'Gonçalo', 'Nuno', 'Tomás', 'Afonso', 'Vitinha', 'Francisco', 'Rodrigo'],
    last: ['Ferreira', 'Pereira', 'Neves', 'Dias', 'Fonseca', 'Lopes', 'Trincão', 'Palhinha', 'Mendes'],
  },
  GER: {
    first: ['Jamal', 'Florian', 'Leon', 'Niklas', 'Maximilian', 'Felix', 'Jonas', 'Luca', 'Finn', 'Noah'],
    last: ['Müller', 'Schmidt', 'Wagner', 'Becker', 'Wirtz', 'Schlotterbeck', 'Fischer', 'Weber', 'Hofmann'],
  },
  ITA: {
    first: ['Nicolò', 'Giacomo', 'Federico', 'Lorenzo', 'Matteo', 'Riccardo', 'Davide', 'Alessandro', 'Samuele'],
    last: ['Rossi', 'Barella', 'Esposito', 'Russo', 'Ferrari', 'Bastoni', 'Scamacca', 'Locatelli', 'Colombo'],
  },
  DEFAULT: {
    first: ['Alex', 'Adam', 'Ryan', 'Mohamed', 'Daniel', 'David', 'Omar', 'Yuki', 'Kai', 'Ibrahim', 'Max'],
    last: ['Novak', 'Hansen', 'Diop', 'Kone', 'Tanaka', 'Ali', 'Jensen', 'Petrov', 'Olsen', 'Mensah'],
  },
};

export function randomName(rng, nationId = 'DEFAULT') {
  const pool = POOLS[nationId] ?? POOLS.DEFAULT;
  return {
    firstName: rng.pick(pool.first),
    lastName: rng.pick(pool.last),
  };
}

export function randomFullName(rng, nationId) {
  const { firstName, lastName } = randomName(rng, nationId);
  return `${firstName} ${lastName}`;
}

/** Apelido curto no estilo brasileiro, usado na camisa. */
export function suggestNickname(rng, firstName, lastName) {
  const options = [firstName, `${firstName[0]}. ${lastName}`, lastName, `${firstName}inho`];
  return rng.pick(options);
}
