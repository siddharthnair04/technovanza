import { useState,useEffect } from "react";
import { wsurl } from "../App";
import useWebSocket from "react-use-websocket";
import {useNavigate} from 'react-router-dom';

function Voting({afterEnd}){
    const {sendJsonMessage,lastJsonMessage} = useWebSocket(wsurl,{
        share:true,
        filter:false,
    });
    const navigate = useNavigate();

    //define states
    const [votes,setVotes] = useState({});
    const [voteSubmitted, setVoteSubmitted] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [previouslySelectedPlayer, setPreviouslySelectedPlayer] = useState(null);
    const [resultOfVote, setResultOfVote] = useState("");
    const [myUsername,setMyUsername] = useState("");
    const [players,setPlayers] = useState({});
    const [timer,setTimer] = useState("");
    //requests
    useEffect(() => {
        sendJsonMessage({
            type: 'votePlayer'
        })
        sendJsonMessage({
            type: 'requestUsername'
        })
        sendJsonMessage({
            type: 'requestAllPlayers'
        })
        console.log("all initial requests done");
      },[sendJsonMessage]);    
    //message handling
    useEffect(() => {
        if(lastJsonMessage){
            if(lastJsonMessage.type === 'votePlayer'){
                if(lastJsonMessage.data==='ejected'){
                    setResultOfVote("1 player being ejected...");
                }
                else if(lastJsonMessage.data==='tie'){
                    setResultOfVote("No players ejected...")
                }
                else if(lastJsonMessage.data==='completed'){
                    navigate('/game');
                }
                else{
                    setVotes(lastJsonMessage.data);
                }
            }
            else if(lastJsonMessage.type === 'requestUsername'){
                setMyUsername(lastJsonMessage.data);
            }
            else if(lastJsonMessage.type === 'killPlayer'){
                //TODO: ENSURE THAT ON THE GAME SCREEN, PLAYER DEAD IS SET TO TRUE
                console.log("Recieved kill on wrong screen");
            }
            else if(lastJsonMessage.type === 'gameEnded'){
                afterEnd && afterEnd(lastJsonMessage.data);
                navigate('/game-ended');
            }
            else if(lastJsonMessage.type === 'endGame'){
                afterEnd && afterEnd("NONE (GAME FORCE STOPPED)");
                navigate('/game-ended');              
            }
            else if(lastJsonMessage.type === 'broadcastTime'){
                setTimer(secondsToMMSS(lastJsonMessage.data));
            }
            else if(lastJsonMessage.type === 'requestAllPlayers'){
                setPlayers(lastJsonMessage.data);
            }
        }
      }, [lastJsonMessage]);
    //functions
    const handleVoteChange = (player) => {
        setSelectedPlayer(player);
    };
    
    const submitVotes = () => {
        // Send final update to the server with "voted" set to true
        if (myUsername) {

            setVotes((prevVotes) => {
                const updatedVotes = { ...prevVotes };
                if (selectedPlayer) {
                    updatedVotes[selectedPlayer] = {
                        ...updatedVotes[selectedPlayer],
                        votes: updatedVotes[selectedPlayer].votes + 1,
                    };
                }
                else return;
                updatedVotes[myUsername] = {
                    ...updatedVotes[myUsername],
                    voted: true,
                };
                // Send final update to the server
                sendJsonMessage({
                    type: 'votePlayer',
                    data: updatedVotes,
                });
                return updatedVotes;
            });
        }
        setVoteSubmitted(true);
    };
    function secondsToMMSS(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
      
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');
      
        return `${formattedMinutes}:${formattedSeconds}`;
    }
    //markup
    return(
        <div className="Voting">
            <p className="game-timer">{timer}</p>
            <h2>EMERGENCY MEETING</h2>
            <form>
                <fieldset>
                    <legend>VOTE</legend>
                    {/* Dynamically create radio buttons based on the votes state */}
                    {Object.entries(votes).map(([player, data]) => (
                    <div key={player}>
                        <input
                        type="radio"
                        name="vote"
                        value={player}
                        onChange={() => handleVoteChange(player)}
                        disabled={voteSubmitted}
                        />
                        <label>{`${player} (${
                players && Object.values(players).find(p => p.username === player)?.color
            })\t(${data.votes} votes)`}</label>
                    </div>
                    ))}
                    {/* Submit button */}
                    <button type="button" onClick={submitVotes} disabled={voteSubmitted}>
                    VOTE
                    </button>
                </fieldset>
                <p>{resultOfVote}</p>
            </form>
        </div>
    )
}
export default Voting;