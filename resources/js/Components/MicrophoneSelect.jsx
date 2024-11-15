import React, { useState, useEffect } from 'react';

const MicrophoneSelect = ({ onMicrophoneChange }) => {
  const [microphones, setMicrophones] = useState([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState('');

  useEffect(() => {
    const getMicrophones = async () => {
      try {
        // Request microphone access to reveal device labels
        await navigator.mediaDevices.getUserMedia({ audio: true });

        // Fetch available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        setMicrophones(audioInputs);

        // Set default microphone only if not already selected
        if (audioInputs.length > 0 && !selectedMicrophone) {
          setSelectedMicrophone(audioInputs[0].deviceId);
          onMicrophoneChange(audioInputs[0].deviceId);
        }
      } catch (error) {
        console.error('Error accessing microphones:', error);
        alert('Please allow microphone permissions to select a device.');
      }
    };

    getMicrophones();
  }, [onMicrophoneChange, selectedMicrophone]);

  const handleMicrophoneChange = (e) => {
    const deviceId = e.target.value;
    setSelectedMicrophone(deviceId);
    onMicrophoneChange(deviceId);
  };

  return (
    <div>
      <label htmlFor="microphone-select" className="block text-sm font-medium text-gray-700">
        Select Microphone
      </label>
      <select
        id="microphone-select"
        value={selectedMicrophone}
        onChange={handleMicrophoneChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        {microphones.map((microphone, index) => (
          <option key={microphone.deviceId} value={microphone.deviceId}>
            {microphone.label || `Microphone ${index + 1}`}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MicrophoneSelect;
