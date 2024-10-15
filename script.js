// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC4ascyIlhw04oVgYV7dZoPTA7u98mxvtY",
    authDomain: "uniprospectus-video-conference.firebaseapp.com",
    projectId: "uniprospectus-video-conference",
    storageBucket: "uniprospectus-video-conference.appspot.com",
    messagingSenderId: "200861492189",
    appId: "1:200861492189:web:311449724e11c249f54c34",
    measurementId: "G-44RM0DF06W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app); // Initialize Firestore

// Set up WebRTC peer connection with a STUN server
const servers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
let peerConnections = {};
const localVideo = document.getElementById('localVideo');
const remoteVideos = document.getElementById('remoteVideos');

// Access the user's camera and microphone
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localVideo.srcObject = stream;

        // Add local stream tracks to peer connection when creating a new connection
        const localTracks = stream.getTracks();
        for (const callId in peerConnections) {
            localTracks.forEach(track => {
                peerConnections[callId].addTrack(track, stream);
            });
        }
    })
    .catch(error => console.error('Error accessing media devices:', error));

// Display the remote video stream
function addRemoteStream(stream, callId) {
    const remoteVideo = document.createElement('video');
    remoteVideo.srcObject = stream;
    remoteVideo.autoplay = true;
    remoteVideo.style.width = '300px'; // Set fixed width for remote video
    remoteVideo.style.border = '3px solid #007bff';
    remoteVideo.style.borderRadius = '8px';
    remoteVideo.style.margin = '5px';
    remoteVideos.appendChild(remoteVideo);
}

// Function to create a call (SDP offer)
async function createOffer() {
    const callDoc = firestore.collection('calls').doc();
    const offerCandidates = callDoc.collection('offerCandidates');

    const callIdElement = document.getElementById('callId');
    callIdElement.value = callDoc.id; // Display the call ID to the user

    const peerConnection = new RTCPeerConnection(servers);
    peerConnections[callDoc.id] = peerConnection; // Store the peer connection

    // Send local tracks to the new peer connection
    const localTracks = localVideo.srcObject.getTracks();
    localTracks.forEach(track => peerConnection.addTrack(track, localVideo.srcObject));

    try {
        // Create SDP offer
        const offerDescription = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offerDescription);

        // Save the offer to Firestore
        await callDoc.set({ offer: { type: offerDescription.type, sdp: offerDescription.sdp } });

        // Listen for answer from the peer
        callDoc.onSnapshot((snapshot) => {
            const data = snapshot.data();
            if (data && data.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                peerConnection.setRemoteDescription(answerDescription);
            }
        });

        // Send ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                offerCandidates.add(event.candidate.toJSON());
            }
        };

        // Handle incoming streams
        peerConnection.ontrack = (event) => {
            addRemoteStream(event.streams[0], callDoc.id);
        };
    } catch (error) {
        console.error('Error creating offer:', error);
    }
}

// Function to join a call (SDP answer)
async function joinCall() {
    const callId = document.getElementById('joinId').value;
    const callDoc = firestore.collection('calls').doc(callId);
    const answerCandidates = callDoc.collection('answerCandidates');

    try {
        // Get the offer from Firestore
        const callData = (await callDoc.get()).data();
        if (callData && callData.offer) {
            const offerDescription = new RTCSessionDescription(callData.offer);
            const peerConnection = new RTCPeerConnection(servers);
            peerConnections[callId] = peerConnection; // Store the peer connection

            // Handle incoming streams
            peerConnection.ontrack = (event) => {
                addRemoteStream(event.streams[0], callId);
            };

            await peerConnection.setRemoteDescription(offerDescription);

            // Create SDP answer
            const answerDescription = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answerDescription);

            // Save the answer to Firestore
            await callDoc.update({ answer: { type: answerDescription.type, sdp: answerDescription.sdp } });

            // Send ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    answerCandidates.add(event.candidate.toJSON());
                }
            };

            // Listen for ICE candidates from the caller
            callDoc.collection('offerCandidates').onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const candidate = new RTCIceCandidate(change.doc.data());
                        peerConnection.addIceCandidate(candidate);
                    }
                });
            });
        } else {
            console.error('No offer found for this call ID.');
        }
    } catch (error) {
        console.error('Error joining call:', error);
    }
}

// Add event listeners to the buttons
document.getElementById('createCallButton').addEventListener('click', createOffer);
document.getElementById('joinCallButton').addEventListener('click', joinCall);
