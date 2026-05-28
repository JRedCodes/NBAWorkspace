import { useEffect } from 'react'

export function useSSE(url: string | null, onEvent: (data: unknown) => void) {
  useEffect(() => {
    if (!url) return
    const source = new EventSource(url)
    source.onmessage = (e) => {
      try {
        onEvent(JSON.parse(e.data))
      } catch {
        onEvent(e.data)
      }
    }
    source.onerror = () => source.close()
    return () => source.close()
  }, [url, onEvent])
}
