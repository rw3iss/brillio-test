import { useEffect, useState } from 'react';
import type { KnowledgeBaseInfo } from '@brillio/shared';
import type { BrillioClient } from '../sdk/index.js';
import { toBrillioError, type BrillioError } from '../sdk/index.js';

interface State {
  knowledgeBases: KnowledgeBaseInfo[];
  loading: boolean;
  error?: BrillioError;
}

export function useKnowledgeBases(client: BrillioClient) {
  const [state, setState] = useState<State>({ knowledgeBases: [], loading: true });

  useEffect(() => {
    let alive = true;
    client
      .getKnowledgeBases()
      .then((knowledgeBases) => alive && setState({ knowledgeBases, loading: false }))
      .catch(
        (err) => alive && setState({ knowledgeBases: [], loading: false, error: toBrillioError(err) }),
      );
    return () => {
      alive = false;
    };
  }, [client]);

  return state;
}
