why# Training Dashboard

A web-based application where athletes can upload their Strava data export and explore visualizations of their long-term training effort. The focus is on endurance sports (running, cycling, swimming, etc.) and on building healthy, sustainable training habits, not on social or commercial aspects of Strava.

## Project Overview

This project will:

- Accept Strava data exports (the ZIP file that Strava provides via "Download your data").
- Parse the exported files that contain training and athlete information.
- Provide interactive visualizations of long-term training effort for athletes.
- Ignore non-training data (social interactions, marketing, etc.) at ingest time.

The repository includes a reduced visualization-ready extract in `Data/Dennis/relevant-export_39173135/`.

## Use Case

Target users:

- Athletes (triathlon / running).
- Coaches and parents who want to monitor training volume and trends over months and years.

Key questions this dashboard should answer:

- How much did I train per week/month/year by sport?
- How do intensity, heart rate, and pace evolve over time?
- How is my training load distributed (easy vs hard sessions)?
- How much mileage do I have on each shoe/bike?
- What does my build-up to a race look like compared to previous seasons?

## Data Source: Strava Export

Data comes from Strava's "Download your data" feature. Strava delivers a ZIP archive that includes:

- CSV files (tabular data).
- JSON files (messaging, settings).
- Media assets (images and videos).
- FIT or GPX files (raw activity recordings).

Example reduced visualization dataset: `Data/Dennis/relevant-export_39173135/activities.csv`

This README describes which parts of that export are relevant for the training dashboard and which parts can be ignored when designing the ingest pipeline.

## Relevant Data Files (Training-Focused)

These files contain core information that is useful for long-term training analysis and visualizations.

- `activities.csv`  
  Contains one row per activity with rich metadata. Typical columns (names and exact schema may vary, but the structure is similar):
  - Activity identity: activity ID, date/time, name, sport type (e.g. `Lauf`, `Radfahrt`, `Schwimmen`, `Virtuelle Radfahrt`, strength training).
  - Durations and distances: elapsed time, moving time, distance.
  - Intensity / performance: max and average heart rate, power (watts), relative effort, pace/speed.
  - Elevation: elevation gain, min/max elevation, climb statistics.
  - Training load: calories, training stress / training load fields if available.
  - Context: description text, perceived effort, workout type (race, long run, commute, etc.).
  - Gear: shoe or bike used for the activity.
  - Weather: temperature, wind, precipitation, etc., when available.
  - Links to media: references to `media/...jpg` and `media/...mp4`.
  - References to raw activity files: e.g. `activities/<id>.fit.gz`.

  This is the main source for:
  - Time-series charts (distance, duration, load per week/month).
  - Sport-specific visualizations (running vs cycling vs swimming).
  - Intensity and heart-rate trends.
  - Gear usage over time.

- `profile.csv`  
  Athlete metadata:
  - Athlete ID.
  - Email address.
  - First and last name.
  - Gender.
  - Short description (e.g. team affiliation).
  - Default weight.
  - Consent status for health data and consent timestamp.

  Useful for:
  - Linking uploaded data to a user account in the web app.
  - Displaying basic profile info.
  - Potentially using weight for performance metrics (e.g. W/kg).

- `bikes.csv` / `shoes.csv` / `components.csv`  
  Contains equipment definitions:
  - Bike / shoe IDs and names.
  - Maybe type, brand, and other metadata.
  - Total distance or usage if Strava tracks it.

  Useful for:
  - Visualizations of mileage per shoe / bike.
  - Gear tracking (when should a shoe be replaced).
  - Filtering activities by equipment.

- `routes.csv`, `starred_routes.csv`, `starred_segments.csv`, `segments.csv`  
  Potentially useful, depending on how deep the dashboard should go:
  - Route and segment metadata.
  - Can be used for:
    - Visualizing frequently used routes.
    - Comparing performance on key segments over time.
  - These are optional for initial versions; they can be included later.

- `goals.csv` / `structured_details.csv` / `global_challenges.csv` / `group_challenges.csv`  
  High-level training context:
  - Personal goals and challenge participation.
  - Structured workout metadata (when present).
  - Can be used to:
    - Annotate training timelines with goals and challenges.
    - Show how training volume responds to goals.

  For the first version, these can be treated as optional contextual data. The core dashboard can work without them, but they are relevant for richer insight later.

- `events.csv`  
  Could include races or organized events:
  - Useful for:
    - Highlighting race days and build-up blocks.
    - Comparing training before race events.

- `media/` directory  
  Contains images and videos referenced by activities:
  - Not strictly necessary for training analytics.
  - Nice to have for:
    - Activity detail views with photos.
    - Motivation / storytelling.

  For ingest, the numeric metrics are more important; media can be handled separately and lazily if needed.

