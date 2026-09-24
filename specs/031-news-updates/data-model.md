# Data Model: News Updates Page

The first release is static editorial content. These entities describe the content
contract without requiring runtime persistence.

## News Page

- **Purpose**: Public collection of platform development updates.
- **Fields**:
  - `title`: page identity shown to visitors; required and visibly identifies News.
  - `description`: short context explaining that the page contains development news;
    required for page orientation.
  - `articles`: ordered list of published News Article entries; contains at least one
    entry for this feature.
- **Relationships**: Contains one or more News Articles.
- **Validation**: The page must be directly loadable, readable on narrow and wide
  viewports, and must not imply unpublished articles are available.

## News Article

- **Purpose**: One published development update.
- **Fields**:
  - `title`: required article heading.
  - `publicationContext`: required visible context identifying the article as the
    first published update and its publication timing.
  - `body`: required readable content.
  - `feedbackInvitation`: required message inviting feedback, suggestions, and wishes.
- **Relationships**: Belongs to the News Page; articles are ordered newest-first as
  future updates are added.
- **Validation**: The first article must announce alpha status, express that the
  author is happy if the platform interests fellow athletes, and explicitly welcome
  feedback, suggestions, and wishes.

## State and Persistence

No runtime state transitions or persistence are introduced. Publication is represented
by the presence of an article in the static News page; future editorial changes remain
within the same page and navigation path.