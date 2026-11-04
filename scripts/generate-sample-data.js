const fs = require('fs');
const path = require('path');
const { validateSamplePayload, routeDistanceKm } = require('../src/sample-data-utils');
const { calculatePowerEffortsForDurations, POWER_DURATIONS } = require('../src/power-pb-utils');

function generateSampleData(routeCatalog) {
  let state = 76;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const routes = JSON.parse(JSON.stringify(routeCatalog));
  for (const route of Object.values(routes)) {
    if (route.sport === 'Swim' && route.distanceKm < 0.5) {
      const circuit = route.points;
      route.laps = route.id === 'swim-1' ? 6 : 8;
      route.points = Array.from({ length: route.laps }, (_, lap) => lap ? circuit.slice(1) : circuit).flat();
      route.distanceKm = routeDistanceKm(route.points);
    }
  }
  const bySport = Object.fromEntries(['Run', 'Bike', 'Swim'].map(sport => [sport,
    Object.values(routes).filter(route => route.sport === sport)]));
  const activities = [];
  const fitBestEffortsByActivityId = {};
  const favorites = [0, 0, 0, 1, 1, 2, 3, 4, 5, 0, 1, 2];
  const schedule = ['Run', 'Bike', 'Swim', 'Run', 'Bike', 'Swim', 'Run', 'Bike', 'Run', 'Swim'];
  const sessionTypes = ['Easy endurance', 'Recovery', 'Tempo', 'Weekend endurance', 'Aerobic intervals', 'Morning training'];

  for (let yearIndex = 0; yearIndex < 5; yearIndex++) {
    const year = 2021 + yearIndex;
    const count = 330 + yearIndex * 10;
    const routeVisits = { Run: 0, Bike: 0, Swim: 0 };
    for (let session = 0; session < count; session++) {
      const sport = schedule[session % schedule.length];
      const day = new Date(Date.UTC(year, 0, 1 + Math.floor(session * 364 / count)));
      if (day.getUTCDay() === 1) day.setUTCDate(day.getUTCDate() - 1);
      const month = day.getUTCMonth();
      const seasonal = Math.sin((month - 2) / 12 * Math.PI * 2);
      const winterRecovery = [0, 1, 11].includes(month) && session % 4 === 0;
      const injuryRecovery = year === 2023 && month === 7 && day.getUTCDate() >= 7 && day.getUTCDate() <= 20;
      if (winterRecovery || injuryRecovery) continue;
      const recovery = Math.floor(session / 6) % 4 === 3;
      const outdoor = sport === 'Swim' ? session % 4 === 0 && month >= 4 && month <= 8
        : session % (sport === 'Bike' ? 3 : 9) !== 0;
      let route = null;
      let routeVisit = -1;
      if (outdoor) {
        routeVisit = routeVisits[sport]++;
        const index = sport === 'Swim' ? routeVisit % 2 : favorites[routeVisit % favorites.length];
        route = bySport[sport][index];
        if (!route) throw new Error(`Missing ${sport} route ${index}`);
      }
      const speed = sport === 'Run' ? 9.5 + yearIndex * 0.35 + random() * 2 + (recovery ? -0.5 : 0.5)
        : sport === 'Bike' ? 24 + yearIndex * 0.8 + random() * 5 + seasonal
          : 2.2 + yearIndex * 0.08 + random() * 0.5;
      const indoorDistance = sport === 'Run' ? 5 + random() * (recovery ? 3 : 8)
        : sport === 'Bike' ? 28 + random() * (recovery ? 12 : 40) : 1.4 + random() * 1.8;
      const distance = route ? route.distanceKm : indoorDistance * (1 + seasonal * 0.18);
      const duration = Math.round(distance / speed * 3600);
      const avgCadence = sport === 'Run' ? Math.round(163 + random() * 14 + yearIndex)
        : sport === 'Bike' ? Math.round(77 + random() * 18) : null;
      const id = `sample-${year}-${String(session + 1).padStart(3, '0')}`;
      let avgWatts = null;
      if (sport === 'Bike') {
        const basePower = Math.round(135 + yearIndex * 12 + random() * 32 + (recovery ? -20 : 10));
        const records = Array.from({ length: duration + 1 }, (_, second) => ({
          tSec: second, distKm: distance * second / duration,
          power: Math.round(basePower + Math.sin(second / 90) * 18
            + (second % 900 < 15 && !recovery ? 220 : 0)
            + (second % 600 < 180 && !recovery ? 45 : 0))
        }));
        avgWatts = Number((records.slice(1).reduce((sum, record) => sum + record.power, 0) / duration).toFixed(1));
        fitBestEffortsByActivityId[id] = {
          powerEfforts: calculatePowerEffortsForDurations(records, POWER_DURATIONS, 1)
            .filter(effort => effort.targetSeconds <= duration)
            .map(effort => ({ ...effort, avgPower: Number(effort.avgPower.toFixed(2)),
              endKm: Math.min(distance, effort.endKm) }))
        };
      }
      const trailUse = route && /trail|ridge/i.test(route.name) && routeVisit % 4 === 0;
      const equipment = sport === 'Run'
        ? yearIndex >= 2 && trailUse ? 'Hoka Speedgoat Trail Shoes'
          : yearIndex < 2 ? 'Coast Road Shoes' : 'Peninsula Road Shoes'
        : sport === 'Bike'
          ? [1, 3].includes(yearIndex) && trailUse ? 'Santa Cruz Mountain Bike'
            : yearIndex < 3 ? 'Foothills Road Bike' : 'Bay Endurance Bike'
          : '';
      activities.push({
        id, name: `${recovery ? 'Recovery' : sessionTypes[session % sessionTypes.length]} ${route ? route.name : sport === 'Swim' ? 'pool technique' : 'indoor training'}`,
        sport, sportRaw: sport, calendarDate: day.toISOString().slice(0, 10),
        localStartTime: `${String(session % 11 === 0 ? 17 : 6 + session % 3).padStart(2, '0')}:${session % 2 ? '30' : '00'}:00`,
        distance, duration, distanceAvailable: true, durationAvailable: true,
        avgHeartRate: Math.round((sport === 'Swim' ? 124 : sport === 'Bike' ? 130 : 140)
          + random() * 20 + (recovery ? -12 : 0) - yearIndex),
        avgCadence, avgWatts, elevationGain: route ? route.elevationGain : 0,
        totalSteps: sport === 'Run' ? Math.round(avgCadence * duration / 60) : null,
        equipment, environment: outdoor ? 'outdoor' : sport === 'Swim' ? 'pool' : 'indoor',
        routeId: route ? route.id : null
      });
    }
  }
  return {
    schemaVersion: 1, datasetId: 'silicon-valley-triathlete-v2', synthetic: true,
    label: 'Synthetic sample training data',
    athlete: { name: 'Alex Morgan (fictional)', region: 'Silicon Valley', sportProfile: 'triathlon' },
    years: [2021, 2022, 2023, 2024, 2025], generation: { seed: 76, version: 2 },
    routes, activities, fitBestEffortsByActivityId
  };
}

if (require.main === module) {
  try {
    if (process.argv.slice(2).some(argument => argument !== '--check')) throw new Error('Unsupported argument');
    const payload = generateSampleData(require('../sample-data/routes.json'));
    validateSamplePayload(payload);
    const output = `${JSON.stringify(payload)}\n`;
    const destination = path.join(__dirname, '../sample-data/silicon-valley-training.json');
    if (Buffer.byteLength(output) > 4 * 1024 * 1024) throw new Error('Sample payload exceeds 4 MiB');
    if (process.argv.includes('--check')) {
      if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== output) throw new Error('Sample output is missing or not reproducible');
    } else fs.writeFileSync(destination, output);
    console.log(JSON.stringify({ activities: payload.activities.length,
      tracks: payload.activities.filter(activity => activity.routeId).length, bytes: Buffer.byteLength(output),
      years: payload.years.map(year => ({ year, activities: payload.activities.filter(activity => activity.calendarDate.startsWith(String(year))).length })) }));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { generateSampleData };