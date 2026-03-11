'use client';

interface VoiceRecordButtonProps {
  onTranscription: (text: string) => void;
  isDisabled?: boolean;
}

const VoiceRecordButton = ({ onTranscription, isDisabled }: VoiceRecordButtonProps) => {
  return (
    <button
      disabled={isDisabled}
      onClick={() => {
        // TODO: マイク録音 → Whisper API → onTranscription
        onTranscription('');
      }}
      className="rounded-full bg-primary-600 p-3 text-white hover:bg-primary-700 disabled:opacity-50"
    >
      {/* TODO: マイクアイコン */}
      MIC
    </button>
  );
};

export default VoiceRecordButton;
