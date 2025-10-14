export default function Loading() {
  return (
    <div className='brand-loader'>
      <div className='brand-loader-inner'>
        <div className='brand-badge' aria-label='Pinteya cargando'>
          <img
            src={'/images/logo/optimized/LogoPinteYa-favicon-hd.png'}
            alt='PinteYA!'
            className='brand-logo'
            width={96}
            height={96}
            loading='eager'
          />
          <span className='brand-shine' aria-hidden='true' />
        </div>
        <div className='brand-micro-drop' aria-hidden='true' />
        <div className='brand-loader-text'>Cargando tu tienda…</div>
      </div>
    </div>
  )
}