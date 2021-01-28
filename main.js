// Modules to control application life and create native browser window
const { app, BrowserWindow, screen } = require("electron");

// good Promise library
const bluebird = require("bluebird");
const path = require("path");

const pLimit = require("p-limit");

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

function createProgressWindow({ x, y, title }) {
  const win = new BrowserWindow({
    x,
    y,
    width: 280,
    height: 70,
    title,
    webPreferences: {
      contextIsolation: false,
      devTools: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");

  return win;
}

async function downloadFile({ speed = 10, fileName }) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const win = createProgressWindow({
    x: rnd(200, width - 450),
    y: rnd(150, height - 300),
    title: fileName, 
  });

  console.log("starting loading", fileName);
  console.time(fileName);
  for (let i = 0; i <= 100; i += 2) {
    win.webContents.send("progress", i);

    win.setProgressBar(i / 100);

    await bluebird.delay(speed);
  }
  console.timeEnd(fileName);

  win.close();
}

async function queue(limit, data, fn, cb = () => {}) {
  const promises = [];
  let counter = 0;
  let ready = 0;

  const next = () =>
    (counter < data.length) &&
    fn(data[counter++]).then(() => cb(++ready)).then(next);

  for (let i = 0; i < limit; i++) {
    promises.push(next());
  }

  await bluebird.all(promises);
}

async function v1(limit, data, fn) {
  let i = 0;
  let loading = 0;

  while (i < data.length) {
    const promises = [];

    while (loading < limit) {
      promises.push(fn(data[i]).then(() => loading--));
      i += 1;
      loading++;
      if (i >= data.length) break;
    }

    await Promise.all(promises);
  }
}

(async () => {
  await app.whenReady();
  app.on("window-all-closed", () => { /* app.quit() */ });

  const data = Array(16).fill().map((v, i) => ({
    speed: rnd(10, 30),
    fileName: `File ${i + 1}`,
  }));

  console.log('trying custom v1 function');
  process.stdout.write('\r3')
  await bluebird.delay(1000);
  process.stdout.write('\r2')
  await bluebird.delay(1000);
  process.stdout.write('\r1')
  await bluebird.delay(1000);
  await v1(5, data, downloadFile);

  console.log('trying another way: p-limit module');
  process.stdout.write('\r3')
  await bluebird.delay(1000);
  process.stdout.write('\r2')
  await bluebird.delay(1000);
  process.stdout.write('\r1')
  await bluebird.delay(1000);

  // p-limit module
  const limit = pLimit(5);
  await Promise.all(data.map(item => limit(() => downloadFile(item))));

  console.log('trying custom way 2: queue function');
  process.stdout.write('\r3')
  await bluebird.delay(1000);
  process.stdout.write('\r2')
  await bluebird.delay(1000);
  process.stdout.write('\r1')
  await bluebird.delay(1000);

  await queue(5, data, downloadFile, (i) => {
    console.log("queue progressing:", i, "of total", data.length);
  });

  // exit main app
  app.quit();
})().catch(console.error);
