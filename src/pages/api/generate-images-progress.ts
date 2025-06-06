import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  let isConnectionClosed = false;
  const controller = new AbortController();
  
  request.signal.addEventListener('abort', () => {
    isConnectionClosed = true;
    controller.abort();
  });

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const initialMessage = {
        type: 'connected',
        message: 'SSE connection established'
      };
      controller.enqueue(`data: ${JSON.stringify(initialMessage)}\n\n`);

      // Set up heartbeat
      const heartbeatInterval = setInterval(() => {
        if (!isConnectionClosed) {
          try {
            const heartbeat = {
              type: 'heartbeat',
              timestamp: Date.now()
            };
            controller.enqueue(`data: ${JSON.stringify(heartbeat)}\n\n`);
          } catch (error) {
            console.warn('Failed to send heartbeat:', error);
            clearInterval(heartbeatInterval);
          }
        } else {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        isConnectionClosed = true;
        clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch (error) {
          console.warn('Error closing controller:', error);
        }
      });
    },
    cancel() {
      isConnectionClosed = true;
      controller.abort();
    }
  });

  return new Response(stream, { headers });
};

// Helper function to send SSE data
export function sendSSEData(controller: ReadableStreamDefaultController, data: any) {
  if (!controller) {
    console.warn('No controller available to send SSE data');
    return;
  }

  try {
    controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
  } catch (error) {
    console.warn('Failed to send SSE data:', error);
  }
} 