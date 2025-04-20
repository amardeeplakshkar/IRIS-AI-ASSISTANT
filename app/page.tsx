'use client'

import { useSpeechContext } from '@/components/context/SpeechProvider'
import AiBlob from '@/components/core/AiBlob'
import AiBlob2 from '@/components/core/AiBlob2'
import App from '@/components/core/test'
import React from 'react'

const Page = () => {
  const { isListening, isSpeaking } = useSpeechContext();
  return (
    <div className='flex flex-col items-center justify-start py-3 px-3 bg-gradient-to-b from-indigo-100 via-purple-100 to-blue-100'>
      <h2 className='text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500'>
        I.R.I.S
      </h2>
      <p className='text-center font-bold text-sm'>
        Intelligent Response and Interactive System
      </p>
      <AiBlob2/>
      <AiBlob isListening={isListening} isSpeaking={isSpeaking}/>
      <App />
    </div>
  )
}

export default Page