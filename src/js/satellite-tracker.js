
let previousdistancedoppler = null;
const compassCircle = document.querySelector(".compass-circle");
const compassbackground = document.getElementById('compass-backgroundsvg');

const myPoint = document.querySelector(".my-point");
const startBtn = document.querySelector(".start-btn");
const isIOS =
    navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
    navigator.userAgent.match(/AppleWebKit/);

let recordingInterval;
let recordingDuration = 0;

function init() {
    startBtn.addEventListener("click", startCompass);

    if (!isIOS) {
        window.addEventListener("deviceorientationabsolute", handler, true);
    }
}

let currentLang = localStorage.getItem('lang') || 'en';
currentLang = localStorage.getItem('lang')
const recordingTranslations = {
    en: {
        startRecord: "Start record",
        stopRecord: "Stop record",
        downloadAudio: "Download audio"
    }
};
window.onload = function () {

    const urlParams = new URLSearchParams(window.location.search);
    const index = urlParams.get('index');
    const satelliteData = JSON.parse(localStorage.getItem('selectedorbit'));
    const selectedPass = satelliteData[index - 1];
    const trajectoryCtx = document.getElementById('trajectory-canvas').getContext('2d');
    const trajectorySVG = document.getElementById('trajectory-svg');



    let intervalId = -1;

    drawCompassbackground();

    const satelliteName = selectedPass.satelliteName
    const satellites = JSON.parse(localStorage.getItem('satellites'));
    const satellited = satellites.find(s => s.name === satelliteName);


    document.title = '🌎 ' + satelliteName;
    const satelliteTLE1 = satellited.tle[0];
    const satelliteTLE2 = satellited.tle[1];


    if (satelliteName && satelliteTLE1 && satelliteTLE2) {
        const satrec = satellite.twoline2satrec(satelliteTLE1, satelliteTLE2);

        const observerGd = {
            latitude: satellite.degreesToRadians(parseFloat(localStorage.getItem('latitude'))),
            longitude: satellite.degreesToRadians(parseFloat(localStorage.getItem('longitude'))),
            height: parseFloat(localStorage.getItem('altitude')) / 1000
        };

        const currentTime = new Date();

        const entryTime = new Date(selectedPass.entryTime);
        const exitTime = new Date(selectedPass.exitTime);

        const button = document.querySelector('.start-btn');

        button.textContent = 'iOS Device Sensor Authorization';


        const formattedEntryTime = entryTime.toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const formattedExitTime = exitTime.toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const noradId = satelliteTLE2 ? satelliteTLE2.split(' ')[1] : '';
        document.getElementById('satellite-name').textContent = `🛰${selectedPass.satelliteName} [${noradId}]`;
        document.getElementById('satellite-info').textContent = `📍AzNow: ° ElNow: ° 🔝MaxEl：${selectedPass.highestElevation}° `;
        document.getElementById('pass-info').textContent = `🔼Start: ${formattedEntryTime} | 🔽End: ${formattedExitTime} `;
        document.getElementById('time-info').textContent = "";
        document.getElementById('info-btn').textContent = "Sat Freq&Doppler Info";
        document.getElementById('record-btn').textContent = "Record";
        document.getElementById('download-btn').textContent = "🔽Audio";
        document.getElementById('info-btn').textContent = "Sat Freq Info";

        const satelliteElevation = document.getElementById('satellite-elevation');
        satelliteElevation.style.display = 'none';

        trajectoryPoints = drawTrajectorySVG(trajectorySVG, selectedPass, satrec, observerGd);



        setInterval(() => {
            const now = new Date();
            const positionAndVelocity = satellite.propagate(satrec, now);
            const gmst = satellite.gstime(now);

            const positionEci = positionAndVelocity.position;
            const lookAngles = satellite.ecfToLookAngles(
                observerGd,
                satellite.eciToEcf(positionEci, gmst)
            );

            const elevationdg = satellite.radiansToDegrees(lookAngles.elevation).toFixed(2);
            const azimuthdg = satellite.radiansToDegrees(lookAngles.azimuth).toFixed(2);

            const noradId = satelliteTLE2 ? satelliteTLE2.split(' ')[1] : '';
            document.getElementById('satellite-name').textContent = `🛰${selectedPass.satelliteName} [${noradId}]`;
            document.getElementById('satellite-info').textContent = `📍AzNow: ${azimuthdg}° ElNow: ${elevationdg}° | 🔝MaxEl: ${selectedPass.highestElevation}° `;
            document.getElementById('pass-info').textContent = `🔼Start: ${formattedEntryTime} | 🔽End: ${formattedExitTime} `;

            const formattedTime = now.toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            let timeInfo = `🕜${formattedTime}`;

            if (now >= entryTime && now <= exitTime) {
                const timeRemaining = exitTime - now;
                const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
                const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
                timeInfo += `| ⌛End in: ${hours}h ${minutes}m ${seconds}s`;

                updateSatellitePositionsvg(trajectoryPoints);

            } else if (now < entryTime) {
                const timeRemaining = entryTime - now;
                const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
                const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
                timeInfo += `| ⌛Start in: ${hours}h ${minutes}m ${seconds}s`;
                const satelliteElevation = document.getElementById('satellite-elevation');
                satelliteElevation.style.display = 'none';

                const trajectorySvg = document.getElementById('satorbitpointsvg');
                trajectorySvg.innerHTML = '';
            } else if (now > exitTime) {
                timeInfo = `🕜${formattedTime}`;
                const satelliteElevation = document.getElementById('satellite-elevation');
                satelliteElevation.style.display = 'none';

                const trajectorySvg = document.getElementById('satorbitpointsvg');
                trajectorySvg.innerHTML = '';
            }

            document.getElementById('time-info').textContent = timeInfo;
            updateProgressBar(entryTime, exitTime, now);


        }, 1000);
    }
}


