function csvCell(value) {
  const text = String(value ?? '');
  return /[\r\n",]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function createCsv(headers, rows) {
  return [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
}

function createZipEntry(content, options = {}) {
  return {
    dir: false,
    async: async type => {
      if (options.corrupt) throw new Error('Synthetic corrupt entry');
      if (type === 'uint8array') return Uint8Array.from(Buffer.from(String(content)));
      return String(content);
    }
  };
}

function createMediaZipFixture({
  activityRows = [],
  mediaRows = [],
  mediaFiles = {}
} = {}) {
  const activityCsv = createCsv(
    ['Activity ID', 'Activity Type', 'Activity Date', 'Media'],
    activityRows.map(row => [row.id, row.sport, row.date, row.media])
  );
  const mediaCsv = createCsv(
    ['Media Filename', 'Media Caption'],
    mediaRows.map(row => [row.filename, row.caption])
  );
  const files = {
    'activities.csv': createZipEntry(activityCsv),
    'media.csv': createZipEntry(mediaCsv)
  };

  Object.entries(mediaFiles).forEach(([path, entry]) => {
    files[path] = createZipEntry(entry.content || path, entry);
  });

  return { activityCsv, mediaCsv, zip: { files } };
}

module.exports = { createCsv, createZipEntry, createMediaZipFixture };