const CF_STREAM_BASE = 'https://api.cloudflare.com/client/v4/accounts';

export interface CreateLiveInputResponse {
  result?: {
    uid: string;
    rtmps?: {
      url: string;
      streamKey: string;
    };
  };
}

export interface LiveInputDetailsResponse {
  result?: {
    uid: string;
    playback?: {
      hls?: string;
      dash?: string;
    };
  };
}

export interface LiveInputVideosResponse {
  result?: Array<{
    playback?: { hls?: string };
  }>;
}

export async function createLiveInput(
  accountId: string,
  apiToken: string,
  title: string,
  recordingMode: 'automatic' | 'manual' = 'automatic'
): Promise<CreateLiveInputResponse> {
  const res = await fetch(
    `${CF_STREAM_BASE}/${accountId}/stream/live_inputs`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meta: { name: title },
        recording: { mode: recordingMode },
      }),
    }
  );
  return res.json() as Promise<CreateLiveInputResponse>;
}

export async function getLiveInput(
  accountId: string,
  apiToken: string,
  liveInputId: string
): Promise<LiveInputDetailsResponse> {
  const res = await fetch(
    `${CF_STREAM_BASE}/${accountId}/stream/live_inputs/${liveInputId}`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    }
  );
  return res.json() as Promise<LiveInputDetailsResponse>;
}

export async function getLiveInputVideos(
  accountId: string,
  apiToken: string,
  liveInputId: string
): Promise<LiveInputVideosResponse> {
  const res = await fetch(
    `${CF_STREAM_BASE}/${accountId}/stream/live_inputs/${liveInputId}/videos`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    }
  );
  return res.json() as Promise<LiveInputVideosResponse>;
}
