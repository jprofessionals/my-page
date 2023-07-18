import { useEffect, useRef, useState } from 'react'
import SockJS from 'sockjs-client'
import { Button } from '../ui/button'

interface ExploreResponse {
  description: string
  imageUrl: string
  nextLocations: string[]
}

function ExplorerTextArea(): JSX.Element {
  const [text, setText] = useState<string>('')
  const textAreaRef = useRef<HTMLDivElement>(null)
  const [buttonClicked, setButtonClicked] = useState<boolean>(false)
  const [data, setData] = useState<ExploreResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const socketRef = useRef<WebSocket | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol
    const sockJsURL = `${protocol}//${window.location.host}/api/explorationSock`

    socketRef.current = new SockJS(sockJsURL)

    if (socketRef.current)
      socketRef.current.onopen = function (e) {
        if (socketRef.current)
          if (localStorage.getItem('user_token')) {
            socketRef.current.send(
              (sessionStorage.getItem('user_token') as string).replace(
                /^"|"$/g,
                '',
              ),
            )
          }
      }

    if (socketRef.current) {
      socketRef.current.onmessage = function (event) {
        const data = JSON.parse(event.data)
        setData(data)
      }
    }
    const timer = setTimeout(() => {
      if (inputRef.current !== null) {
        inputRef.current.focus();
      }
    }, 0);
    // Clean up the WebSocket connection when this component unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.close()
      }
      clearTimeout(timer);
    }
  }, [])

  const sendExploreRequest = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (text.trim()) {
        const tx = JSON.stringify(text)
        if (socketRef.current)
          socketRef.current.send('explore:' + JSON.stringify(text))
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight
    }
  }, [data])

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (text.trim() && !isLoading) {
        sendExploreRequest()
      }
    }
  }

  const handleSendClick = () => {
    if (text.trim() && !isLoading) {
      sendExploreRequest()
    }
  }

  const handleButtonClick = (nextLocation: string) => {
    if (!isLoading) {
      setButtonClicked(true)
      setText(nextLocation)
    }
  }

  const handleResetClick = async () => {
    try {
      socketRef.current?.send('reset')
      setData(null)
      setText('')
      setIsLoading(false)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (buttonClicked && text.trim()) {
      setButtonClicked(false)
      sendExploreRequest()
    }
  }, [text])

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flexGrow: 1, fontSize: '1.5em' }}>
        {isLoading ? (
          'Loading...'
        ) : error ? (
          'Error fetching data'
        ) : (
          <>
            <img src={data?.imageUrl || ''} alt="" />

            <div style={{ display: 'flex' }}>
              <div style={{ flexGrow: 1 }}>{data?.description || ''}</div>
            </div>
          </>
        )}
      </div>
      <div>
        <input ref={inputRef}
          type="text"
          placeholder="Where do you want to go?"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          style={{
            height: '3rem',
            padding: '0.5rem',
            borderTop: '1px solid #ccc',
            marginBottom: '5px',
          }}
          className="h-12 px-2 border-t border-black-nav shadow"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <Button onClick={handleResetClick}>Reset</Button>
          </div>
          <div style={{ marginBottom: '5px' }}>
            <Button onClick={handleSendClick} variant="primary">
              Send
            </Button>
          </div>
        </div>
        <div style={{ marginLeft: '1rem' }}>
          {data?.nextLocations.map((nextLocation: string) => (
            <button
              key={nextLocation}
              onClick={() => handleButtonClick(nextLocation)}
              style={{ display: 'block', marginBottom: '5px' }}
            >
              {nextLocation}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ExplorerTextArea
