# MatrixText Component Integration

```tsx
import MatrixText from "/src/components/ui/effects/MatrixText";

// Basic Usage
<MatrixText text="Search - Ctrl+K"
  className="matrix-bg"
  letterInterval={150}
  letterAnimationDuration={300}
  initialDelay={2000}
/>

// With Custom Background
<MatrixText text="Search - Ctrl+K"
  className="matrix-bg bg-gradient-to-brindle-50\% via-transparent from-gray-900 to-gray-800"
  letterAnimationDuration={250}
/>
```

## Usage Instructions
1. Place this component in your search overlay component
2. Use with: `variant="noise"`, `variant="mesh"`, or default `variant="aurora"
3. Adjust animation speed with `letterInterval` (ms) and `initialDelay` (ms)
4. Combine with Tailwind configs:

```css
/* Add to your tailwind.config.ts */
theme.extend.config/
colors
: {
  matrix: {
    green: "#00FF00", // Glowing green
    background: "#002B5C",
    border: "#004396"
  }
}

/* Add modifier classes */
className={
  cn(
    "matrix-bg bg-gradient-to-brindle-50\% via-transparent from-gray-900 to-gray-800",
    "text-matrix-green text-weight-bold",
    "font-copy-medium text-lg md:text-xl"
  )
}
```

## Accessibility Enhancements
Add aria attributes for better accessibility:
```jsx
<MatrixText text="Search - Ctrl+K"
aria-label="Initiate search with Ctrl+K"
arialabel="Search function"
/>
```