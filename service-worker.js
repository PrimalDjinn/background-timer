const ALARM_NAME = 'updateCounterAlarm';


function updateCounter() {
    chrome.storage.local.get(['counter'], function (result) {
        let counter = result.counter || 0;
        counter++;
        chrome.storage.local.set({ counter: counter }, function () {
            console.log('Counter updated to:', counter);
        });
    });
}

async function setupAlarm() {
    const alarm = await chrome.alarms.get(ALARM_NAME);
    if (!alarm) {
        console.log('Setting up the update counter alarm...');
        await chrome.alarms.create(ALARM_NAME, {
            periodInMinutes: 1 // Update every minute
        });
    }
}

async function start() {
    // Initialize the counter
    await chrome.storage.local.set({ counter: 0 });

    // Set up the alarm to update the counter
    await setupAlarm();

    // Listen for alarm events
    chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === ALARM_NAME) {
            updateCounter();
        }
    });


    updateCounter(); // Initial update to set the counter to 1
    console.log('Extension setup complete.');
}


chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    console.log('Received message:', message);

    if (message === 'start-counter') {
        sendResponse('success');
        start();
    } else if (message === 'isRunning') {
        chrome.alarms.get(ALARM_NAME).then((alarm) => {
            sendResponse(alarm !== undefined);
        });
        return true;
    } else if (message === "get-value") {
        chrome.storage.local.get(['counter'], function (result) {
            sendResponse(result.counter || 0);
        });
        return true;
    }
});
