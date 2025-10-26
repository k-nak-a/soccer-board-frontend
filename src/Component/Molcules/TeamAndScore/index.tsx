import BoxText from "@/Component/Atoms/Box/Text"
import { Box } from "@mui/material"
import { forwardRef } from "react"
import './index.scss'

type TeamProps = {
    name: string
    score: number
}

type Props = {
  ally: TeamProps
  opponent: TeamProps
  className?: string
}

const TeamAndScore = forwardRef<HTMLDivElement, Props>(({ ally, opponent, className }, ref) => {
  return (
    <Box ref={ref} className={`team-and-score ${className ?? ''}`}>
      <BoxText className={"team-name"} text={ally.name} outline={false} color="#333" backgroundColor="#BBF"/>
      <BoxText className={"score"} text={`${ally.score} - ${opponent.score}`} outline={false} color={"#333"} backgroundColor="#DDD" />
      <BoxText className={"team-name"} text={opponent.name} outline={false} color="#333" backgroundColor="#FBB"/>
    </Box>
  )
})

// displayNameを設定
TeamAndScore.displayName = 'TeamAndScore'

export default TeamAndScore