import apiService from '@/services/api.service'
import { useEffect, useState } from 'react'

function Tavle() {
  const [imageBase64, setImageBase64] = useState<string>('')
  useEffect(() => {
    getImage()
  }, [])

  const getImage = async () => {
    const image = await apiService.getImage('cropped-tavle.jpg')
    if (!image) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setImageBase64(reader.result as string)
    }
    reader.readAsDataURL(image)
  }

  return (
    <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <picture>
        <img
          src={imageBase64}
          alt="The latest contents of the whiteboard"
          width={1920}
          height={1080}
        />
      </picture>
    </div>
  )
}

export default Tavle
