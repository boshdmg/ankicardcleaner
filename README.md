An app for cleaning up an AnkiDeck I use for learning Russian. Enables adding audio to cards from wikitionary and checking spelling.

Requires AnkiConnect to be installed and running. Bringing Anki to the foreground makes it run faster.

## Adding audio to cards from wikitionary

```
node soundfinder.js
```

## Cleaning up the deck 

Fixes formatting, removes leech tag from known cards, and checks spelling (currently disabled)

```
node russianDeckManager.js
```

## Find hard words

Finds words that have lapsed more than 12 times and have an interval below 7 days

```
node hardwordfinder.js
```

## Create new cards

Add a file called newWords.txt to the root of the project with one word per line.

```
node createNewCards.js
```

##Prompt

I am a Russian language learner. The following is a list of words that I have struggled with. Please help me learn them. Create a set of sentences for me to practice with these words. You make use the top 300 most common words in the Russian language, to help make the sentences more natural. When using one of the works below make the bold and add the stress mark to the word.  For verbs it ok to conjugate them but don't use past tense. Use the words with their most common meaning. Just give one sentence per word. Dont use bullet points.