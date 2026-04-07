/**
 * Rudimentary local-storage persistence.
 * All application preferences are stored as a single JSON object.
 */

export type ColourScheme = 'dark' | 'light';

export interface AppPreferences {
  /** The user's chosen colour scheme. Defaults to 'dark'. */
  colourScheme: ColourScheme;
}

const STORAGE_KEY = 'pocket_preferences';

const DEFAULT_PREFERENCES: AppPreferences = {
  colourScheme: 'dark',
};

/** Read the stored preferences, merging with defaults for any missing keys. */
export function getPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<AppPreferences>) };
    }
  } catch {
    // Ignore JSON parse errors or storage access errors.
  }
  return { ...DEFAULT_PREFERENCES };
}

/** Persist a partial update to the stored preferences. */
export function savePreferences(update: Partial<AppPreferences>): void {
  const current = getPreferences();
  const updated: AppPreferences = { ...current, ...update };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage write errors (e.g. private browsing quota).
  }
}
