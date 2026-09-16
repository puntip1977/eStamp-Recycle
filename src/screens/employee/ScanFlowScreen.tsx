import React, { useState } from 'react';
import { CameraScreen } from './CameraScreen';
import { ResultScreen } from './ResultScreen';
import { Profile, TransactionResult } from '../../types/models';

export function ScanFlowScreen({ profile }: { profile: Profile }) {
  const [result, setResult] = useState<TransactionResult | null>(null);

  if (result) {
    return <ResultScreen result={result} onDone={() => setResult(null)} />;
  }
  return <CameraScreen profile={profile} onCounted={setResult} />;
}
