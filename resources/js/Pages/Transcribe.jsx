import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

import RecordingButton from '@/Components/RecordingButton';
import LanguageSelect from '@/Components/LanguageSelect';

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

    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
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
                 <div className="mx-auto max-w-7xl sm:px-6 lg:px-6 ">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6 text-gray-900">
                        <header class="border-b border-gray-200 bg-gray-50">
                        <div class="mx-auto max-w-screen-xl px-5 py-8 sm:px-6 sm:py-12 lg:px-8">
                            <div class="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">Start Transcribing</h1>

                                    <p class="mt-1.5 text-sm text-gray-500">
                                    Beging recording your transcription...
                                    </p>
                                </div>

                                <div class="flex items-center gap-4">


                                
                                <RecordingButton
                                    startRecording={startRecording}
                                    stopRecording={stopRecording}
                                    isRecording={isRecording}
                                />

                                <LanguageSelect value={language} onChange={handleLanguageChange} />
                       



                        

                               
                                
                                </div>
                            </div>
                        </div>
                        </header>

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

          

         
      </AuthenticatedLayout>
      
    );
  };
  
  export default Transcription;
