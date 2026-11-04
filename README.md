# Welcome to TriAnalytica - my Triathlon Data Visualization Tool!

This dashboard helps you explore training history from Strava, TrainingPeaks, or Apple Health in a simple, browser-based view. Import a Strava export ZIP, an Apple Health export ZIP, or multiple TrainingPeaks Workout Files ZIPs and turn supported activities into charts for training volume, pacing, equipment, and performance trends.

## How it works

To explore immediately, choose **Use exemplary data** on the landing page. It loads
1,600 fictional Run/Bike/Swim activities from 2021-2025, including 923 GPS tracks
around Silicon Valley and nearby training destinations. All non-media analyses,
sport/year filters, and image exports are available. The dashboard and exported
images identify this as synthetic sample training; photos/videos are not fabricated.
See [sample-data/README.md](sample-data/README.md) for sources, licensing and regeneration.

1. Open the app.
2. Choose Strava, TrainingPeaks, or Apple Health on the landing page.
3. Select the provider's original export ZIP. For Apple Health, keep the ZIP intact and do not extract or repackage it. For TrainingPeaks histories longer than 12 months, create period exports of 12 months or less and select all required ZIPs together.
4. Explore the dashboard with your own data.

Selected workout files are processed locally in the browser and are not uploaded or persisted by TriAnalytica. No login is required. The app still makes network requests for third-party libraries, public sample resources and its aggregate analysis counter; workout files and activity fields are not included in the counter request. Sample exploration does not increment the personal-analysis counter. Importing your own data replaces rather than merges with the examples; a failed sample load leaves the prior dataset intact.

See [Apple Health export instructions](docs/apple-health-export-how-to.html), [TrainingPeaks export instructions](docs/trainingpeaks-export-how-to.html) for the provider's Workout Files export flow, and [docs/IMPORT_FEATURE.md](docs/IMPORT_FEATURE.md) for supported data, import behavior, and privacy details.

## Export images

Use a visualization's Export action to prepare a local PNG preview, then select Download. Where supported, a save picker lets you choose the destination and filename. Otherwise the app uses the browser's ordinary download behavior, with the destination controlled by browser settings, normally Downloads.

Click a visualization item to pin its detail tooltip, or tap it on a touch screen. Selecting another item replaces the pin; selecting the same item again, using Close, or pressing Escape releases it. Charts support focused arrow-key inspection and Enter/Space selection; calendar cells and item-level pin buttons use normal keyboard activation. Media pin buttons remain separate from opening an image or selecting a collage item. Changing data filters, switching tabs, or importing replacement data clears the pin; map movement and resizing retain it.

In Lifetime Statistics, select the statistic itself or focus it and press Enter/Space. There are no separate pin-symbol buttons on its statistics.

Pinned detail appears in the export preview and downloaded image as a compact, outlined speech bubble near its selected item, with a tail pointing toward it. If the selected item is outside the visible area or omitted from the export layout, the bubble identifies that distinction without pointing at unrelated content. If the full tooltip does not fit readably, the image uses its complete headline instead; the live tooltip remains complete. The export retains the view and selection present when Export was requested, even if you change the live view during preparation. Without a pin, transient hover tooltips are excluded from the image.

Destination selection and writing can be restricted independently. If writing is denied after a destination was selected, the app hands the complete prepared PNG to the browser's ordinary download route once. The originally selected file may be empty or incomplete; use the PNG from the browser download instead. Genuine storage failures and write safety-check rejections remain errors with a retryable preview, rather than triggering an automatic download.

The export preview and its originating Personal Bests detail close after browser download handoff. If handoff fails, the preview remains available for retry. Browser handoff does not confirm that a file finished saving; later cancellation or storage errors are managed by the browser. Images are prepared and saved locally without uploading the export or activity data.

## Available visualizations

- Total distance over time
  - View training volume by day, week, month, or year
  - Filter by sport: All Sports, Run, Bike, Swim
  - Change the timeframe to focus on recent or long-term trends

