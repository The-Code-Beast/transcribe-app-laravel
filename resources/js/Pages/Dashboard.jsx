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
                            <hr />
                            <div className="mt-5"></div>

                            <button
                                className="mr-3 inline-flex text-xs items-center  text-xs gap-2 rounded border border-indigo-600 bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring active:text-indigo-500"
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
                                    <svg
                                    className="w-6 h-6 text-gray-800 dark:text-white hover:text-indigo-500"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    fill="#fff"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M8.6 5.2A1 1 0 0 0 7 6v12a1 1 0 0 0 1.6.8l8-6a1 1 0 0 0 0-1.6l-8-6Z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                

                                )}
                            </button>
                            <button
                                className="inline-flex items-center text-xs gap-2 rounded border border-slate-600 bg-slate-600 px-4 py-2 text-white hover:bg-slate-700 focus:outline-none focus:ring active:text-slate-500"
                                onClick={() => shareTranscription(transcription.id)}
                            >
                                <span className="text-sm font-medium">Share</span>
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
                                        d="M15 8a3 3 0 11-6 0 3 3 0 016 0zm-3 4a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
