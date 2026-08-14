import { useEffect, useState } from 'react';
import type { ProviderInfo } from '@brillio/shared';
import type { BrillioClient } from '../sdk/index.js';
import { toBrillioError, type BrillioError } from '../sdk/index.js';

interface State {
  providers: ProviderInfo[];
  loading: boolean;
  error?: BrillioError;
}

export function useProviders(client: BrillioClient) {
  const [state, setState] = useState<State>({ providers: [], loading: true });

  useEffect(() => {
    let alive = true;
    client
      .getProviders()
      .then((providers) => alive && setState({ providers, loading: false }))
      .catch((err) => alive && setState({ providers: [], loading: false, error: toBrillioError(err) }));
    return () => {
      alive = false;
    };
  }, [client]);

  return state;
}