- Heart-rate vs pace
  - Compare effort and pace across sessions
  - Filter by sport: All, Run, Bike, Swim
  - Narrow the date range to review a specific period

- Equipment mileage
  - See kilometers by shoe or bike
  - Switch between distance, pace, activity count, and average session length
  - Filter by equipment category: All, Shoes, Bikes
  - For Pace with Shoes or Bikes, choose On fire or Monochrome blue
  - Fire progresses within each bar from the slowest displayed performance (yellow) to the fastest (red), without changing bar lengths; a single item or equal performances stay yellow
  - All keeps the existing shoe/bike type colors; exported images retain the selected eligible Pace scheme

- Equipment timeline
  - Track when each piece of equipment was active
  - Toggle between continuous and activity views
  - Filter by All, Shoes, or Bikes

- Workout Time
  - Switch between Workout number (default), total Duration, and total Distance without changing the existing grouping, sport, or date range
  - Each workout contributes its full recorded values to the field of its local start time, even when it crosses a time boundary
  - Duration uses hours on the axis and cumulative hours/minutes/seconds in detail; distance uses kilometers
  - Detail distinguishes missing measurements from recorded zeros and identifies partial totals; the selected measure is retained for the page session and included in local exports

- Personal Bests
  - Explore new bests for Swim, Run, and Bike
  - Compare progress across target distances and training phases
  - Track most elevation for running and cycling, plus longest swim distance

- GPS route heatmap
  - Explore where you trained using frequency-weighted route lines
  - Read infrequent routes in light blue and the most-traveled routes in red across a logarithmic frequency scale
  - Group recordings of the same route within a 30-meter GPS tolerance while preserving route direction and continuity
  - Hover route lines to inspect all contributing activities or a random sample of ten for frequently traveled routes
  - Filter routes by All Sports, Run, Bike, or Swim
  - Combine sport with All years or an individual represented year; switching filters preserves map zoom

- Pie charts
  - See how your training splits up by sport, duration, pace, equipment, length, or power
  - Size slices by activity count, moving time, or distance
  - Filter by sport: All Sports, Run, Bike, Swim, and choose the "On fire" or "Monochrome blue" color scheme

## Features and filters

The dashboard currently includes the following filters and controls:

- Sport filters: All Sports, Run, Bike, Swim
- Time aggregation: Daily, Weekly, Monthly, Yearly
- Timeframe selectors for different look-back windows
- Heart-rate/pace date range controls
- Equipment metrics: Distance, Pace, Activity Count, Avg Length
- Equipment category filters: All, Shoes, Bikes
- Equipment timeline mode toggle: Continuous, Activities

## Keyboard navigation

- Left and Right switch between available dashboards, including after changing a filter, and wrap at either end.
- Down and Up cycle forward and backward through valid combinations of the active dashboard's finite filters. The last displayed filter changes fastest; navigation wraps after the last combination.
- Manual filter changes become the starting point for the next arrow action. A dashboard without alternative views does not change on Up/Down.
- Text fields, open dialogs, expanded native selection popups, and continuous numeric editing keep their normal arrow-key behavior. Closed finite selectors and checkboxes do not block dashboard switching.
- Existing Tab and Shift+Tab behavior is unchanged. Shortcuts apply only inside the active dashboard workspace.

## Alpha version

This project is currently in alpha.

## News

Read the latest development updates on the [TriAnalytica News page](news.html).
The first article announces the alpha launch and welcomes feedback, suggestions,
and wishes from fellow athletes. You can also use the existing feedback address
shown on the News page to get in touch.

## About

Meet Dennis on the [TriAnalytica About page](about.html) and read the personal
story behind his triathlon, training data, and AI side project.

## Local development

If you want to run the project locally:

```bash
python -m http.server
```

Then open the app in your browser and import your Strava ZIP or TrainingPeaks Workout Files ZIP archives from the landing page.

## Contributing and feedback

Feedback is welcome as development continues. Please send questions and suggestions to [myaidevproject@gmail.com](mailto:myaidevproject@gmail.com).
