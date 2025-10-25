import { Box } from "@mui/material"
import './index.scss'

type Props = {
  text: string
  color?: string
  backgroundColor?: string
  outline: boolean
  className?: string
}

const BoxText = ({text, color = "#333", backgroundColor = "#FFF", outline = false, className}: Props) => {
  return <Box className={`box-text ${outline ? "outline" : ''} ${className ?? ''}`} sx={{color: color, backgroundColor: backgroundColor,}}>{text}</Box>
}

export default BoxText