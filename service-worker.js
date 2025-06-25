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

const USER_ALARM_SET = 'userAlarmSet';
async function setupAlarm() {
    console.log('Setting up the update counter alarm...');
    const alarm = await chrome.alarms.get(ALARM_NAME);
    if (alarm) {
        const val = await chrome.storage.local.get([USER_ALARM_SET]);
        if (val[USER_ALARM_SET]) {
            console.log('Alarm already set, skipping setup.');
            return;
        }

        console.log('Alarm already exists, deleting:', alarm);
        await chrome.alarms.clear(ALARM_NAME);
        console.log('Alarm cleared, setting up a new one.');
    }

    await chrome.alarms.create(ALARM_NAME, {
        periodInMinutes: 1
    });
    await chrome.storage.local.set({ [USER_ALARM_SET]: true });
    console.log('Alarm setup complete.');
    console.log('Alarm will trigger every 1 minute to update the counter.');
    console.log('You can disable the alarm by sending "stop-counter" message.');
}

async function start() {
    // Initialize the counter
    // await chrome.storage.local.set({ counter: 0 });
    const initial = await chrome.storage.local.get(['counter']);
    if (initial.counter === undefined) {
        await chrome.storage.local.set({ counter: 0 });
        console.log('Counter initialized to 0.');
    }

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
    } else if (message === "stop-counter") {
        chrome.alarms.clear(ALARM_NAME).then(() => {
            console.log('Alarm cleared successfully.');
            chrome.storage.local.set({ [USER_ALARM_SET]: false }).then(() => {
                console.log('User alarm set flag cleared.');
                sendResponse('Alarm cleared successfully.');
            }).catch((error) => {
                console.error('Error clearing user alarm set flag:', error);
            });
        }).catch((error) => {
            console.error('Error clearing alarm:', error);
            sendResponse('Error clearing alarm: ' + error.message);
        });
        return true; // Indicates that the response will be sent asynchronously
    } else {
        console.warn('Unknown message type:', message);
        sendResponse('Unknown message type');
    }
});
