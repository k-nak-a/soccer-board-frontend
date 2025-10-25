import type { ReactNode } from "react"
import './index.scss'

type Props = {
  children?: ReactNode
  color?: string
  bgColor?: string
  className?: string
}

const PiecePlayer = ({children, color, bgColor, className}: Props) => {
  return (
    <div 
        style={{ 
          backgroundColor: bgColor || '#eeeeee',
          color: color || '#333' 
        }}
        className={`piece-player ${className ?? ''}`}>
      {children}
    </div>
  );
}

export default PiecePlayer