function drawCompassbackground() {
    const tickMarksGroup = document.querySelector('.tick-marks');

    while (tickMarksGroup.firstChild) {
        tickMarksGroup.removeChild(tickMarksGroup.firstChild);
    }

    for (let i = 0; i < 360; i += 10) {
        const angle = (i - 90) * (Math.PI / 180);
        const r1 = 140;
        const r2 = i % 90 === 0 ? 125 : 130;

        const x1 = Math.cos(angle) * r1;
        const y1 = Math.sin(angle) * r1;
        const x2 = Math.cos(angle) * r2;
        const y2 = Math.sin(angle) * r2;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("stroke", "gray");
        line.setAttribute("stroke-width", i % 90 === 0 ? "2" : "1");

        tickMarksGroup.appendChild(line);
    }
}

function drawTrajectorySVG(svgContainer, selectedPass, satrec, observerGd) {
    const startTime = new Date(selectedPass.entryTime);
    const endTime = new Date(selectedPass.exitTime);

    const steps = 1000;
    const timeStep = (endTime - startTime) / steps;

    const trajectoryPoints = [];
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const trajectoryColor = '#007aff';
    const arrowColor = isDarkMode ? '#94ff00' : 'red';

    const centerX = 150;
    const centerY = 150;
    const radius = 140;

    // Loop through selectedPass (pass times or observations) and calculate satellite position
    for (let i = 0; i <= steps; i++) {
        const passTime = new Date(startTime.getTime() + i * timeStep);

        // Get the satellite position at this pass time
        const positionAndVelocity = satellite.propagate(satrec, passTime);
        const gmst = satellite.gstime(passTime);
        const positionEci = positionAndVelocity.position;

        // Get the look angles (elevation and azimuth) at this time
        const lookAngles = satellite.ecfToLookAngles(
            observerGd,
            satellite.eciToEcf(positionEci, gmst)
        );

        const elevation = satellite.radiansToDegrees(lookAngles.elevation);
        const azimuth = satellite.radiansToDegrees(lookAngles.azimuth);

        // Only consider valid look angles (elevation between 0 and 90 degrees)
        if (elevation > 0 && elevation <= 90) {
            // Map elevation to a radius on the compass
            const satelliteRadius = radius * (90 - elevation) / 90;

            // Calculate the x, y coordinates of the satellite on the compass
            const satelliteX = centerX + satelliteRadius * Math.cos((90 - azimuth) * (Math.PI / 180));
            const satelliteY = centerY - satelliteRadius * Math.sin((90 - azimuth) * (Math.PI / 180));

            // Store the trajectory points
            trajectoryPoints.push({ x: satelliteX, y: satelliteY, time: passTime, eleva: elevation });
        }
    }

    while (svgContainer.firstChild) {
        svgContainer.removeChild(svgContainer.firstChild);
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let pathData = `M ${trajectoryPoints[0].x},${trajectoryPoints[0].y}`;
    for (let i = 1; i < trajectoryPoints.length; i++) {
        pathData += ` L ${trajectoryPoints[i].x},${trajectoryPoints[i].y}`;
    }
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', trajectoryColor);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    svgContainer.appendChild(path);

    // Function to draw arrows
    function drawArrow(x1, y1, x2, y2, color) {
        const headLength = 10; // Length of the arrowhead
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx);

        // Draw arrow line
        const arrowLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        arrowLine.setAttribute('x1', x1);
        arrowLine.setAttribute('y1', y1);
        arrowLine.setAttribute('x2', x2);
        arrowLine.setAttribute('y2', y2);
        arrowLine.setAttribute('stroke', color);
        arrowLine.setAttribute('stroke-width', '2');
        svgContainer.appendChild(arrowLine);

        // Draw arrowhead
        const arrowHead = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const points = `
            ${x2},${y2} 
            ${x2 - headLength * Math.cos(angle - Math.PI / 6)},${y2 - headLength * Math.sin(angle - Math.PI / 6)}
            ${x2 - headLength * Math.cos(angle + Math.PI / 6)},${y2 - headLength * Math.sin(angle + Math.PI / 6)}
        `;
        arrowHead.setAttribute('points', points);
        arrowHead.setAttribute('fill', color);
        svgContainer.appendChild(arrowHead);
    }

    // Draw arrows at 1/3 and 2/3 of the trajectory
    const oneThirdIndex = Math.floor(trajectoryPoints.length / 2);
    if (trajectoryPoints.length > 2) {
        const arrow1Start = trajectoryPoints[oneThirdIndex - 1];
        const arrow1End = trajectoryPoints[oneThirdIndex];
        drawArrow(arrow1Start.x, arrow1Start.y, arrow1End.x, arrow1End.y, arrowColor);
    }

    return trajectoryPoints;
}


