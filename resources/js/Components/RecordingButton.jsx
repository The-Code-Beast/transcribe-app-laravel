// RecordingButton.js
import React from 'react';

const RecordingButton = ({ startRecording, stopRecording, isRecording }) => {
    const handleClick = (e) => {
        e.preventDefault();
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <a
            className={`group items-center justify-between flex gap-4 rounded-lg border px-5 py-4 transition-colors focus:outline-none focus:ring ${
                isRecording
                    ? 'bg-red-600 border-red-600 hover:bg-red-700'
                    : 'bg-indigo-600 border-indigo-600 hover:bg-indigo-700'
            }`}
            href="#"
            onClick={handleClick}
        >
            <span
                className={`font-medium transition-colors ${
                    isRecording
                        ? 'text-white group-hover:text-white'
                        : 'text-white group-hover:text-white'
                }`}
            >
                {isRecording ? "Stop Recording" : "Start Recording"}
            </span>

            <span
                className={`shrink-0 ${
                    isRecording ? 'text-red-600' : 'text-indigo-600'
                }`}
            >
                {isRecording ? (
                    // Icon for Stop Recording
                    <svg
                        className="w-6 h-6 text-gray-800 dark:text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        fill="#fff"
                        viewBox="0 0 24 24"
                    >
                        <rect x="5" y="5" width="14" height="14" rx="2" />
                    </svg>
                ) : (
                    // Icon for Start Recording
                    <svg
                        className="w-6 h-6 text-gray-800 dark:text-white"
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
            </span>
        </a>
    );
};

export default RecordingButton;
