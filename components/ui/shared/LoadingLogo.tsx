import Image from 'next/image'

type Props = { size?: number}

const LoadingLogo = ({ size = 170 }: Props) => {

  return (
    <div className='h-full w-full flex flex-col items-center justify-center'>
      <Image src='/lo-chat.svg' alt='logo' width={size} height={size} className='animate-none duration-700' />
      <p className='mt-4 text-2xl font-medium text-gray-700'>Lo-chat</p>
      <p className='mt-2 text-sm text-gray-500 fixed bottom-4'>By Bidhan Dhakal</p>
    </div>
  )
}

export default LoadingLogo
