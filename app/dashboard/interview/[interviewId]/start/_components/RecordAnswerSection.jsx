"use client"
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import Webcam from 'react-webcam'
import { Mic, StopCircle } from 'lucide-react'
import { toast } from 'sonner'
import { chatSession } from '@/utils/GeminiAIModal'
import { db } from '@/utils/db'
import { useUser } from '@clerk/nextjs'
import moment from 'moment/moment'
import { UserAnswer } from '@/utils/schema'

function RecordAnswerSection({mockInterviewQuestion,activeQuestionIndex,interviewData}) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [loading, setLoading] = useState(false);

  const {user} = useUser();

  useEffect(() => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const recognitionInstance = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognitionInstance.continuous = true; 
      recognitionInstance.interimResults = false; 
      recognitionInstance.lang = 'en-US'; 

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setUserAnswer((prevAnswer) => prevAnswer + ' ' + transcript); 
      };

      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
      };

      setRecognition(recognitionInstance);
    } else {
      console.error("SpeechRecognition API not supported in this browser.");
    }
  }, []);

  useEffect(() => {
    if(!isRecording && userAnswer.length > 10) {
        UpdateUserAnswer()
    }
    /*
    if(userAnswer?.length < 10) {
        setLoading(false)
        toast('Error while saving your answer. Please record again.')
        return;
    }
    */
  },[userAnswer])

  const toggleRecording = () => {
    if (!recognition) return;
    
    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }

    setIsRecording((prev) => !prev);
  };

  const UpdateUserAnswer = async () => {
    console.log(userAnswer)
    setLoading(true);
    
    const feedbackPrompt="Question:" + mockInterviewQuestion[activeQuestionIndex]?.question + ", User Answer: " + userAnswer + ", Depending on the question and the user answer for the given interview question, please give me a rating for the answer and feedback as area of improvment as any, in just 3 to 5 lines to improve it. In JSON format with rating field and feedback field ";
      const result = await chatSession.sendMessage(feedbackPrompt);
      const mockJsonResp = (result.response.text()).replace('```json','').replace('```','');
      console.log(mockJsonResp);
      const JsonFeedbackResp = JSON.parse(mockJsonResp);

      const resp=await db.insert(UserAnswer)
                         .values({
                            mockIdRef:interviewData?.mockId,
                            question:mockInterviewQuestion[activeQuestionIndex]?.question,
                            correctAns:mockInterviewQuestion[activeQuestionIndex]?.answer,
                            userAns:userAnswer,
                            feedback:JsonFeedbackResp.feedback,
                            rating:JsonFeedbackResp?.rating,
                            userEmail:user?.primaryEmailAddress.emailAddress,
                            createdAt:moment().format('DD-MM-yyyy')
                         })

       if(resp) {
         toast('User answer recorded successfully.') 
        }
    
       setUserAnswer('');
       setLoading(false);
  }



  return (
    <div className='flex flex-col items-center justify-center'>
      <div className='flex flex-col justify-center items-center bg-black rounded-lg p-5 mt-20'>
        <Image src={'/webcam.png'} width={200} height={200} className='absolute'/>
        <Webcam mirrored={true} style={{height: 300, width: '100%', zIndex: 10}} />
      </div>
      
      <Button disabled={loading} variant="outline" className="my-10" onClick={toggleRecording}>
        {isRecording ? (
          <h2 className='text-red-600 flex gap-2 animate-pulse items-center'>
            <StopCircle /> Stop Recording
          </h2>
        ) : 
          <h2 className='text-primary flex gap-2 items-center'>
            <Mic /> Record Answer
          </h2>
        }
      </Button>
    </div>
  );
}

export default RecordAnswerSection;
