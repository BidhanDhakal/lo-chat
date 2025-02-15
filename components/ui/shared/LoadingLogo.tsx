import Image from 'next/image'

type Props = { size?: number}

const LoadingLogo = ({ size = 100 }: Props) => {

  return <div className='h-full w-full flex items-center justify-center'>
    <Image src='/lo-chat.svg' alt='logo' width={size} height={size} className='animate-bounce duration-700' />
  </div>
}


export default LoadingLogo