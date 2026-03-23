import { useState, useRef } from 'react';

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [note, setNote] = useState(null);
  const [timer, setTimer] = useState(0);
  const [processingStep, setProcessingStep] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      console.log('Microphone access granted');

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('Audio chunk received:', event.data.size, 'bytes');
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped, creating blob...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Audio blob created:', audioBlob.size, 'bytes');
        sendAudioToBackend(audioBlob);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
      };

      mediaRecorder.start();
      console.log('MediaRecorder started');
      setRecording(true);
      setTimer(0);
      setTranscript('');
      setNote(null);
      setProcessingStep(0);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    
    // Clear timer first
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      console.log('Timer cleared');
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('MediaRecorder state:', mediaRecorderRef.current.state);
      mediaRecorderRef.current.stop();
      console.log('MediaRecorder stop() called');
    }

    // Close audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log('Audio track stopped');
      });
      streamRef.current = null;
    }

    setRecording(false);
    setLoading(true);
    setProcessingStep(1);
  };

  const sendAudioToBackend = async (audioBlob) => {
    console.log('sendAudioToBackend called with blob size:', audioBlob.size);
    
    if (audioBlob.size === 0) {
      console.error('Audio blob is empty!');
      alert('No audio was recorded. Please try again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setProcessingStep(1);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      console.log('Uploading audio to backend...');
      console.log('Form data keys:', Array.from(formData.keys()));
      
      const response = await fetch('http://localhost:7001/api/analyze', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Backend response:', data);

      if (data.success) {
        setProcessingStep(2);
        setTranscript(data.transcript);
        
        setTimeout(() => {
          setProcessingStep(3);
          setNote(data.note);
          setLoading(false);
        }, 500);
      } else {
        console.error('Backend returned success=false:', data);
        alert('Error: ' + (data.message || 'Unknown error from backend'));
        setLoading(false);
      }
    } catch (err) {
      console.error('Error uploading audio:', err);
      alert('Error: ' + err.message);
      setLoading(false);
    }
  };

  return {
    recording,
    loading,
    transcript,
    note,
    timer,
    processingStep,
    start: startRecording,
    stop: stopRecording,
  };
}