function drawDebugPoint(ctx, x, y, color, label) {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + 5, y - 5);
}

function updateSatellitePositionsvg(trajectoryPoints) {
    const now = new Date();

    let closestPoint = trajectoryPoints[0];
    let minTimeDiff = Math.abs(now - closestPoint.time);

    for (let i = 1; i < trajectoryPoints.length; i++) {
        const timeDiff = Math.abs(now - trajectoryPoints[i].time);
        if (timeDiff < minTimeDiff) {
            closestPoint = trajectoryPoints[i];
            minTimeDiff = timeDiff;
        }
    }

    const elevationBar = document.getElementById('elevation-bar');
    const satelliteElevation = document.getElementById('satellite-elevation');
    satelliteElevation.style.display = 'block';

    const barHeight = elevationBar.offsetHeight - 9;

    if (closestPoint.eleva > 0 && closestPoint.eleva <= 90) {
        const satelliteElevationDistance = (90 - closestPoint.eleva) / 90 * barHeight;
        satelliteElevation.style.top = `${satelliteElevationDistance - satelliteElevation.offsetHeight / 2}px`;
    } else {
        satelliteElevation.style.display = 'none';
    }

    const trajectorySvg = document.getElementById('satorbitpointsvg');
    trajectorySvg.innerHTML = '';

    if (closestPoint.eleva > 0 && closestPoint.eleva <= 90) {
        const centerX = 150;
        const centerY = 150;

        const satellitePoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        satellitePoint.setAttribute('cx', closestPoint.x);
        satellitePoint.setAttribute('cy', closestPoint.y);
        satellitePoint.setAttribute('r', 5);
        satellitePoint.setAttribute('fill', '#ff001e');
        satellitePoint.setAttribute('stroke', 'black');
        satellitePoint.setAttribute('stroke-width', 2);

        const satelliteLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        satelliteLine.setAttribute('x1', centerX);
        satelliteLine.setAttribute('y1', centerY);
        satelliteLine.setAttribute('x2', closestPoint.x);
        satelliteLine.setAttribute('y2', closestPoint.y);
        satelliteLine.setAttribute('stroke', '#ff001e');
        satelliteLine.setAttribute('stroke-width', 1);

        trajectorySvg.appendChild(satelliteLine);
        trajectorySvg.appendChild(satellitePoint);
    }
}


function startCompass() {
    if (isIOS) {
        DeviceOrientationEvent.requestPermission()
            .then((response) => {
                if (response === "granted") {
                    window.addEventListener("deviceorientation", handler, true);
                } else {
                    alert(response);
                    // alert("has to be allowed!");
                }
            })
            .catch(() => alert("not supported"));
    }
}


function updateProgressBar(entryTime, exitTime, now) {
    const progressBar = document.getElementById('progress-bar');
    const elapsedDisplay = document.getElementById('elapsed-time');
    const remainingDisplay = document.getElementById('remaining-time');

    const totalDuration = exitTime - entryTime;
    const elapsedTime = Math.max(now - entryTime, 0);
    const remainingTime = Math.max(totalDuration - elapsedTime - 1, 0);

    const formatSeconds = ms => Math.round(ms / 1000) + 's';

    elapsedDisplay.textContent = `T+` + formatSeconds(elapsedTime);
    remainingDisplay.textContent = formatSeconds(remainingTime);

    const progressPercentage = Math.min((elapsedTime / totalDuration) * 100, 100);
    progressBar.style.width = `${progressPercentage}%`;
}

