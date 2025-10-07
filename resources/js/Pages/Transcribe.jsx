import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

import RecordingButton from '@/Components/RecordingButton';
import LanguageSelect from '@/Components/LanguageSelect';
import MicrophoneSelect from '@/Components/MicrophoneSelect';

const Transcription = ({ transcription, audio_url, error }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState(transcription || '');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(audio_url || null);
  const [language, setLanguage] = useState('en'); // Default to English
  const [selectedMicrophone, setSelectedMicrophone] = useState('');
  const [transcriptionId, setTranscriptionId] = useState(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const waveSurfer = useRef(null);
  const waveContainerRef = useRef(null);
  const [generatingId, setGeneratingId] = useState(null);

  useEffect(() => {
    waveSurfer.current = WaveSurfer.create({
      container: waveContainerRef.current,
      waveColor: '#d1d5db',
      progressColor: '#74A352',
      cursorColor: '#74A352',
    });
    return () => waveSurfer.current.destroy();
  }, []);

  const startRecording = async () => {
    setTranscriptionText('');
    setLoading(false);
    setAudioUrl(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedMicrophone ? { exact: selectedMicrophone } : undefined },
      });
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
    } catch (error) {
      console.error('Failed to access microphone:', error);
      alert('Could not access your microphone. Please check permissions or select a different microphone.');
    }
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
    formData.append('language', language);

    try {
      const response = await axios.post('/transcription/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setTranscriptionText(response.data.transcription);
      console.log(response.data);
      setTranscriptionId(response.data.id); // Assuming the response contains the transcription ID
    } catch (error) {
      setTranscriptionText('An error occurred during transcription.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const shareTranscription = () => {
    if (transcriptionId) {
      const siteUrl = window.appUrl || 'http://localhost'; // Default to localhost if not set
      const shareUrl = `${siteUrl}/p/transcription/${transcriptionId}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Transcription URL copied to clipboard!');
      });
    }
  };

  const generateTicket = async () => {
    if (!transcriptionId) return;
    try {
      setGeneratingId(transcriptionId);
      const response = await axios.post(`/transcription/${transcriptionId}/generate-ticket`);
      const { card_url, card_id } = response.data || {};
      if (card_url) {
        window.open(card_url, '_blank');
      } else {
        alert('Ticket generado, pero no se pudo obtener la URL de Trello.');
      }
    } catch (error) {
      console.error('Error generando ticket:', error);
      alert('Ocurrió un error al generar el ticket.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleMicrophoneChange = (deviceId) => {
    setSelectedMicrophone(deviceId);
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
          Start Transcribing
        </h2>
      }
    >
      <Head title="Start Transcribing" />
      <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <div className="bg-white p-6 shadow sm:rounded-lg">
            <header className="grid grid-cols-5 gap-4">
              
              <div className="col-span-5 sm:col-span-1">
              <MicrophoneSelect onMicrophoneChange={handleMicrophoneChange} />
                
              </div>
              
              <div className="col-span-5 sm:col-span-1">
                <LanguageSelect value={language} onChange={handleLanguageChange} />
              </div>
              <div className="col-span-5 sm:col-span-1"></div>
              <div className="col-span-5 sm:col-span-2">
                <RecordingButton
                  startRecording={startRecording}
                  stopRecording={stopRecording}
                  isRecording={isRecording}
                />
              </div>
            </header>
            
            <div ref={waveContainerRef} style={{ width: '100%', height: '200px', marginTop: '20px' }}></div>
            <div className="text-center flex flex-wrap justify-center gap-2 sm:gap-3">
              {audioUrl && (
                <button
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded border border-indigo-600 bg-indigo-600 px-4 sm:px-12 py-2 sm:py-3 text-sm font-medium text-white hover:bg-transparent hover:text-indigo-600 focus:outline-none focus:ring active:text-indigo-500"
                  onClick={togglePlayPause}
                >
                  <span>Play / Pause</span>
                  <svg
                    className="inline-block w-4 h-4 ml-1"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.6 5.2A1 1 0 0 0 7 6v12a1 1 0 0 0 1.6.8l8-6a1 1 0 0 0 0-1.6l-8-6Z"
                    />
                  </svg>
                </button>
              )}
              {transcriptionId && (
                <>
                <button
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded border border-indigo-600 bg-indigo-600 px-5 sm:px-12 py-2 sm:py-3 text-sm font-medium text-white hover:bg-transparent hover:text-indigo-600 focus:outline-none focus:ring active:text-indigo-500"
                  onClick={shareTranscription}
                >
                  <span>Share Transcription</span>
                  <svg
                    className="inline-block w-4 h-4 ml-1"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 8a3 3 0 11-6 0 3 3 0 016 0zm-3 4a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </button>
                <button
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded border border-indigo-600 bg-indigo-600 px-5 sm:px-12 py-2 sm:py-3 text-sm font-medium text-white hover:bg-transparent hover:text-indigo-600 focus:outline-none focus:ring active:text-indigo-500"
                  onClick={generateTicket}
                  disabled={generatingId === transcriptionId}
                >
                  <span>{generatingId === transcriptionId ? 'Generating...' : 'Generate Ticket'}</span>
                  <svg
                    className="inline-block w-4 h-4 ml-1"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-4-4h8" />
                  </svg>
                </button>
                </>
              )}
            </div>
            {loading ? <div className="center-spinner"><img src="loader.gif"  alt="" /></div> :  <p className="mt-5">{transcriptionText}</p>}
            {error && <p className="mt-5" style={{ color: 'red' }}>{error}</p>}
            
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Transcription;
