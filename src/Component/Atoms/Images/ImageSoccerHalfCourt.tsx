import IMAGE_SOCCER_HALF_COURT from '/public/images/soccer_half_court.png'
import './index.scss'

type Props = {
  className?: string
}

const ImageSoccerHalfCourt = ({className}: Props) => {
  return <img className={`image-soccer-court ${className} ?? ''`} src={IMAGE_SOCCER_HALF_COURT} alt="サッカーコート" />
}

export default ImageSoccerHalfCourt