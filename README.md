# Wordle Blue

A self-contained, dependency-free clone of Wordle — guess a 5-letter word in 6 tries, with green/yellow/grey feedback and a blue color theme.

## Features

- 6 guesses to find a random 5-letter word
- Tiles turn **green** (right letter, right spot) or **yellow** (right letter, wrong spot) on submit, with correct handling of repeated letters
- Type with your physical keyboard or the on-screen keyboard — both stay in sync
- Guesses are checked against a real word list (obscure real words are accepted, gibberish is rejected)
- Reveals the answer if you run out of guesses
- **Stats**, tracked and saved in your browser: games played, win %, current streak, max streak, and how many games you've won in 1–6 guesses — shown automatically at the end of each game, or anytime via the **Stats** button

## Playing it

No build step or server required — just open [`index.html`](index.html) in a browser.

Stats are saved via the browser's `localStorage`, which works more reliably when the page is served over `http://` rather than opened directly as a `file://` path. To serve it locally:

```bash
python -m http.server 8000
```

then visit `http://localhost:8000`.

## Project structure

| File | Purpose |
| --- | --- |
| [`index.html`](index.html) | Page structure: tile grid, on-screen keyboard, stats modal |
| [`style.css`](style.css) | Styling, animations, and the blue color theme |
| [`script.js`](script.js) | Game logic, input handling, scoring, and stats persistence |
| [`words.js`](words.js) | Word lists: possible solutions and accepted guesses |

## Word lists

- Solutions: [cfreshman's Wordle answers list](https://gist.github.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b) (2,315 words)
- Accepted guesses: [tabatkins/wordle-list](https://github.com/tabatkins/wordle-list) (14,855 words)
