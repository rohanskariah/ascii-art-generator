import { StyleOption, CharacterOption, AsciiStyle, CharacterType } from './types';

export const STYLE_OPTIONS: StyleOption[] = [
  {
    value: 'block',
    label: 'Standard Block',
    description: 'Thick uppercase structures with aligned proportions',
  },
  {
    value: 'slant',
    label: 'Dynamic Slant',
    description: 'Stylized slanted italics with diagonal geometry',
  },
  {
    value: 'bubble',
    label: 'Circular Bubble',
    description: 'Friendly outline letters framed by circular bubbles',
  },
  {
    value: 'thin',
    label: 'Clean Thin',
    description: 'Single stroke minimal aesthetics using neat lines',
  },
  {
    value: 'gothic',
    label: 'Dark Gothic',
    description: 'Elaborate angular shapes mimicking historic gothic letters',
  },
  {
    value: '3d',
    label: '3D Extrusion',
    description: 'Simulated dimensional projection with shadow offsets',
  },
  {
    value: 'shadow',
    label: 'Drop Shadow',
    description: 'Standard characters with offset trailing shadow lines',
  },
  {
    value: 'cyberpunk',
    label: 'Cyber Futuristic',
    description: 'Angled, grid-like geometric configurations',
  },
  {
    value: 'banner',
    label: 'Banner Flag',
    description: 'Suspended ribbon characters for titles',
  },
];

export const CHARACTER_OPTIONS: CharacterOption[] = [
  {
    value: 'simple',
    label: 'Hashes & Slashes',
    description: 'Uses classic combinations like #, /, \\, and -',
  },
  {
    value: 'blocks',
    label: 'Solid Text-Blocks',
    description: 'Utilizes high-density block symbols (█, ▓, ▒, ░)',
  },
  {
    value: 'classic',
    label: 'Symbol Matrix',
    description: 'Uses keyboard symbols (@, %, $, +, =)',
  },
  {
    value: 'binary',
    label: 'Binary Stream',
    description: 'Exclusively composed of digital 0s and 1s',
  },
  {
    value: 'letters',
    label: 'Letter Grids',
    description: 'Forms characters made of smaller alphabetical matrices',
  },
];

export const PRESET_PHRASES: string[] = [
  'HELLO WORLD',
  'GEMINI AI',
  'CYBERPUNK',
  'REACT JS',
  '1337 CODE',
  'MATRIX',
  'RETRO',
  'CREATIVE',
  'ASCII ART',
];

export const INITIAL_WELCOME_ART = `
     _  ____   ____ ___ ___      _     ____ _____   ____ _____ _   _ ____ ___ ___  
    / \\/ ___| / ___|_ _|_ _|    / \\   |  _ \\_   _| / ___|_   _| | | |  _ \\_ _/ _ \\ 
   / _ \\___ \\| |    | | | |    / _ \\  | |_) || |   \\___ \\ | | | | | | | | || | | | 
  / ___ \\__) | |___ | | | |   / ___ \\ |  _ < | |    ___) || | | |_| | |_| || | |_| 
 /_/   \\_\\____/ \\____|___|___/_/   \\_\\|_| \\_\\|_|   |____/ |_|  \\___/|____/___\\___/ 
                                                                                   
                                                     🚀 Press Generate to begin...
`;
