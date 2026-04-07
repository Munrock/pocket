# Copilot Instructions for pocket

## Colour Usage — MANDATORY RULE

**Directly defining colour values inside CSS files is strictly prohibited.**

This includes (but is not limited to):
- Hex values: `#fff`, `#1a2b3c`
- RGB / RGBA: `rgb(0, 0, 0)`, `rgba(255, 255, 255, 0.5)`
- HSL / HSLA: `hsl(210, 100%, 50%)`
- Named colours: `red`, `white`, `transparent` *(exception: `transparent` is allowed for borders/outlines only)*

### Correct approach

All colours **must** reference a custom property defined in `src/styles/colours.css`:

```css
/* ✅ Correct */
color: var(--colour-text);
background-color: var(--colour-bg-2);
border-color: var(--colour-trim-1);

/* ❌ Prohibited */
color: #c8d0dc;
background-color: #141720;
border-color: #91c4d9;
```

### Adding new colours

If a new colour is genuinely required:
1. Add the custom property to **both** the dark-mode (`:root`) block and the light-mode (`:root[data-theme="light"]`) block in `src/styles/colours.css`.
2. Follow the naming convention: `--colour-{category}-{index}` (e.g. `--colour-bg-5`, `--colour-trim-4`).
3. Reference the new custom property in your CSS — never use the raw value directly.

### Colour custom property categories

| Property prefix     | Purpose                          |
|---------------------|----------------------------------|
| `--colour-text`     | Primary text colour (one value)  |
| `--colour-trim-{n}` | Trim / highlight / accent colours |
| `--colour-warn-{n}` | Warning / error colours          |
| `--colour-bg-{n}`   | Background colours               |
