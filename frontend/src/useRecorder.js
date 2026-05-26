import { useState, useRef, useEffect } from 'react';
import { apiClient } from './config';
import { parseVoiceCommand, stripCommand } from './utils/voiceCommands';
import { saveRecordingOffline } from './utils/offlineQueue';

export function useRecorder(patientId = null, options = {}) {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [note, setNote] = useState(null);
  const [noteError, setNoteError] = useState(null);
  const [timer, setTimer] = useState(0);
  const [processingStep, setProcessingStep] = useState(0);
  const [recordingId, setRecordingId] = useState(null);
  const [retryAvailable, setRetryAvailable] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState(null);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [lastVoiceCommand, setLastVoiceCommand] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const lastAudioBlobRef = useRef(null);

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Setup Web Speech API for live transcription
  const setupLiveTranscription = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let commandTriggered = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          // Check for voice commands
          const voiceCmd = parseVoiceCommand(text);
          if (voiceCmd) {
            commandTriggered = true;
            console.log('🎙️ Voice Command Detected:', voiceCmd);
            setLastVoiceCommand(voiceCmd);
            
            // Execute the corresponding command callback
            if (voiceCmd.command === 'stop') {
              if (optionsRef.current.onStop) {
                optionsRef.current.onStop();
              } else {
                stopRecording();
              }
            } else if (voiceCmd.command === 'save') {
              if (optionsRef.current.onSave) {
                optionsRef.current.onSave();
              }
            } else if (voiceCmd.command === 'followup') {
              if (optionsRef.current.onFollowUp) {
                optionsRef.current.onFollowUp(voiceCmd.args);
              }
            }
            
            // Strip the command text so it is not appended to the transcript
            const strippedText = stripCommand(text, voiceCmd.matchedText);
            if (strippedText) {
              finalTranscript += strippedText + ' ';
            }
          } else {
            finalTranscript += text + ' ';
          }
        } else {
          interimTranscript += text;
        }
      }

      if (!commandTriggered) {
        setLiveTranscript(finalTranscript + (interimTranscript ? `[${interimTranscript}]` : ''));
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.warn('Speech recognition error:', event.error);
      }
    };

    // Auto-restart on end if still recording
    recognition.onend = () => {
      if (recognitionRef.current && recording) {
        try { recognition.start(); } catch (_) {}
      }
    };

    return recognition;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        lastAudioBlobRef.current = audioBlob;
        sendAudioToBackend(audioBlob);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
      };

      mediaRecorder.start();
      setRecording(true);
      setTimer(0);
      setTranscript('');
      setLiveTranscript('');
      setNote(null);
      setProcessingStep(0);
      setRetryAvailable(false);
      setTranscriptionError(null);
      setOfflineSaved(false);

      timerIntervalRef.current = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);

      // Start live transcription
      const recognition = setupLiveTranscription();
      if (recognition) {
        recognitionRef.current = recognition;
        try { recognition.start(); } catch (_) {}
      }
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Stop live speech recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setRecording(false);
    setLoading(true);
    setProcessingStep(1);
  };

  const sendAudioToBackend = async (audioBlob) => {
    if (audioBlob.size === 0) {
      console.error('Audio blob is empty!');
      alert('No audio was recorded. Please try again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setProcessingStep(1);
    setTranscriptionError(null);
    setRetryAvailable(false);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      if (patientId) formData.append('patientId', patientId);

      // Append template sections if present in options
      if (optionsRef.current.templateSections) {
        formData.append('templateSections', JSON.stringify(optionsRef.current.templateSections));
      }

      const response = await apiClient.post('/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response.data;

      if (data.success && data.data) {
        setProcessingStep(2);
        setTranscript(data.data.transcript);
        setRecordingId(data.data.recordingId);
        setNoteError(data.data.noteError || null);

        setTimeout(() => {
          setProcessingStep(3);
          setNote(data.data.note);
          setLoading(false);
        }, 500);
      } else {
        console.error('Backend returned success=false:', data);
        setTranscriptionError(data.message || 'Failed to transcribe audio.');
        setRetryAvailable(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error uploading audio:', err.response?.data || err.message);

      // Check if it's a network/offline error
      const isNetworkError = !err.response || err.code === 'ERR_NETWORK' || !navigator.onLine;
      if (isNetworkError) {
        console.log('🌐 Network/Offline error detected. Saving recording offline...');
        const metadata = {};
        if (optionsRef.current.templateSections) {
          metadata.templateSections = optionsRef.current.templateSections;
        }

        const saved = await saveRecordingOffline(audioBlob, patientId, metadata);
        if (saved) {
          setOfflineSaved(true);
          setTranscriptionError('Network offline: Recording saved locally. It will auto-sync once connection is restored.');
          setProcessingStep(0);
          setLoading(false);
          return;
        }
      }

      setTranscriptionError(err.response?.data?.error || err.message || 'Network error occurred during transcription.');
      setRetryAvailable(true);
      setLoading(false);
    }
  };

  // Fetch latest session note when patientId changes
  useEffect(() => {
    // Reset all recording/transcription states for the new patient context
    setRecording(false);
    setLoading(false);
    setTranscript('');
    setLiveTranscript('');
    setNote(null);
    setNoteError(null);
    setTimer(0);
    setProcessingStep(0);
    setRecordingId(null);
    setRetryAvailable(false);
    setTranscriptionError(null);
    setOfflineSaved(false);

    if (!patientId) return;

    const fetchLatestSession = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/recordings/patients/${patientId}/sessions?all=true`);
        const data = response.data;
        if (data.success && data.data && data.data.length > 0) {
          const latestSession = data.data[0];
          // Only load/populate if this session has NOT been finalized (saved) yet!
          if (!latestSession.isFinalized) {
            setNote(latestSession.note || null);
            setTranscript(latestSession.labeledTranscript || latestSession.plainTranscript || '');
            setRecordingId(latestSession._id || null);
          }
        }
      } catch (err) {
        console.error('Error fetching latest session for patient:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchLatestSession();
    }, 50);
    return () => clearTimeout(timer);
  }, [patientId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const retry = () => {
    if (lastAudioBlobRef.current) {
      sendAudioToBackend(lastAudioBlobRef.current);
    }
  };

  const reRecord = () => {
    lastAudioBlobRef.current = null;
    setRetryAvailable(false);
    setTranscriptionError(null);
    setTimer(0);
    setProcessingStep(0);
    setLiveTranscript('');
    setTranscript('');
    setNote(null);
    setNoteError(null);
    setOfflineSaved(false);
    startRecording();
  };

  return {
    recording,
    loading,
    transcript: transcript || liveTranscript,
    liveTranscript,
    note,
    setNote,
    setTranscript,
    noteError,
    timer,
    processingStep,
    recordingId,
    setRecordingId,
    start: startRecording,
    stop: stopRecording,
    retry,
    reRecord,
    retryAvailable,
    transcriptionError,
    offlineSaved,
    setOfflineSaved,
    lastVoiceCommand,
    setLastVoiceCommand,
  };
}
