// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const { ipcRenderer } = require('electron')

let progressElem;
let labelElem;

ipcRenderer.on('progress', (event, arg) => {
  progressElem && (progressElem.value = arg);
  labelElem && (labelElem.innerText = arg);
});

window.addEventListener('DOMContentLoaded', () => {
  progressElem = document.querySelector('#progress');
  labelElem = document.querySelector('label');
  
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text;
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type]);
  }
})
