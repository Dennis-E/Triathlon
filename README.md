# Welcome to TriAnalytica - my Triathlon Data Visualization Tool!

This dashboard helps you explore your training history from your Strava data in a simple, browser-based view. Upload your Strava export ZIP and turn your activities into clear charts for training volume, pacing, equipment, and performance trends.

## How it works

1. Open the app.
2. Click the Strava Ingest button.
3. Upload your Strava ZIP export.
4. Explore the dashboard with your own data.

Your data stays in the browser. No login is required, and your files are processed locally on your device.

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

- Equipment timeline
  - Track when each piece of equipment was active
  - Toggle between continuous and activity views
  - Filter by All, Shoes, or Bikes

- Personal Bests
  - Explore new bests for Swim, Run, and Bike
  - Compare progress across target distances and training phases

## Features and filters

The dashboard currently includes the following filters and controls:

- Sport filters: All Sports, Run, Bike, Swim
- Time aggregation: Daily, Weekly, Monthly, Yearly
- Timeframe selectors for different look-back windows
- Heart-rate/pace date range controls
- Equipment metrics: Distance, Pace, Activity Count, Avg Length
- Equipment category filters: All, Shoes, Bikes
- Equipment timeline mode toggle: Continuous, Activities

## Alpha version

This project is currently in alpha.

## Local development

If you want to run the project locally:

```bash
python -m http.server
```

Then open the app in your browser and import your Strava ZIP export from the landing page.

## Contributing and feedback

Please use your team's established feedback channel for questions and suggestions.