- `activities/` directory (e.g. FIT files)  
  Raw activity recordings:
  - Useful if we later need:
    - High-resolution time-series (per-second or per-lap data).
    - Custom metrics not present in `activities.csv`.

  For the initial dashboard, the CSV summary is usually sufficient. Raw FIT files can be considered advanced and optional for version 1.

## Non-Relevant / Ignored Data (For This Project)

These files mostly contain social, communication, account, or marketing information. They are not needed for the planned training analytics and will be ignored when designing the ingest pipeline.

- Social graph and interactions:
  - `followers.csv`
  - `following.csv`
  - `clubs.csv`
  - `memberships.csv`
  - `comments.csv`
  - `posts.csv`
  - `reactions.csv`
  - `blocks.csv`
  - `flags.csv`

  These relate to friends, clubs, kudos, comments, and moderation. They are not relevant for long-term training metrics.

- Messaging and communication:
  - `messaging.json`
  - `intercom_tickets.csv`
  - `support_tickets.csv`

  These include chat, support interactions, and helpdesk data, not training data.

- Commercial and partner data:
  - `orders.csv`
  - `partner_opt_outs.csv`
  - `connected_apps.csv`
  - `applications.csv`

  These relate to purchases, partner integrations, and applications. They are not needed for training visualizations.

- Account preferences and privacy:
  - `email_preferences.csv`
  - `general_preferences.csv`
  - `social_settings.csv`
  - `visibility_settings.csv`
  - `privacy_zones.csv`
  - `contacts.csv`
  - `logins.csv`

  These control how Strava behaves as a product (notifications, privacy, login history, contact imports). For our project, they are only indirectly relevant:
  - We must respect privacy zones and visibility when displaying maps or locations.
  - Apart from that, we do not need to actively ingest or analyze them for training effort.

  For a first version of the dashboard:
  - We will ignore these files in the ingest pipeline.
  - We will still treat location and privacy with care at the visualization level.

## Planned Features (High-Level)

Planned functionality for the web app:

- Upload:
  - Allow athletes to upload the Strava ZIP export.
  - Extract and parse the relevant CSV files and optional FIT files.
  - Validate that the export contains sufficient training data.

- Data Model:
  - Normalize `activities.csv` into an internal schema (athlete, activity, metrics, equipment).
  - Link activities to profile, bikes, shoes, and events.
  - Store only the minimum necessary data for analytics (no social or marketing data).

- Visualizations:
  - Training volume:
    - Distance, duration, and number of activities per week/month/year, by sport.
  - Intensity and load:
    - Heart rate and pace distributions.
    - Relative effort / training load over time.
  - Gear usage:
    - Mileage per shoe and bike.
    - Visual reminders for gear that reaches mileage thresholds.
  - Season / build-up views:
    - Training blocks leading into races or key events.
    - Comparison between seasons.

- Athlete and Coach Views:
  - Athlete perspective: personal dashboard.
  - Coach perspective: view multiple athletes and compare training blocks.

## Roadmap (Conceptual Plan Only)

This section describes the plan; no implementation is done yet.

1. Data Understanding and Schema Design  
   Fully document the structure of `activities.csv`, `profile.csv`, `bikes.csv`, `shoes.csv`, `events.csv`, and optional challenge/goal files.  
   Define an internal schema for:  
   - `Athlete`  
   - `Activity`  
   - `Equipment`  
   - `Event`  
   - `TrainingMetrics` (aggregated per activity).

2. Ingest Pipeline (Ignoring Non-Relevant Files)  
   Implement ZIP upload and safe extraction.  
   Parse only the relevant files:  
   - `activities.csv`, `profile.csv`, `bikes.csv`, `shoes.csv`, `events.csv`, optionally goals/challenges.  
   Explicitly skip:  
   - Social graph, comments, kudos, clubs, messaging, orders, support tickets, marketing preferences.  
   Apply basic validation and anonymization rules (e.g. do not expose exact home address).

3. Storage and API  
   Choose a storage backend (e.g. relational DB or time-series store).  
   Provide APIs for:  
   - Time-series training metrics.  
   - Gear usage stats.  
   - Athlete overview.

4. Frontend Visualizations  
   Implement the dashboard pages:  
   - Overview (current season and lifetime training summary).  
   - Calendar/timeline view.  
   - Gear tracking.  
   - Athlete/coach views.

5. Privacy and Safeguards  
   Add clear consent and terms for athletes.  
   Avoid storing or showing unnecessary personal data.  
   Respect Strava's export semantics and any local privacy regulations.

## Privacy & Security Considerations

Even though we ignore social and commercial data:

- The export still contains personal information (name, email, home area via privacy zones).
- Athletes require special care:
  - Limit who can see detailed data.
  - Provide a way to delete uploads.
  - Consider aggregating or anonymizing location information.

These aspects will be addressed in the design and implementation of the ingest and visualization layers, but are already noted here for future work.
