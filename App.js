// Imports needed for this file
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom'; // Import routing components
import './App.css';
import logo from './public/safewalk.png';
import { AnimatePresence, motion } from "framer-motion";

function HomePage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 3 }}
      className="HomePage"
    >
      <header className="HomePage-header">
        <img src={logo} className='HomePage-logo' alt="Logo" />
        <h1>Safe Step</h1>
        <Link to="/main" className="HomePage-button">Tap to Start</Link>
      </header>
      </motion.div>
  );
}

function MainPage() {
  const videoRef = useRef(null);
  const [crosswalkDetected, setCrosswalkDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [lastAnnouncement, setLastAnnouncement] = useState(false);
  const [showMessage, setShowMessage] = useState(false); // New state to control message visibility
  const crosswalkMessage = "Crosswalk detected, it is safe to cross.";

  // Function to announce the crosswalk detection status using Web Speech API
  const announceCrosswalk = (message) => {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.pitch = 0.75;
    utterance.rate = 0.9;
    utterance.volume = 2;
    window.speechSynthesis.speak(utterance);
  };

  // useEffect hook to access the user's camera feed on component mount
  useEffect(() => {
    const getVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera: ', err);
      }
    };
    // Calls function to get the video stream
    getVideo();
  }, []);

  // Function to fetch crosswalk detection data from the backend API
  const fetchCrosswalkData = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/crosswalk');
      const data = await response.json();
      setCrosswalkDetected(data.detected);
      setConfidence(data.confidence);
      // If a crosswalk is detected and it hasn't been announced yet, announce it
      if (data.detected && !lastAnnouncement) {
        announceCrosswalk(crosswalkMessage);
        setLastAnnouncement(true);
        setShowMessage(true);
        setTimeout(() => {
          setShowMessage(false);
          setLastAnnouncement(false); 
        }, 5000);
      } else if (!data.detected) {
        setLastAnnouncement(false);
        setShowMessage(false); // Hide message if no crosswalk detected
      }
    } catch (error) {
      console.error("Error fetching crosswalk data:", error);
    }
  }, [lastAnnouncement, crosswalkMessage]);

  // useEffect hook to fetch crosswalk data every second
  useEffect(() => {
    const intervalId = setInterval(fetchCrosswalkData, 1000);
    return () => clearInterval(intervalId);
  }, [fetchCrosswalkData]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }} 
      className="App"
    >  
        <header className="App-header">
        <img src={logo} className='App-logo' alt="Logo" />
        <h1>Safe Step</h1>
      </header>
      <div className="App-camera">
        <video ref={videoRef} autoPlay playsInline />
      </div>
      <div className="output-section">
        <h2>{crosswalkDetected ? 'Safe to cross!' : ''}</h2>
        {crosswalkDetected && showMessage && ( // Only show confidence if crosswalk is detected and the message is displayed
          <p>Confidence: {confidence.toFixed(2)}</p>
        )}
      </div>
    </motion.div>
  );
}

function App() {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/main" element={<MainPage />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;
