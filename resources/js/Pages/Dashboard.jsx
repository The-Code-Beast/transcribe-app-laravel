import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import axios from 'axios';

export default function Dashboard({ transcriptions }) {
    const waveSurferRefs = useRef({});
    const [playingStates, setPlayingStates] = useState({}); // Track play/pause states
    const [generatingId, setGeneratingId] = useState(null); // Track ticket generation per transcription

    useEffect(() => {
        transcriptions.forEach((transcription) => {
            if (!waveSurferRefs.current[transcription.id]) {
                const container = document.querySelector(`#waveform-${transcription.id}`);
                if (container) {
                    const waveSurfer = WaveSurfer.create({
                        container,
                        waveColor: '#d1d5db',
                        progressColor: '#74A352',
                        cursorColor: '#74A352',
                        barWidth: 2,
                        barRadius: 3,
                        responsive: true,
                        height: 80,
                    });

                    waveSurfer.load(transcription.audio_url);

                    // Attach finish event listener
                    waveSurfer.on('finish', () => {
                        setPlayingStates((prevStates) => ({
                            ...prevStates,
                            [transcription.id]: false, // Reset to stopped state
                        }));
                    });

                    waveSurferRefs.current[transcription.id] = waveSurfer;
                }
            }
        });

        return () => {
            Object.values(waveSurferRefs.current).forEach((wavesurfer) => {
                if (wavesurfer) {
                    wavesurfer.destroy();
                }
            });
        };
    }, [transcriptions]);

    const togglePlayPause = (id) => {
        const waveSurfer = waveSurferRefs.current[id];
        if (waveSurfer) {
            waveSurfer.playPause();
            setPlayingStates((prevStates) => ({
                ...prevStates,
                [id]: waveSurfer.isPlaying(), // Update state based on current play status
            }));
        }
    };

    const shareTranscription = (id) => {
        const publicUrl = `${window.location.origin}/p/transcription/${id}`;
        window.open(publicUrl, '_blank');
    };

    const generateTicket = async (id) => {
        try {
            setGeneratingId(id);
            const response = await axios.post(`/transcription/${id}/generate-ticket`);
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

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />
            <div className='py-12'>
            <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                <div className="grid grid-cols-1">
                    {transcriptions.map((transcription) => (
                        <div
                            key={transcription.id}
                            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-300 mb-4"
                        >
                            <h2 className="text-xl font-semibold truncate">
                                Transcription #{transcription.id}
                            </h2>
                            <p className="text-sm text-gray-500 mb-2">
                                {new Date(transcription.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-gray-700 mb-4">
                                {transcription.transcription || 'No transcription available'}
                            </p>
                            
                            <div id={`waveform-${transcription.id}`} className="w-full mb-4"></div>
                            <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
                              <button
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded border border-indigo-600 bg-indigo-600 px-5 sm:px-12 py-2 sm:py-3 text-sm font-medium text-white hover:bg-transparent hover:text-indigo-600 focus:outline-none focus:ring active:text-indigo-500"
                                onClick={() => togglePlayPause(transcription.id)}
                              >
                                {playingStates[transcription.id] ? 'Pause' : 'Play'}
                              </button>
                              <button
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded border border-slate-600 bg-slate-600 px-5 sm:px-12 py-2 sm:py-3 text-sm font-medium text-white hover:bg-transparent hover:text-slate-600 focus:outline-none focus:ring active:text-slate-500"
                                onClick={() => shareTranscription(transcription.id)}
                              >
                                Share
                              </button>
                              <button
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded border border-indigo-600 bg-indigo-600 px-5 sm:px-12 py-2 sm:py-3 text-sm font-medium text-white hover:bg-transparent hover:text-indigo-600 focus:outline-none focus:ring active:text-indigo-500"
                                onClick={() => generateTicket(transcription.id)}
                                disabled={generatingId === transcription.id}
                              >
                                {generatingId === transcription.id ? 'Generating...' : 'Generate Ticket'}
                              </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            </div>
        </AuthenticatedLayout>
    );
}
