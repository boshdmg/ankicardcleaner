An app for cleaning up an AnkiDeck I use for learning Russian

Requires AnkiConnect to be installed and running. Bringing Anki to the foreground makes it run faster.

## Adding audio to cards from wikitionary

```
node soundfinder.js
```

## Cleaning up the deck 

Fixes formatting, removes leech tag from known cards, and checks spelling (currently disabled)

```
node cleanDeck.js
```

## Find hard words

Finds words that have lapsed more than 12 times and have an interval below 7 days

```
node hardwordfinder.js
```

