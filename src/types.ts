export type AsciiStyle = 
  | 'slant' 
  | 'block' 
  | 'bubble' 
  | 'thin' 
  | 'gothic' 
  | '3d' 
  | 'shadow'
  | 'cyberpunk'
  | 'banner';

export interface StyleOption {
  value: AsciiStyle;
  label: string;
  description: string;
}

export type CharacterType = 'simple' | 'blocks' | 'classic' | 'binary' | 'letters';

export interface CharacterOption {
  value: CharacterType;
  label: string;
  description: string;
}

export interface AsciiArtItem {
  id: string;
  inputText: string;
  asciiArt: string;
  style: AsciiStyle;
  characterType: CharacterType;
  customPrompt?: string;
  timestamp: number;
  isFavorite: boolean;
}
