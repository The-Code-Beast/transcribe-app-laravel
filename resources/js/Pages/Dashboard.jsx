import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

export default function Dashboard({ transcriptions }) {
    const waveSurferRefs = useRef({});
    const [playingStates, setPlayingStates] = useState({}); // Track play/pause states

    useEffect(() => {
        transcriptions.forEach((transcription) => {
            if (!waveSurferRefs.current[transcription.id]) {
                const container = document.querySelector(`#waveform-${transcription.id}`);
                if (container) {
                    const waveSurfer = WaveSurfer.create({
                        container,
                        waveColor: '#d1d5db',
                        progressColor: '#4f46e5',
                        cursorColor: '#4f46e5',
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

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />
            <div className="py-12 mx-auto max-w-7xl">
                <div className="grid grid-cols-1">
                    {transcriptions.map((transcription) => (
                        <div
                            key={transcription.id}
                            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-300 mt-4"
                        >
                            <h2 className="text-xl font-semibold truncate">
                                Transcription #{transcription.id}
                            </h2>
                            <p className="text-sm text-gray-500 mb-2">
                                {new Date(transcription.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-gray-700 mb-4 truncate">
                                {transcription.transcription || 'No transcription available'}
                            </p>
                            <div id={`waveform-${transcription.id}`} className="w-full mb-4"></div>

                            <button
                                className="mr-3 inline-flex items-center text-xs gap-2 rounded border border-indigo-600 bg-indigo-600 px-4 py-2 text-white hover:bg-transparent hover:text-indigo-600 focus:outline-none focus:ring active:text-indigo-500"
                                onClick={() => togglePlayPause(transcription.id)}
                            >
                                <span className="text-sm font-medium">
                                    {playingStates[transcription.id] ? 'Pause' : 'Play'}
                                </span>

                                {playingStates[transcription.id] ? (
                                    // Pause icon
                                    <svg
                                        className="w-6 h-6"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 9v6m4-6v6"
                                        />
                                    </svg>
                                ) : (
                                    // Play icon
                                    <svg
                                        className="w-6 h-6"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M14.752 11.168l-5.197-3.012A1 1 0 008 9.012v5.976a1 1 0 001.555.832l5.197-3.012a1 1 0 000-1.664z"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
