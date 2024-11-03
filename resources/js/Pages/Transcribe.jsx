import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

const Transcription = ({ transcription, audio_url, error }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcriptionText, setTranscriptionText] = useState(transcription || '');
    const [loading, setLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState(audio_url || null);
    const [language, setLanguage] = useState('en'); // Default to English
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    const waveSurfer = useRef(null);
    const waveContainerRef = useRef(null);
  
    useEffect(() => {
      waveSurfer.current = WaveSurfer.create({
        container: waveContainerRef.current,
        waveColor: 'gray',
        progressColor: '#74a352',
        cursorColor: 'navy',
      });
      return () => waveSurfer.current.destroy();
    }, []);
  
    const startRecording = async () => {
      setTranscriptionText('');
      setLoading(false);
      setAudioUrl(null);
  
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
  
      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };
  
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        audioChunks.current = [];
  
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        waveSurfer.current.load(audioUrl);
        uploadAudio(audioBlob);
      };
  
      mediaRecorder.current.start();
      setIsRecording(true);
    };
  
    const stopRecording = () => {
      mediaRecorder.current.stop();
      setIsRecording(false);
    };
  
    const togglePlayPause = () => {
      if (waveSurfer.current && audioUrl) {
        waveSurfer.current.playPause();
      }
    };

    const uploadAudio = async (audioBlob) => {
      setLoading(true);
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', language); // Include selected language

      try {
        const response = await axios.post('/transcription/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        setTranscriptionText(response.data.transcription);
      } catch (error) {
        setTranscriptionText('An error occurred during transcription.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
  
    return (
        <AuthenticatedLayout
          header={
              <h2 className="text-xl font-semibold leading-tight text-gray-800">
                  Dashboard
              </h2>
          }
      >
          <Head title="Dashboard" />

          <div className="py-12">
              <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                  <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                      <div className="p-6 text-gray-900">
                      <div>
        <h1>Transcription with Audio Visualization</h1>

        <label>
        Select Language:
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </select>
      </label>
  
        <button onClick={startRecording} disabled={isRecording}>
          Start Recording
        </button>
        <button onClick={stopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
  
        <div ref={waveContainerRef} style={{ width: '100%', height: '200px', marginTop: '20px' }}></div>
  
        {audioUrl && (
          <div>
            <button onClick={togglePlayPause} style={{ marginTop: '20px' }}>
              Play / Pause
            </button>
          </div>
        )}
  
        {loading ? <p>Loading transcription...</p> : <p>{transcriptionText}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
                      </div>
                  </div>
              </div>
          </div>
      </AuthenticatedLayout>
      
    );
  };
  
  export default Transcription;
