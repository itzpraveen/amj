// AMJ — Tweaks island. Renders only the panel; applies choices to the page.
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "Light",
  "accent": "#164F7A",
  "display": "Newsreader",
  "motion": true
}/*EDITMODE-END*/;

const ACCENT_BRAND = "#164F7A"; // sentinel = use per-theme default

function AMJTweaks() {
  const saved = (() => { try { return JSON.parse(localStorage.getItem('amj-tweaks')) || {}; } catch (e) { return {}; } })();
  const [t, setTweak] = useTweaks({ ...TWEAK_DEFAULTS, ...saved });
  const root = document.documentElement;

  React.useEffect(() => { try { localStorage.setItem('amj-tweaks', JSON.stringify(t)); } catch (e) {} }, [t]);

  React.useEffect(() => {
    if (t.theme === 'Dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  }, [t.theme]);

  React.useEffect(() => {
    if (t.accent === ACCENT_BRAND) {
      // defer to the theme's built-in accent
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-hi');
    } else {
      root.style.setProperty('--accent', t.accent);
      const mix = t.theme === 'Dark' ? 'white 12%' : 'black 14%';
      root.style.setProperty('--accent-hi', `color-mix(in oklch, ${t.accent}, ${mix})`);
    }
  }, [t.accent, t.theme]);

  React.useEffect(() => {
    const stack = t.display === 'Cormorant'
      ? '"Cormorant Garamond", Georgia, serif'
      : '"Newsreader", Georgia, "Times New Roman", serif';
    root.style.setProperty('--serif', stack);
  }, [t.display]);

  React.useEffect(() => {
    root.setAttribute('data-motion', t.motion ? 'on' : 'off');
  }, [t.motion]);

  return (
    <TweaksPanel>
      <TweakSection label="Theme" />
      <TweakRadio label="Mode" value={t.theme}
        options={['Light', 'Dark']}
        onChange={(v) => setTweak('theme', v)} />
      <TweakSection label="Brand accent" />
      <TweakColor label="Accent" value={t.accent}
        options={['#164F7A', '#2E7CB8', '#3F8FB0', '#5A7A99']}
        onChange={(v) => setTweak('accent', v)} />
      <TweakSection label="Typography" />
      <TweakRadio label="Display face" value={t.display}
        options={['Newsreader', 'Cormorant']}
        onChange={(v) => setTweak('display', v)} />
      <TweakSection label="Motion" />
      <TweakToggle label="Animations" value={t.motion}
        onChange={(v) => setTweak('motion', v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<AMJTweaks />);