function handler(e) {
    const compass = e.webkitCompassHeading || Math.abs(e.alpha - 360);
    let azimuth = compass;

    // Fix rotation past 45 degrees inclination on the iPhone
    const abs_beta = Math.abs(e.beta);
    let rotation = -compass;
    if (abs_beta >= 135) {
        rotation -= 180;
        azimuth += 180;
    }

    // Rotate compass circle
    compassbackground.style.transform = `rotate(${rotation}deg)`;

    // Rotate trajectory canvas
    const trajectoryCanvas = document.getElementById('trajectory-svg');
    trajectoryCanvas.style.transformOrigin = 'center';
    trajectoryCanvas.style.transform = `rotate(${rotation}deg)`;

    const satorbitpointCanvas = document.getElementById('satorbitpointsvg');
    satorbitpointCanvas.style.transformOrigin = 'center';
    satorbitpointCanvas.style.transform = `rotate(${rotation}deg)`;

    // Elevation tracking
    // Control red point visibility based on compass angle
    const elevationBar = document.getElementById('elevation-bar');
    const arrowElevation = document.getElementById('arrow-elevation');

    const barHeight = elevationBar.offsetHeight - 9;

    // Select handheld or mounted phone mode
    const settings = JSON.parse(localStorage.getItem('settings')) ?? {};
    const isPhoneMounted = settings?.phoneMounted || false;

    if (isPhoneMounted) {
        if (abs_beta > 90) {
            adjustedBeta = 90;
        } else if (abs_beta <= 0) {
            adjustedBeta = 0;
        } else {
            adjustedBeta = abs_beta;
        }
    } else {
        if (abs_beta > 180) {
            adjustedBeta = 90;
        } else if (abs_beta <= 90) {
            adjustedBeta = 0;
        } else {
            adjustedBeta = abs_beta-90;
        }
    }
    
    const elevationDistance = (90 - adjustedBeta) / 90 * barHeight;

    arrowElevation.style.top = `${elevationDistance - arrowElevation.offsetHeight / 2}px`;

    const azimuthDisplay = document.getElementById('azimuth-degrees');
    azimuthDisplay.innerHTML = `<p>Azimuth: ${azimuth.toFixed(2)}°</p>`;
    const elevationDisplay = document.getElementById('elevation-degrees');
    elevationDisplay.innerHTML = `<p>Elevation: ${adjustedBeta.toFixed(2)}°</p>`;
}

if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', function (event) {
        alpha = event.alpha,
        beta = event.beta,
        gamma = event.gamma;

        // Update arrow and compass position
        handler(event);
    }, false);
} else {
    document.querySelector('body').innerHTML = 'Failed to orient';
}


