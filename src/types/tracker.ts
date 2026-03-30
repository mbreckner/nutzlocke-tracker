export type PokemonStatus = 'OPEN' | 'USED' | 'USED_AND_WILL_BE_OPENED_LATER';

export interface Pokemon {
  id: number;
  name_de: string;
  name_en: string;
  generation: number;
  types: string[];
  bst: number;
  bisafans_url: string;
}

export interface PokemonEntry extends Pokemon {
  status: PokemonStatus;
  used_in_game?: string; // game id
}

export interface Game {
  id: string;
  name: string;
  generation: number;
  vanilla: boolean;
  attempts: number;
  special_rules: string;
}

export type SortField = 'id' | 'name_de' | 'name_en' | 'generation' | 'bst' | 'status';
export type SortDir = 'asc' | 'desc';
