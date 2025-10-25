import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material"
import type { ButtonProps } from "@/Component/Molcules/Dialog/ButtonProps"

type Props = {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  firstButton: ButtonProps
  secondButton: ButtonProps
  customContent?: React.ReactNode
  className?: string
}

const DialogSimple = ({
  isOpen, 
  onClose, 
  title, 
  message, 
  firstButton, 
  secondButton,
  customContent,
  className,
}: Props) => {

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      className={`dialog-simple ${className ?? ''}`}
    >
      <DialogTitle sx={{ fontSize: '1.1rem', pb: 1 }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <DialogContentText>
          {message}
        </DialogContentText>
        {customContent}  {/* 追加 */}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={firstButton.onClick} 
          size="large"
          sx={{ minWidth: '100px' }}
        >
          {firstButton.text}
        </Button>
        {secondButton.text && (
          <Button 
            onClick={secondButton.onClick} 
            variant="contained" 
            color="error"
            size="large"
            sx={{ minWidth: '100px' }}
          >
            {secondButton.text}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default DialogSimple
