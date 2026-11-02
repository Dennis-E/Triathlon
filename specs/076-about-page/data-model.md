# Data Model: Personal About Page

**Feature**: [spec.md](spec.md)

## Model Boundary

This feature adds immutable editorial content and navigation links, not a persisted or runtime application data model. The conceptual fields below describe the static HTML contract; they do not prescribe JavaScript objects, a content service, storage, or a new abstraction.

## Editorial Page

| Field | Value or constraint |
| --- | --- |
| Address | `./about.html` |
| Document language | `en` |
| Encoding | UTF-8 |
| Document title | `About TriAnalytica` |
| Primary heading | Exact greeting from the spec's Content Contract |
| Introduction | All approved opening paragraphs, in supplied order |
| Sections | Exactly three ordered sections, each with its supplied h2 title and paragraphs |
| Closing | The supplied start-line sentence followed by Dennis's sign-off |
| Final action | Visible label `Explore your training`, destination `./index.html` |

**Relationships**: One page contains one introduction, three ordered narrative sections, the closing, and one final action. Its header contains a linked brand logo plus navigation to News and the existing main analysis entry point.

**Validation rules**:

- The [spec's Content Contract](spec.md#content-contract) is the authoritative text; no paraphrasing, omitted paragraphs, invented claims, or dynamically updated dates/counts.
- Exactly one h1 and three h2 headings, in content order. A document title does not add another visible heading.
- HTML character escaping and presentation whitespace may differ, but decoded text, punctuation, and the greeting symbol must match.
- The bracketed action notation becomes an anchor without visible square brackets.
- Body copy includes no new testimonials, counters, signup fields, or biographical imagery.

## Navigation Link

| Location | Accessible label or role | Destination |
| --- | --- | --- |
| Main index header, immediately after News | About | `./about.html` |
| About header brand | Back to TriAnalytica dashboard | `./index.html` |
| About header navigation | News | `./news.html` |
| About header navigation | Back to dashboard | `./index.html` |
| About main, after sign-off | Explore your training | `./index.html` |

**Validation rules**: Native same-tab links, non-empty accessible names, keyboard activation, visible focus, and no training-import/account prerequisite. The existing index logo remains its current landing-action button; it is not replaced with a cross-page link.

## State and Lifecycle

There is no feature-specific mutable state. A direct load renders the complete page. Activating a link performs ordinary document navigation. Main analysis initialization and existing import behaviour remain unchanged. No promise of retained in-memory workouts across document navigation is introduced, and no persistence mechanism is added to achieve it.