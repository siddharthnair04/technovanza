import { useState } from "react";
import scary from '../scp.png'

function GameEnd({winner}){
    const end_image = scary;
    return(
        <div className="GameEnd">
            <p className="game-ended-message">GAME OVER</p>
            <img src={end_image} id="game-ended-image" alt=''/>
            <p className='who-won'>Winner: {winner}</p>
        </div>
    )
}

export default GameEnd;