document.addEventListener('DOMContentLoaded', function () {
    const infoButton = document.querySelector('.info-btn');
    const popup = document.getElementById('popup');
    const closeButton = document.getElementById('close-btn');
    const satelliteInfo = document.getElementById('satellite-feqinfo');
    const urlParams = new URLSearchParams(window.location.search);
    const index = urlParams.get('index');

    infoButton.addEventListener('click', function () {
        const satelliteData = JSON.parse(localStorage.getItem('selectedorbit'));
        const selectedPass = satelliteData[index - 1];
        const satelliteName = selectedPass.satelliteName
        const satellites = JSON.parse(localStorage.getItem('satellites'));
        const satellited = satellites.find(s => s.name === satelliteName);

        // Fetch the selected satellite NORAD catalog ID from localStorage
        const selectedSatelliteTLE2 = satellited.tle[1];
        const selectedsat = satelliteName
        if (!selectedSatelliteTLE2) {
            alert('No satellite selected');
            return;
        }

        // Extract the NORAD catalog ID from TLE2 string (assuming it's the second part)
        const noradCatId = selectedSatelliteTLE2.split(' ')[1];
        // Check if we already have frequency information for this NORAD catalog ID in localStorage
        const storedData = localStorage.getItem('freqinfo');
        const freqInfo = storedData ? JSON.parse(storedData) : {};

        // Show loading text before fetching data
        satelliteInfo.innerHTML = '<p>Loading...</p>';

        // If we have data for this NORAD catalog ID, use it
        if (freqInfo[noradCatId]) {
            displayFrequencyData(freqInfo[noradCatId], selectedsat);
        } else {
            // Otherwise, fetch data from the API
            fetchSatelliteData(noradCatId, selectedsat);
        }

        // Show the popup
        popup.style.display = 'block';
    });

    // Close the popup when the close button is clicked
    closeButton.addEventListener('click', function () {
        popup.style.display = 'none';
    });

    // Close the popup if user clicks outside the popup content
    window.addEventListener('click', function (event) {
        if (event.target === popup) {
            popup.style.display = 'none';
        }
    });

    // Function to fetch data from the API
    // Function to fetch data from the local JSON file
    function fetchSatelliteData(noradCatId, selectedsat) {
        // Load the JSON data from the local file
        fetch('/satellite_data/transmitters.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load transmitters.json');
                }
                return response.json();
            })
            .then(allData => {
                if (!Array.isArray(allData)) {
                    console.error('transmitters.json does not contain an array');
                    satelliteInfo.innerHTML = '<p>Error: Invalid data format in transmitters.json</p>';
                    return;
                }

                console.log(`Total transmitters loaded: ${allData.length}`);
                console.log(`Looking for NORAD ID: ${noradCatId}`);

                const targetId = Number(noradCatId);

                // Filter data for the specific NORAD ID
                const filteredData = allData.filter(item => {
                    const itemId = Number(item.norad_cat_id);
                    return itemId === targetId;
                });

                console.log(`Found ${filteredData.length} transmitters for NORAD ${noradCatId}`);

                if (filteredData.length === 0) {
                    const freqInfo = JSON.parse(localStorage.getItem('freqinfo') || '{}');
                    freqInfo[noradCatId] = [];
                    localStorage.setItem('freqinfo', JSON.stringify(freqInfo));

                    displayFrequencyData([], selectedsat);
                } else {
                    const freqInfo = JSON.parse(localStorage.getItem('freqinfo') || '{}');
                    freqInfo[noradCatId] = filteredData; // Store the data under the noradCatId
                    localStorage.setItem('freqinfo', JSON.stringify(freqInfo));
                    displayFrequencyData(filteredData, selectedsat);
                }
            })
            .catch(error => {
                console.error('Error loading satellite data:', error);
                displayFrequencyData([], selectedsat);
            });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const recordBtn = document.getElementById('record-btn');

    const downloadBtn = document.getElementById('download-btn');

    let isRecording = false;
    let mediaRecorder;
    let audioChunks = [];
    let audioBlob;
    let audioUrl;
    let audioFile;
    let fileSizeInMB = 0;

    // Function to handle recording button
    recordBtn.addEventListener('click', function () {
        if (isRecording) {
            // Stop recording  
            mediaRecorder.stop();
            recordBtn.textContent = recordingTranslations[currentLang].startRecord;
            downloadBtn.style.display = 'inline-block';
        } else {
            // Start recording  
            recordBtn.textContent = recordingTranslations[currentLang].stopRecord;
            startRecording();

            audioChunks = [];
            fileSizeInMB = 0;
            downloadBtn.style.display = 'none';
        }
        isRecording = !isRecording;
    });

    // Function to update recording status (size and duration)
    function updateRecordingStatus(audioChunks) {
        recordingInterval = setInterval(() => {
            const currentSize = audioChunks.reduce((total, chunk) => total + chunk.size, 0) / (1024 * 1024);
            recordingDuration += 1;

            const statusDisplay = document.getElementById('record-btn');
            if (statusDisplay) {
                const stopText = recordingTranslations[currentLang].stopRecord;
                statusDisplay.textContent = `${stopText}(${currentSize.toFixed(2)} MB, ${recordingDuration}s)`;
            }
        }, 1000);
    }

    function stopRecordingStatus() {
        clearInterval(recordingInterval);
        recordingDuration = 0;
    }

    // Function to start recording
    function startRecording() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function (stream) {
                let mimeType = 'audio/webm';
                const supportedTypes = [
                    'audio/mpeg',
                    'audio/wav',
                    'audio/mp3',
                    'audio/mp4',
                    'audio/webm;codecs=opus'
                ];

                for (const type of supportedTypes) {
                    if (MediaRecorder.isTypeSupported(type)) {
                        mimeType = type;
                        break;
                    }
                }

                mediaRecorder = new MediaRecorder(stream, {
                    mimeType
                });

                mediaRecorder.start(1000);

                mediaRecorder.ondataavailable = function (event) {
                    audioChunks.push(event.data);
                };

                updateRecordingStatus(audioChunks);

                mediaRecorder.onstop = function () {
                    stream.getTracks().forEach(track => track.stop());
                    stopRecordingStatus();

                    const audioBlob = new Blob(audioChunks, { type: mimeType });
                    const audioUrl = URL.createObjectURL(audioBlob);

                    const extensions = {
                        'audio/webm;codecs=opus': 'webm',
                        'audio/webm': 'webm',
                        'audio/mp4': 'mp4',
                        'audio/mp3': 'mp3',
                        'audio/mpeg': 'mp3',
                        'audio/wav': 'wav'
                    };
                    const extension = extensions[mimeType] || 'webm';

                    const filename = `${getSatelliteName()}-${getCurrentTimestamp()}.${extension}`;

                    const fileSizeInMB = audioBlob.size / (1024 * 1024);

                    const downloadText = recordingTranslations[currentLang].downloadAudio;
                    downloadBtn.textContent = `${downloadText} - ${fileSizeInMB.toFixed(2)}MB`;

                    localStorage.setItem('audioUrl', audioUrl);
                    localStorage.setItem('audioFilename', filename);

                    downloadBtn.removeEventListener('click', downloadAudio);
                    downloadBtn.addEventListener('click', downloadAudio);
                };
            })
            .catch(function (error) {
                console.error("Error accessing audio devices:", error);
            });
    }

    function downloadAudio() {
        const link = document.createElement('a');
        link.setAttribute('href', localStorage.getItem('audioUrl'));
        link.setAttribute('download', localStorage.getItem('audioFilename'));
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Function to get the satellite name (you can replace this logic with actual satellite name)
    function getSatelliteName() {
        return localStorage.getItem('selectedSatelliteName') || 'Satellite';
    }

    // Function to get the current timestamp
    function getCurrentTimestamp() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}_${String(now.getMinutes()).padStart(2, '0')}_${String(now.getSeconds()).padStart(2, '0')}`;
    }
});

var lastBeep = null;
var beeps = 0;
var beepTimer;
// Function to start tracking Doppler frequency
function startTrackingDoppler(downlink_low, uplink_low, description) {

    const closeButton = document.getElementById('close-btn');
    closeButton.click();

    // Clear any previous intervals
    if (window.dopplerInterval) {
        clearInterval(window.dopplerInterval);
    }

    // Set interval to update Doppler every second (1000ms)
    window.dopplerInterval = setInterval(() => {
        updateDoppler(downlink_low, uplink_low, description);
    }, 1000);

}

// Function to format frequency to MHz (e.g., 136650000 => 136.650 MHz)
function formatFrequency(freq) {
    return freq ? (freq / 1000000).toFixed(3) + ' MHz' : 'N/A';
}

function updateDoppler(downlink_low, uplink_low, description) {
    const isManual = description === 'manual';

    if (uplink_low === 'null') {
        uplink_low = null;
    }

    const now = new Date();

    const satelliteData = JSON.parse(localStorage.getItem('selectedorbit'));
    const satellites = JSON.parse(localStorage.getItem('satellites'));
    const observerGd = {
        latitude: satellite.degreesToRadians(parseFloat(localStorage.getItem('latitude'))),
        longitude: satellite.degreesToRadians(parseFloat(localStorage.getItem('longitude'))),
        height: parseFloat(localStorage.getItem('altitude')) / 1000
    };

    const satelliteName = satelliteData[0].satelliteName;
    const satellited = satellites.find(s => s.name === satelliteName);
    const satelliteTLE1 = satellited.tle[0];
    const satelliteTLE2 = satellited.tle[1];

    const satrec = satellite.twoline2satrec(satelliteTLE1, satelliteTLE2);

    const positionAndVelocity = satellite.propagate(satrec, now);
    const gmst = satellite.gstime(now);
    const positionEci = positionAndVelocity.position;
    const velocityEci = positionAndVelocity.velocity;

    const positionEcf = satellite.eciToEcf(positionEci, gmst);
    const velocityEcf = satellite.eciToEcf(velocityEci, gmst);

    const observerEcf = satellite.geodeticToEcf(observerGd);


    const dopplerFactor = satellite.dopplerFactor(observerEcf, positionEcf, velocityEcf);

    const dopplerShiftDownlink = dopplerFactor * downlink_low;
    const dopplerShiftUplink = dopplerFactor * uplink_low;

    const dx = positionEcf.x - observerEcf.x;
    const dy = positionEcf.y - observerEcf.y;
    const dz = positionEcf.z - observerEcf.z;

    const distancedoppler = Math.sqrt(dx * dx + dy * dy + dz * dz);
    let directionup = '';
    let directiondown = '';

    const urlParams = new URLSearchParams(window.location.search);
    const index = urlParams.get('index');

    const selectedPass = satelliteData[index - 1];
    const entryTime = new Date(selectedPass.entryTime);
    const exitTime = new Date(selectedPass.exitTime);

    const highestTime = new Date(selectedPass.highestTime);

    if (previousdistancedoppler !== null) {
        if (distancedoppler > previousdistancedoppler) {
            directionup = '+';
            directiondown = '-';
        } else if (distancedoppler < previousdistancedoppler) {
            directionup = '-';
            directiondown = '+';
        }
    }

    previousdistancedoppler = distancedoppler;

    const dopplerShiftDifferencedown = ((dopplerShiftDownlink - downlink_low) / 1000).toFixed(2);
    const dopplerShiftDifferenceup = ((dopplerShiftUplink - uplink_low) / 1000).toFixed(2);
    const nowdopplerShiftDifferencedown = (dopplerShiftDownlink - downlink_low);

    function calculateSSTVReference(timeOffset) {
        const futureTime = new Date(now.getTime() + timeOffset * 1000);

        const futurePosition = satellite.propagate(satrec, futureTime);

        const futuregmst = satellite.gstime(futureTime);
        const futurepositionEci = futurePosition.position;
        const futurevelocityEci = futurePosition.velocity;
        const futurepositionEcf = satellite.eciToEcf(futurepositionEci, futuregmst);
        const futurevelocityEcf = satellite.eciToEcf(futurevelocityEci, futuregmst);

        const observerGd = {
            latitude: satellite.degreesToRadians(parseFloat(localStorage.getItem('latitude'))),
            longitude: satellite.degreesToRadians(parseFloat(localStorage.getItem('longitude'))),
            height: parseFloat(localStorage.getItem('altitude')) / 1000
        };

        const observerEcf = satellite.geodeticToEcf(observerGd);

        const futureDopplerFactor = satellite.dopplerFactor(observerEcf, futurepositionEcf, futurevelocityEcf);

        const futuredopplerShiftDownlink = futureDopplerFactor * parseFloat(downlink_low);
        const dopplerShiftDownlink = dopplerFactor * parseFloat(downlink_low);
        const futuredopplerShiftDifferencedown = (futuredopplerShiftDownlink - parseFloat(downlink_low));
        let currentDownlink;
        if (now >= entryTime && now <= highestTime) {
            currentDownlink = parseFloat(downlink_low) + nowdopplerShiftDifferencedown;
        } else if (now >= highestTime && now <= exitTime) {
            currentDownlink = parseFloat(downlink_low) - nowdopplerShiftDifferencedown;
        }
        let futureDownlink;
        if (futureTime >= entryTime && futureTime <= highestTime) {
            futureDownlink = parseFloat(downlink_low) + futuredopplerShiftDifferencedown;
        } else if (futureTime >= highestTime && futureTime <= exitTime) {
            futureDownlink = parseFloat(downlink_low) - futuredopplerShiftDifferencedown;
        }

        const referenceFreq = ((currentDownlink + futureDownlink) / 2 / 1000000).toFixed(3);
        const maxDeviation = ((futureDownlink - currentDownlink) / 1000).toFixed(3);

        return { referenceFreq, maxDeviation };
    }


    let dopplerInfo = `<span>`;

    if (isManual) {

        dopplerInfo += `<strong>📡 Manual Frequency</strong><br>`;
    } else {
        dopplerInfo += `<strong>📡 ${description}</strong><br>`;
    }

    dopplerInfo += `Distance ${distancedoppler.toFixed(`1`)} km<br>`;

    dopplerInfo += `🔻${(downlink_low / 1000000).toFixed(3)} MHz ${directiondown}${dopplerShiftDifferencedown} kHz <br>`;

    if (uplink_low) {
        dopplerInfo += `🔺${(uplink_low / 1000000).toFixed(3)} MHz ${directionup}${dopplerShiftDifferenceup} kHz<br>`;
    }

    function beep() {
        var duration = 200;
        var frequency = 400;
        var volume = 1;
        var type = 'sine'; 
        var callback = null;

        var audioCtx = new (window.AudioContext || window.webkitAudioContext || window.audioContext);
        var oscillator = audioCtx.createOscillator();
        var gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        if (volume){gainNode.gain.value = volume;}
        if (frequency){oscillator.frequency.value = frequency;}
        if (type){oscillator.type = type;}
        if (callback){oscillator.onended = callback;}
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + ((duration || 500) / 1000));
    }

    if (!isNaN(dopplerShiftDifferencedown) && now >= entryTime && now <= exitTime) {
        const diff = parseInt(dopplerShiftDifferencedown);
        if ([10, 5, 0, -5, -10].includes(diff) && diff != lastBeep) {
            lastBeep = diff;
            
            beepTimer = setInterval(() => {
                beep();
                beeps += 1;
            }, 1000)
        }
    }

    if (beeps >= 3) {
        clearInterval(beepTimer);
        beeps = 0;
    }

    if (!isNaN(dopplerShiftDifferencedown) && now >= entryTime && now <= exitTime) {
        const robot36 = calculateSSTVReference(36);
        const robot72 = calculateSSTVReference(72);
        const pd120 = calculateSSTVReference(127);
        const MartinM1 = calculateSSTVReference(114);
        dopplerInfo += `🖼Robot36: ${robot36.referenceFreq} MHz，FDR:${robot36.maxDeviation} kHz<br>`;
        dopplerInfo += `🖼Robot72: ${robot72.referenceFreq} MHz，FDR:${robot72.maxDeviation} kHz<br>`;
        dopplerInfo += `🖼PD120: ${pd120.referenceFreq} MHz，FDR:${pd120.maxDeviation} kHz<br>`;
        dopplerInfo += `🖼MartinM1: ${MartinM1.referenceFreq} MHz，FDR:${MartinM1.maxDeviation} kHz<br>`;
    }

    dopplerInfo += `</span>`;

    document.getElementById('doppler-info').innerHTML = dopplerInfo;
}

// Function to display frequency data in the popup
function displayFrequencyData(data, selectedsat) {
    const satelliteInfo = document.getElementById('satellite-feqinfo');

    let content = `<h3>${selectedsat}</h3>`;

    currentLang = localStorage.getItem('lang') || 'zh';

    if (!data || data.length === 0) {
        content += `
                <p>No frequency information available for this satellite</p>
                <hr>
            `;

    } else {

        data.forEach(item => {
            content += `
                    <strong>📡${item.description}</strong> 
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0;">
                        <div>
                            <span >🔻 ${formatFrequency(item.downlink_low)}</span>
                            ${item.uplink_low ? `<span style="color: #e74c3c; margin-left: 15px;">🔺 ${formatFrequency(item.uplink_low)}</span>` : ''}
                        </div>
                        <button style="margin-left: 10px; padding: 5px 10px; background-color: #2e71d1; color: white; border: none; border-radius: 5px; cursor: pointer;" 
                                onclick="startTrackingDoppler('${item.downlink_low}', '${item.uplink_low || 'null'}', '${item.description}')">
                            Doppler Display
                        </button>
                    </div>
                    <hr style="margin: 10px 0;">
                `;
        });
    }

    content += `
        <strong style="display: block; margin: 15px 0 10px 0;">Manual Frequency Input</strong>
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0;">
            <div>
                <span >🔻 <input type="number" id="manual-frequency" placeholder="MHz" step="0.001" style="width: 100px; padding: 3px; border: 1px solid #ddd; border-radius: 3px; text-align: center;"> MHz</span>
            </div>
            <button style="margin-left: 10px; padding: 5px 10px; background-color: #2e71d1; color: white; border: none; border-radius: 5px; cursor: pointer;" onclick="startManualDoppler()">
                ${'Doppler Display'}
            </button>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 5px; margin-bottom: 15px;">
            Enter frequency in MHz (e.g., 145.825)
        </p>
    `;
    // Display the content in satelliteInfo
    satelliteInfo.innerHTML = content;
}

function startManualDoppler() {
    const frequencyInput = document.getElementById('manual-frequency');

    if (!frequencyInput.value) {
        alert('Please enter frequency');
        return;
    }

    const frequencyMHz = parseFloat(frequencyInput.value);
    const frequencyHz = frequencyMHz * 1000000;
    const description = 'manual';

    const closeButton = document.getElementById('close-btn');
    closeButton.click();

    startTrackingDoppler(frequencyHz, 'null', description);
}

init();

let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;

const timerBtn = document.getElementById('timer-btn');

timerBtn.addEventListener('click', function () {
    if (!isTimerRunning) {
        startTimer();
        timerBtn.classList.add('running');
    } else {
        resetTimer();
        timerBtn.classList.remove('running');
    }
});

function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerSeconds = 0;
    isTimerRunning = true;
    timerBtn.textContent = '000';

    timerInterval = setInterval(function () {
        timerSeconds++;
        updateTimerDisplay();
    }, 1000);
}

function resetTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    timerSeconds = 0;
    isTimerRunning = false;
    timerBtn.textContent = '000';
}

function updateTimerDisplay() {
    const displaySeconds = timerSeconds % 1000;
    const formattedTime = displaySeconds.toString().padStart(3, '0');
    timerBtn.textContent = formattedTime;

}

window.addEventListener('beforeunload', function () {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
});