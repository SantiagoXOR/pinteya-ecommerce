export default function Loading() {
  return (
    <div className='min-h-screen w-full flex flex-col items-center justify-center bg-[#ea5a17] text-white'>
      <img
        src='/images/logo/LOGO NEGATIVO.svg'
        alt='PinteYA'
        className='w-40 md:w-56 h-auto'
        loading='eager'
      />
      <p className='mt-6 text-center text-lg md:text-xl font-semibold'>Tu pinturería online. Fácil y rápido.</p>
    </div>
  )
}