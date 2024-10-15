let currentCallId = null;

// Set the announcement based on user input and include the secret code
document.getElementById('setAnnouncement').onclick = () => {
    const meetingDate = document.getElementById('meetingDate').value;
    const meetingTime = document.getElementById('meetingTime').value;
    const meetingDescription = document.getElementById('meetingDescription').value;

    if (meetingDate && meetingTime && meetingDescription) {
        // Generate a secret code if it doesn't already exist
        if (!currentCallId) {
            currentCallId = createSecretCode();
        }

        // Create a new announcement element
        const announcementDiv = document.createElement('div');
        announcementDiv.style.backgroundColor = 'yellow';
        announcementDiv.style.padding = '10px';
        announcementDiv.style.marginBottom = '15px';

        announcementDiv.innerHTML = `
            <strong>Announcement:</strong><br>
            <strong>Date:</strong> ${meetingDate}<br>
            <strong>Time:</strong> ${meetingTime}<br>
            <strong>Description:</strong> ${meetingDescription}<br>
            <strong>Secret Code:</strong> ${currentCallId}
        `;

        // Append the new announcement to the container
        document.getElementById('announcementContainer').appendChild(announcementDiv);

        // Optionally, you can reset the input fields after the announcement is set
        document.getElementById('meetingDate').value = '';
        document.getElementById('meetingTime').value = '';
        document.getElementById('meetingDescription').value = '';

    } else {
        alert('Please fill in all fields before setting the announcement.');
    }
};

// Show the secret code input when creating or joining a meeting
document.getElementById('createMeeting').onclick = () => {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('secretCodeContainer').style.display = 'block';
    currentCallId = createSecretCode(); // Create a secret code
    document.getElementById('secretCode').value = currentCallId; // Display the code for the host
};

document.getElementById('joinMeeting').onclick = () => {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('secretCodeContainer').style.display = 'block';
};

// Back to landing page button
document.getElementById('backToLanding').onclick = () => {
    document.getElementById('secretCodeContainer').style.display = 'none';
    document.getElementById('landingPage').style.display = 'block';
};

// Proceed button to either start or join a meeting
document.getElementById('proceed').onclick = () => {
    const secretCode = document.getElementById('secretCode').value;
    if (currentCallId) {
        startMeeting(currentCallId); // Start meeting as host
    } else {
        joinMeeting(secretCode); // Join meeting as participant
    }
};

// Function to create a secret code
function createSecretCode() {
    const code = Math.random().toString(36).substring(2, 8); // Generates a random code
    return code;
}

// Function to start the meeting
function startMeeting(code) {
    document.getElementById('hostContainer').style.display = 'block'; // Show host view
    document.getElementById('localVideo').style.display = 'block'; // Show local video for host
    initializeVideoStream('localVideo'); // Initialize video stream for host
}

// Function to join the meeting
function joinMeeting(code) {
    document.getElementById('participantContainer').style.display = 'block'; // Show participant view
    document.getElementById('localVideoParticipant').style.display = 'block'; // Show local video for participant
    initializeVideoStream('localVideoParticipant'); // Initialize video stream for participant
}

// Function to initialize video stream
async function initializeVideoStream(videoElementId) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const localVideo = document.getElementById(videoElementId);
        localVideo.srcObject = stream; // Set local video stream
    } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Please allow access to your camera and microphone.');
    }
}

// Function to exit the call
function exitCall() {
    document.getElementById('hostContainer').style.display = 'none';
    document.getElementById('participantContainer').style.display = 'none';
    document.getElementById('landingPage').style.display = 'block';
}

// Add event listeners to buttons
document.getElementById('exitCallButton').addEventListener('click', exitCall);
document.getElementById('exitCallButtonParticipant').addEventListener('click', exitCall);
document.getElementById('endCallButton').addEventListener('click', exitCall);
