import { useState, useEffect } from 'react'
import { getPreferences, savePreferences } from './storage'
import type { ColourScheme } from './storage'
import './App.css'

function applyTheme(scheme: ColourScheme) {
  document.documentElement.setAttribute('data-theme', scheme)
}

function App() {
  const [colourScheme, setColourScheme] = useState<ColourScheme>(() => {
    const prefs = getPreferences()
    applyTheme(prefs.colourScheme)
    return prefs.colourScheme
  })

  useEffect(() => {
    applyTheme(colourScheme)
    savePreferences({ colourScheme })
  }, [colourScheme])

  return (
    <main className="home">
      <h1 className="home__title">Pocket</h1>
      <div className="home__controls">
        <button
          className={`scheme-btn${colourScheme === 'dark' ? ' scheme-btn--active' : ''}`}
          onClick={() => setColourScheme('dark')}
          aria-pressed={colourScheme === 'dark'}
        >
          Dark
        </button>
        <button
          className={`scheme-btn${colourScheme === 'light' ? ' scheme-btn--active' : ''}`}
          onClick={() => setColourScheme('light')}
          aria-pressed={colourScheme === 'light'}
        >
          Light
        </button>
      </div>
    </main>
  )
}

export default App
