import { useCallback, useEffect, useRef, useState } from 'react'
import SockJS from 'sockjs-client'
import { Button } from '../ui/button'
import Spinner from '@/components/ui/spinner'

interface ExploreResponse {
  description: string
  imageUrl: string
  nextLocations: string[]
}

// Define a map of art style options
const artStyleOptions: Record<string, string> = {
  Default: 'an ultra-realistic image',
  Cartoon: 'a cartoon style drawing',
  Origami: 'an origami style image',
  Watercolor: 'a watercolor style image',
  Anime: 'an anime style image',
  Cubist: 'a cubist style image',
  Munch: 'a painting in the style of Edvard Munch',
  PopArt: 'a pop-art image',
  // Add more options here as needed
}

function ExplorerTextArea(): React.JSX.Element {
  const [text, setText] = useState<string>('')
  const [artStyle, setArtStyle] = useState<string>('Default') // Default art style

  const textAreaRef = useRef<HTMLDivElement>(null)
  const [buttonClicked, setButtonClicked] = useState<boolean>(false)
  const [data, setData] = useState<ExploreResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const socketRef = useRef<WebSocket | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isLoadingWebSocket, setIsLoadingWebSocket] = useState(false)

  function openWebSocket(sockJsURL: string) {
    socketRef.current = new SockJS(sockJsURL)

    if (socketRef.current)
      socketRef.current.onopen = function () {
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
        setIsLoadingWebSocket(false)
      }
    }
    const timer = setTimeout(() => {
      if (inputRef.current !== null) {
        inputRef.current.focus()
      }
    }, 0)
    // Clean up the WebSocket connection when this component unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.close()
      }
      clearTimeout(timer)
    }
  }

  useEffect(() => {
    const protocol = window.location.protocol
    const sockJsURL = `${protocol}//${window.location.host}/api/explorationSock`
    return openWebSocket(sockJsURL)
  }, [])

  const sendExploreRequest = useCallback(async () => {
    setError(null)
    try {
      if (text.trim()) {
        const explorationInput = {
          location: text,
          artStyle: artStyleOptions[artStyle],
        }

        if (socketRef.current && socketRef.current?.readyState === 3) {
          const protocol = window.location.protocol
          const sockJsURL = `${protocol}//${window.location.host}/api/explorationSock`
          openWebSocket(sockJsURL)
        }
        if (socketRef.current && socketRef.current?.readyState === 0) {
          setIsLoadingWebSocket(true)
          await new Promise((f) => setTimeout(f, 1000))
        }
        if (socketRef.current && socketRef.current?.readyState === 1) {
          socketRef.current.send('explore:' + JSON.stringify(explorationInput))
          setIsLoadingWebSocket(true)
        } else {
          setError(new Error('Could not connect to server, try again shortly'))
          setIsLoadingWebSocket(false)
        }
      }
    } catch (err) {
      setError(err as Error)
      setIsLoadingWebSocket(false)
    }
  }, [text, artStyle])

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
      setArtStyle('Default')
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (buttonClicked && text.trim()) {
      setButtonClicked(false)
      sendExploreRequest()
    }
  }, [text, buttonClicked, sendExploreRequest])

  return (
    <div style={{ display: 'flex', minHeight: '80vh' }}>
      <div style={{ flexGrow: 1, fontSize: '1.5em' }}>
        {isLoading ? (
          'Loading...'
        ) : error ? (
          error.message
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
        <input
          ref={inputRef}
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
          className="h-12 px-2 border-t border-black-nav shadow-sm"
        />
        <div
          style={{
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
          }}
        >
          <label style={{ paddingRight: '0.5rem' }}>Style:</label>
          <select
            value={artStyle}
            onChange={(e) => setArtStyle(e.target.value)}
            style={{ height: '35px' }}
          >
            {Object.keys(artStyleOptions).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
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
        {isLoadingWebSocket && <Spinner />}
      </div>
    </div>
  )
}

export default ExplorerTextArea
