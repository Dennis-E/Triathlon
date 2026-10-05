# Initial Wordcloud Stop-Word Set

The word utility excludes this fixed initial German/English function-word set after Unicode normalization and case folding. Additions or removals are product-data changes and should be covered by unit tests.

```text
a, an, and, are, as, at, be, been, but, by, das, dass, dem, den, der, des,
die, dies, dieser, dieses, du, ein, eine, einem, einen, einer, eines, er, es,
for, from, für, hat, have, he, her, hier, him, his, ich, im, in, is, it, its,
me, mit, nach, nicht, of, on, or, she, sie, sich, so, the, their, them, then,
there, they, this, to, und, uns, von, was, we, were, what, when, where, which,
who, will, with, would, you, your, zu, zum, zur
```

This is a small, explicit initial list rather than a full linguistic stemmer or multilingual NLP dictionary. It excludes frequent grammatical words while retaining training terms such as `run`, `bike`, `swim`, `tempo`, `interval`, and `long`.
