// import { useEffect, useRef, useState } from 'react';
// import { RTCPeerConnection, RTCSessionDescription, mediaDevices } from 'react-native-webrtc';
// import io from 'socket.io-client';

// const SERVER_URL = 'http://your-server-ip:5000'; // Replace with your backend IP
// const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// export const useWebRTC = () => {
//   const [localStream, setLocalStream] = useState<any>(null);
//   const [remoteStream, setRemoteStream] = useState<any>(null);
//   const peerConnection = useRef<RTCPeerConnection | null>(null);
//   const socket = useRef(io(SERVER_URL)).current;

//   useEffect(() => {
//     startLocalStream();
//     socket.on('offer', handleOffer);
//     socket.on('answer', handleAnswer);
//     socket.on('ice-candidate', handleNewICECandidate);
//   }, []);

//   const startLocalStream = async () => {
//     const stream = await mediaDevices.getUserMedia({ video: true, audio: true });
//     setLocalStream(stream);
//   };

//   const createOffer = async () => {
//     peerConnection.current = new RTCPeerConnection(ICE_SERVERS);
//     localStream?.getTracks().forEach(track => peerConnection.current?.addTrack(track, localStream));

//     peerConnection.current.ontrack = event => setRemoteStream(event.streams[0]);
//     peerConnection.current.onicecandidate = event => {
//       if (event.candidate) {
//         socket.emit('ice-candidate', event.candidate);
//       }
//     };

//     const offer = await peerConnection.current.createOffer();
//     await peerConnection.current.setLocalDescription(new RTCSessionDescription(offer));
//     socket.emit('offer', offer);
//   };

//   const handleOffer = async (offer: RTCSessionDescription) => {
//     peerConnection.current = new RTCPeerConnection(ICE_SERVERS);
//     peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));

//     localStream?.getTracks().forEach(track => peerConnection.current?.addTrack(track, localStream));

//     const answer = await peerConnection.current.createAnswer();
//     await peerConnection.current.setLocalDescription(new RTCSessionDescription(answer));
//     socket.emit('answer', answer);
//   };

//   const handleAnswer = (answer: RTCSessionDescription) => {
//     peerConnection.current?.setRemoteDescription(new RTCSessionDescription(answer));
//   };

//   const handleNewICECandidate = (candidate: RTCIceCandidate) => {
//     peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
//   };

//   return { localStream, remoteStream, createOffer };
// };
