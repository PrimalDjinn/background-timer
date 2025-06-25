function getCount() {
  assertChromeAPI();
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage('get-value', (response) => {
      console.log('Received response from get-value:', response);
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

function assertChromeAPI() {
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
    throw new Error("'chrome' API is not available in this environment.");
  }
}


function startWorker() {
  assertChromeAPI();

  chrome.runtime.sendMessage('start-counter', (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error starting counter:', chrome.runtime.lastError);
    } else {
      console.log('Counter started:', response);
    }
  });
}


function updateCounterDisplayVal(value) {
  const counterDisplay = document.getElementById('counterDisplay');
  console.log('Updating counter display with value:', value);
  if (counterDisplay) {
    counterDisplay.textContent = `Counter: ${value}`;
  } else {
    console.warn('Counter display element not found.');
  }
}


function isRunning() {
  assertChromeAPI();
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage('isRunning', (response) => {
      console.log('Received response from isRunning:', response);
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

let timeoutId = null;
function unwatchCounter() {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
    console.log('Counter watching stopped.');
  }
}

async function watchCounter() {
  const timerCallback = async () => {
    try {
      const count = await getCount();
      console.log('Counter value after timeout:', count);
      updateCounterDisplayVal(count);
    } catch (error) {
      console.error('Error getting initial counter value:', error);
    } finally {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(timerCallback, 30000); // Reset the timer for the next callback
    }
  }

  timeoutId = setTimeout(timerCallback, 30000);

  const count = await getCount();
  console.log('Initial counter value:', count);
  updateCounterDisplayVal(count);
  console.log('Starting the worker...');
}


async function init() {
  console.log('Initializing Ifkafin extension...');
  assertChromeAPI();
  watchCounter();
  startWorker();
}

function stop() {
  console.log('Stopping Ifkafin extension...');
  assertChromeAPI();
  unwatchCounter();
  chrome.runtime.sendMessage('stop-counter', (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error stopping counter:', chrome.runtime.lastError);
    } else {
      console.log('Counter stopped:', response);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const demoButton = document.getElementById('demoButton');
  if (!demoButton) {
    console.error('Button with ID "demoButton" not found in the document.');
    return;
  }

  const stopButton = document.getElementById('stopButton');
  if (!stopButton) {
    console.error('Button with ID "stopButton" not found in the document.');
    return;
  }

  const onStart = async function () {
    document.getElementById('result').textContent = 'Button clicked! Ifkafin extension is running!';
    await init()
    demoButton.disabled = true;
  }

  demoButton.addEventListener('click', onStart);

  stopButton.addEventListener('click', () => {
    stop();
    document.getElementById('result').textContent = 'Ifkafin extension stopped.';
    console.log('Ifkafin extension stopped.');

    demoButton.disabled = false;
    stopButton.disabled = true;
  });

  isRunning().then(async (running) => {
    if (running) {
      demoButton.disabled = true;
      stopButton.disabled = false;
      document.getElementById('result').textContent = 'Ifkafin extension is running!';
      watchCounter();
    } else {
      demoButton.disabled = false;
      stopButton.disabled = true;
      document.getElementById('result').textContent = 'Ifkafin extension is not running.';
    }

  }).catch((error) => {
    console.error('Error checking Ifkafin extension status:', error);
    document.getElementById('result').textContent = 'Error checking Ifkafin extension status. ' + error.message;
  });
})