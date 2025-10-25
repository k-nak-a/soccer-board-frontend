import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material"
import type { ButtonProps } from "@/Component/Molcules/Dialog/ButtonProps"

type Props = {
  isOpenDialog: boolean
  onClose: () => void
  currentInput: string
  setCurrentInput:  React.Dispatch<React.SetStateAction<string>>
  firstButton: ButtonProps
  secondButton: ButtonProps
  inputFieldLabel: string
}

const DialogWithInputField = ({isOpenDialog, onClose, currentInput, setCurrentInput, firstButton, secondButton, inputFieldLabel}: Props) => {

  return (
    <Dialog 
      open={isOpenDialog} 
      onClose={onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ fontSize: '1.1rem', pb: 1 }}>
        プレイヤーを追加
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <TextField
          autoFocus
          margin="dense"
          label={inputFieldLabel}
          type="text"
          fullWidth
          variant="outlined"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={firstButton.onClick} 
          size="large"
          sx={{ minWidth: '100px' }}
        >
          {firstButton.text}
        </Button>
        <Button 
          onClick={secondButton.onClick} 
          variant="contained" 
          color="primary"
          size="large"
          disabled={!currentInput.trim()}
          sx={{ minWidth: '100px' }}
        >
          {secondButton.text}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DialogWithInputField