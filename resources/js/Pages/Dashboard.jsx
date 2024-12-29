import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

export default function Dashboard({ transcriptions }) {
    const waveSurferRefs = useRef({});

    useEffect(() => {
        transcriptions.forEach((transcription) => {
            if (!waveSurferRefs.current[transcription.id]) {
                const container = document.querySelector(`#waveform-${transcription.id}`);
                if (container) {
                    waveSurferRefs.current[transcription.id] = WaveSurfer.create({
                        container,
                        waveColor: '#d1d5db',
                        progressColor: '#4f46e5',
                        cursorColor: '#4f46e5',
                        barWidth: 2,
                        barRadius: 3,
                        responsive: true,
                        height: 80,
                    });

                    waveSurferRefs.current[transcription.id].load(transcription.audio_url);
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
                                onClick={() =>
                                    waveSurferRefs.current[transcription.id]?.playPause()
                                }
                                className="text-white bg-blue-600 px-4 py-2 mr-2 rounded hover:bg-blue-700"
                            >
                                Play / Pause
                            </button>
                            <button
                                onClick={() =>
                                    waveSurferRefs.current[transcription.id]?.playPause()
                                }
                                className="text-white bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Share
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
