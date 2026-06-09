# G-ASCII Art Generator

A sophisticated ASCII art generator that transforms text into artistic visual representations using various styles and character mappings.

## Features

- **Multiple Artistic Styles**: 9 different ASCII art styles including Block, Slant, Bubble, Thin, Gothic, 3D, Shadow, Cyberpunk, and Banner
- **Character Mapping Options**: 5 different character types (Hashes & Slashes, Solid Text-Blocks, Symbol Matrix, Binary Stream, Letter Grids)
- **Custom Prompts**: Add custom instructions for more specific effects
- **Theme Customization**: Choose from Gold, Bronze, Rose, or Silver color themes
- **Responsive Design**: Works beautifully on all device sizes
- **History Tracking**: Save and revisit your previous creations
- **Favorites System**: Mark your favorite ASCII artworks
- **Export Capabilities**: Copy to clipboard or download as text files

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
```
npm install
```
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
```
npm run dev
```
## Usage

1. Enter text in the input field (max 25 characters)
2. Select an artistic style from the options
3. Choose a character mapping type
4. Optionally add custom instructions
5. Click "Generate Art" to create your ASCII artwork
6. Use the copy button to copy to clipboard or download as .txt file

## Configuration Options

### Styles
- **Standard Block**: Thick uppercase structures with aligned proportions
- **Dynamic Slant**: Stylized slanted italics with diagonal geometry
- **Circular Bubble**: Friendly outline letters framed by circular bubbles
- **Clean Thin**: Single stroke minimal aesthetics using neat lines
- **Dark Gothic**: Elaborate angular shapes mimicking historic gothic letters
- **3D Extrusion**: Simulated dimensional projection with shadow offsets
- **Drop Shadow**: Standard characters with offset trailing shadow lines
- **Cyber Futuristic**: Angled, grid-like geometric configurations
- **Banner Flag**: Suspended ribbon characters for titles

### Character Types
- **Hashes & Slashes**: Uses classic combinations like #, /, \, and -
- **Solid Text-Blocks**: Utilizes high-density block symbols (█, ▓, ▒, ░)
- **Symbol Matrix**: Uses keyboard symbols (@, %, $, +, =)
- **Binary Stream**: Exclusively composed of digital 0s and 1s
- **Letter Grids**: Forms characters made of smaller alphabetical matrices

## Project Structure

```
src/
├── App.tsx              # Main application component
├── data.ts              # Configuration options (styles, characters, presets)
├── types.ts             # TypeScript type definitions
└── components/          # Reusable UI components (if any)
```

## API Integration

This application uses the Gemini AI API to generate ASCII art. Make sure to set your `GEMINI_API_KEY` in the `.env.local` file.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.