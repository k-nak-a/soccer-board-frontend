import PiecePlayer from "@/Component/Atoms/Piece/Player";
import { Box } from "@mui/material";
import type { ReactNode } from "react";
import './index.scss'

type Props = {
  id: number;
  position: PlayerPosition;
  onDragStart: (id: number, clientX: number, clientY: number) => void;
  onTap?: (id: number) => void;
  color?: string;
  bgColor?: string;
  children?: ReactNode;
  goals?: number
  className?: string;
}

const DraggablePlayer = ({
  id,
  position,
  onDragStart,
  onTap,
  color,
  bgColor,
  children,
  goals,
  className
}: Props) => {

  const handleClick = () => {
    if (onTap) {
      onTap(id);
    }
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onDragStart(id, e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    onDragStart(id, touch.clientX, touch.clientY);
  };

  return (
    <Box
      className="draggable-player"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
    >
      <PiecePlayer
        color={color}
        bgColor={bgColor}
        children={children}
        className={className}
      />
      {goals && goals > 0 && 
        <Box className="goals">⚽x{goals}</Box>
      }
    </Box>
  );
};

export default DraggablePlayer