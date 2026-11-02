const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');
const { randomUUID } = require('crypto');
const { routeDistanceKm } = require('../src/sample-data-utils');

const endpoint = 'https://api.openstreetmap.org/api/0.6/map.json';
const retrievedAt = new Date().toISOString().slice(0, 10);

async function loadBox(box) {
  const url = `${endpoint}?bbox=${box.join(',')}`;
  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'TriAnalytica sample-data curator' } });
  } catch (error) {
    const temporary = path.join(os.tmpdir(), `trianalytica-osm-${randomUUID()}.json`);
    try {
      const status = Number(execFileSync('pwsh', ['-NoProfile', '-NonInteractive', '-Command',
        `$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'; $response=Invoke-WebRequest -Uri '${url}' -OutFile '${temporary.replace(/'/g, "''")}' -PassThru -SkipHttpErrorCheck -TimeoutSec 60; [Console]::Write([int]$response.StatusCode)`
      ], { encoding: 'utf8' }).trim());
      const body = fs.readFileSync(temporary, 'utf8');
      response = { ok: status === 200, status, text: async () => body, json: async () => JSON.parse(body) };
    } finally {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
  }
  if (!response.ok) {
    const message = await response.text();
    if (response.status === 400 && message.includes('too many nodes') && box[2] - box[0] > 0.005) {
      const middle = (box[0] + box[2]) / 2;
      return [...await loadBox([box[0], box[1], middle, box[3]]), ...await loadBox([middle, box[1], box[2], box[3]])];
    }
    throw new Error(`${response.status}: ${message.slice(0, 200)}`);
  }
  return (await response.json()).elements;
}

function densePoints(points) {
  const output = [points[0]];
  for (let index = 1; index < points.length; index++) {
    const start = points[index - 1];
    const end = points[index];
    const pieces = Math.max(1, Math.ceil(routeDistanceKm([start, end]) / 0.045));
    for (let piece = 1; piece <= pieces; piece++) {
      output.push(start.map((value, dimension) => Number((value + (end[dimension] - value) * piece / pieces).toFixed(7))));
    }
  }
  return output;
}

function connectWays(ways) {
  const chains = ways.map(way => ({ nodes: way.nodes.slice(), wayIds: [way.id] }));
  let changed = true;
  while (changed) {
    changed = false;
    for (let first = 0; first < chains.length && !changed; first++) {
      for (let second = first + 1; second < chains.length; second++) {
        const left = chains[first];
        const right = chains[second];
        if (left.nodes[0] === left.nodes.at(-1) || right.nodes[0] === right.nodes.at(-1)) continue;
        if (left.nodes.at(-1) === right.nodes.at(-1)) right.nodes.reverse();
        else if (left.nodes[0] === right.nodes[0]) left.nodes.reverse();
        else if (left.nodes[0] === right.nodes.at(-1)) { left.nodes.reverse(); right.nodes.reverse(); }
        if (left.nodes.at(-1) === right.nodes[0]) {
          left.nodes.push(...right.nodes.slice(1));
          left.wayIds.push(...right.wayIds);
          chains.splice(second, 1);
          changed = true;
          break;
        }
      }
    }
  }
  return chains;
}

function provenance(wayIds) {
  return {
    sourceUrl: `https://www.openstreetmap.org/way/${wayIds[0]}`,
    wayIds, retrievedAt, license: 'ODbL-1.0',
    licenseUrl: 'https://opendatacommons.org/licenses/odbl/1-0/',
    attribution: 'OpenStreetMap contributors', swimmingAccessUrl: null
  };
}

