import Image from 'next/image'

type Props = { size?: number }

const LoadingLogo = ({ size = 180 }: Props) => {
  return (
    <div className='h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/50 relative'>
      <div className="relative flex flex-col items-center">
        <div className="animate-pulse duration-3000">
          <Image
            src='/lo-chat.svg'
            alt='logo'
            width={size}
            height={size}
            className='duration-200'
          />
          <div className="absolute -inset-4 bg-primary/10 blur-xl rounded-full" />
        </div>
        <div className="flex items-center gap-2 mt-6">
          <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
          <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
          <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <div className="flex flex-col items-center pb-6 backdrop-blur-sm bg-background/30">
          <h1 className='text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent animate-gradient'>
            Chatrex
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
            <p className='text-lg font-medium text-muted-foreground/90'>
              By Bidhan Dhakal
            </p>
            <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
          </div>
          <div className="mt-2 px-4 py-1 rounded-full bg-muted/30 backdrop-blur-sm">
            <p className='text-sm text-muted-foreground/70 tracking-wide font-medium'>
              Still in Development
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default LoadingLogo
