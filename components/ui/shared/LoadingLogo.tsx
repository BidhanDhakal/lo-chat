import Image from 'next/image'

type Props = { size?: number}

const LoadingLogo = ({ size = 180 }: Props) => {

  return (
    <div className='h-full w-full flex flex-col items-center justify-center'>
      <Image src='/lo-chat.svg' alt='logo' width={size} height={size} className='animate-none duration-700' />
      <p className='mt-4 text-3xl font-medium text-gray-700'>Chatryx</p>

      <p className='mt-2 text-l text-gray-400 fixed bottom-10'>Still in Development.</p>
      <p className='mt-2 text-xl text-gray-500 fixed bottom-4'>By Bidhan Dhakal</p>
    </div>
  )
}

export default LoadingLogo
