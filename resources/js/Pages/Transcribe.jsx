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
            <div className="text-center">
              {audioUrl && (
                <button
                  className="inline-block rounded border border-indigo-600 bg-indigo-600 px-12 py-3 text-sm font-medium text-white hover:bg-transparent hover:text-indigo-600 focus:outline-none focus:ring active:text-indigo-500"
                  onClick={togglePlayPause}
                  style={{ marginTop: '20px' }}
                >
                  Play / Pause
                </button>
              )}
              {transcriptionId && (
                <>
                <button
                  className="inline-block rounded border border-indigo-600 bg-indigo-600 px-12 py-3 text-sm font-medium text-white hover:bg-transparent hover:text-indigo-600 focus:outline-none focus:ring active:text-indigo-500"
                  onClick={shareTranscription}
                  style={{ marginTop: '20px', marginLeft: '10px' }}
                >
                  Share Transcription
                </button>
                <button
                  className="inline-block rounded border border-green-600 bg-green-600 px-12 py-3 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring active:text-green-500"
                  onClick={generateTicket}
                  disabled={generatingId === transcriptionId}
                  style={{ marginTop: '20px', marginLeft: '10px' }}
                >
                  {generatingId === transcriptionId ? 'Generating...' : 'Generate Ticket'}
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
