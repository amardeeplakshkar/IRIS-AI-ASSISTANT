import React from 'react'
import { SpeechProvider } from '../context/SpeechProvider'

const MainProvider = ({children}:{children: React.ReactNode}) => {
  return (
    <SpeechProvider>{children}</SpeechProvider>
  )
}

export default MainProvider