async function acquire() {
  const elements = new Map();
  for (const box of [
    [-122.18, 37.42, -122.16, 37.44],
    [-122.09, 37.40, -122.07, 37.43],
    [-122.27, 37.35, -122.20, 37.39],
    [-122.13, 37.43, -122.10, 37.47]
  ]) {
    for (const element of await loadBox(box)) elements.set(`${element.type}-${element.id}`, element);
    console.log(`Acquired ${box.join(',')}`);
  }
  const nodes = new Map(Array.from(elements.values()).filter(element => element.type === 'node')
    .map(node => [node.id, [node.lat, node.lon]]));
  const roads = Array.from(elements.values()).filter(element => element.type === 'way' && element.tags?.name
    && ['path', 'footway', 'cycleway', 'residential', 'tertiary', 'secondary', 'unclassified', 'track', 'living_street'].includes(element.tags.highway)
    && !['private', 'no'].includes(element.tags.access));
  const routes = {};
  const usedNames = new Set();
  for (const sport of ['Run', 'Bike']) {
    const groups = new Map();
    for (const way of roads) {
      if (sport === 'Run' && way.tags.foot === 'no') continue;
      if (sport === 'Bike' && (way.tags.bicycle === 'no' || (way.tags.highway === 'footway' && !['yes', 'designated'].includes(way.tags.bicycle)))) continue;
      if (!groups.has(way.tags.name)) groups.set(way.tags.name, []);
      groups.get(way.tags.name).push(way);
    }
    const candidates = [];
    for (const [name, ways] of groups) {
      if (usedNames.has(name)) continue;
      for (const chain of connectWays(ways)) {
        if (!chain.nodes.every(id => nodes.has(id))) continue;
        const outward = chain.nodes.map(id => nodes.get(id));
        const loop = chain.nodes[0] === chain.nodes.at(-1);
        const points = densePoints(loop ? outward : [...outward, ...outward.slice(0, -1).reverse()]);
        const distanceKm = routeDistanceKm(points);
        if (points.length <= 2000 && distanceKm >= (sport === 'Run' ? 1.5 : 3) && distanceKm <= (sport === 'Run' ? 16 : 90)) {
          candidates.push({ name, sport, points, distanceKm, elevationGain: Math.round(distanceKm * (name.match(/Alpine|Mill|Arastradero|Portola/) ? 18 : 4)),
            provenance: provenance(chain.wayIds) });
        }
      }
    }
    candidates.sort((left, right) => right.distanceKm - left.distanceKm);
    let count = 0;
    for (const candidate of candidates) {
      if (usedNames.has(candidate.name)) continue;
      usedNames.add(candidate.name);
      const id = `${sport.toLowerCase()}-${++count}`;
      routes[id] = { id, ...candidate };
      if (count === 6) break;
    }
    if (count !== 6) throw new Error(`Insufficient connected public ${sport} corridors: ${count}`);
  }
  const lakeElements = await loadBox([-121.853, 37.656, -121.835, 37.668]);
  const lake = lakeElements.find(element => element.type === 'way' && element.tags?.name === 'Shadow Cliffs Lake');
  if (!lake) throw new Error('Shadow Cliffs water geometry missing');
  const lakeNodes = new Map(lakeElements.filter(element => element.type === 'node').map(node => [node.id, [node.lat, node.lon]]));
  const boundary = lake.nodes.map(id => lakeNodes.get(id));
  if (boundary.some(point => !point)) throw new Error('Incomplete lake boundary');
  const northernShore = boundary.slice().sort((left, right) => right[0] - left[0])[0];
  const center = boundary.reduce((sum, point) => [sum[0] + point[0] / boundary.length, sum[1] + point[1] / boundary.length], [0, 0]);
  for (let course = 1; course <= 2; course++) {
    const start = northernShore.map((value, dimension) => value * 0.85 + center[dimension] * 0.15);
    const end = northernShore.map((value, dimension) => value * (course === 1 ? 0.65 : 0.5) + center[dimension] * (course === 1 ? 0.35 : 0.5));
    const points = densePoints([start, end, start]);
    const id = `swim-${course}`;
    routes[id] = { id, name: `Shadow Cliffs synthetic beach drills ${course}`, sport: 'Swim', points,
      distanceKm: routeDistanceKm(points), elevationGain: 0,
      provenance: { ...provenance([lake.id]), swimmingAccessUrl: 'https://www.ebparks.org/parks/shadow-cliffs',
        note: 'Synthetic historical summer drills derived from water geometry, not a navigational course or present-day access guarantee.' } };
  }
  const destination = path.join(__dirname, '../sample-data/routes.json');
  fs.writeFileSync(destination, `${JSON.stringify(routes)}\n`);
  console.log(Object.values(routes).map(route => `${route.id}: ${route.name} (${route.distanceKm.toFixed(2)} km)`).join('\n'));
}

if (require.main === module) acquire().catch(error => { console.error(error.message); process.exitCode = 1; });