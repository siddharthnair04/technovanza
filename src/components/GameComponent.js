import React, { useEffect } from "react";
import { useState } from "react";
import useWebSocket from "react-use-websocket";
import { wsurl } from "../App";
import { useNavigate } from "react-router";
import map from '../map.png'

function TaskBox(){
    //define states
    const [tasks, setTasks] = useState({});
    
    //websocket connection
    const {sendJsonMessage,lastJsonMessage} = useWebSocket(wsurl,{
        share:true,
        filter:false,
    });
    //requests
    useEffect(() => {
        sendJsonMessage({
            type: 'taskEvent'
        });
    },[sendJsonMessage]);
    //incoming
    useEffect(() => {
        if(lastJsonMessage){
            if (lastJsonMessage.type==='taskEvent') {
                setTasks(lastJsonMessage.data);
            }
        }
    }, [lastJsonMessage]);

    const handleCheckboxChange = (taskId) => {
        setTasks((prevTasks) => {
          console.log("Previous tasks:", prevTasks);
          console.log("Received taskId:", taskId);
      
          if (prevTasks.hasOwnProperty(taskId)) {
            console.log(`Toggling checked for task ${taskId}`);
            if(prevTasks[taskId].expanded === true){
              prevTasks[taskId].expanded=false;
            }
            const updatedTasks = {
              ...prevTasks,
              [taskId]: {
                ...prevTasks[taskId],
                checked: !prevTasks[taskId].checked,
              },
            };
      
            // Send the modified tasks to the server
            const modifiedTasks = Object.fromEntries(
              Object.entries(updatedTasks).map(([taskId, task]) => [
                taskId,
                {
                  name: task.name,
                  description: task.description,
                  completed: task.checked?task.checked:false
                },
              ])
            );
      
            sendJsonMessage({
              type: 'taskEvent',
              data: modifiedTasks ? modifiedTasks : '',
            });
      
            return updatedTasks;
          }
      
          console.log(`Task ${taskId} not found`);
          return prevTasks;
        });
      };
    const toggleDescription = (taskId) => {
        setTasks((prevTasks) => {
          const updatedTasks = { ...prevTasks }; // Create a shallow copy of the tasks object
      
          // Update the expanded property for the specific task
          if (updatedTasks[taskId]) {
            updatedTasks[taskId] = {
              ...updatedTasks[taskId],
              expanded: !updatedTasks[taskId].expanded,
            };
          }
      
          return updatedTasks;
        });
    };
    return(
        <div className="task-box">
            <p id="task-header">Tasks:</p>
            <ul className="task-list">
                {Object.entries(tasks).map(([taskId,task]) => (
                    <li key={taskId} className={`task ${task.expanded ? 'expanded' : ''} ${task.checked ? 'disabled' : ''}`}
                    style={{
                        color: task.checked ? '#666666' : 'rgb(0,0,0)',
                        pointerEvents: task.checked ? 'none' : 'auto',
                        
                      }}
                    >
                    <span className="task-title">
                        <div className="arrow-bullet" onClick={() => toggleDescription(taskId)}>
                        {task.expanded ? '▼' : '▶'} {/* You can use your own arrow icons here */}
                        </div>
                        {task.name}
                        <div className='checkbox-container'>
                            <input type="checkbox" id={`checkbox-${taskId}`} checked={task.checked} onChange={() => handleCheckboxChange(taskId)} disabled={task.checked}/>
                            <label htmlFor={`checkbox-${taskId}`}></label>
                        </div>
                    </span>
                    <div className="description" style={{ display: task.expanded ? 'block' : 'none' }}>
                        <p>{task.description}</p>
                    </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

function KillModal({closeModal}){
  const {sendJsonMessage,lastJsonMessage} = useWebSocket(wsurl,{
    share:true,
    filter:false,
  });
  //define states
  const [username,setUsername] = useState('');
  const [players,setPlayers] = useState({});
  const [cooldown,setCooldown] = useState(0);
  //requests
  useEffect(() => {
    sendJsonMessage({
      type: 'requestUsername'
    })
    sendJsonMessage({
      type: 'requestAllPlayers'
    });
  },[sendJsonMessage]);
   //message handling
   useEffect(() => {
    if(lastJsonMessage){
        if(lastJsonMessage.type === 'requestUsername'){
          setUsername(lastJsonMessage.data);
        }
        else if(lastJsonMessage.type === 'requestAllPlayers'){
          const players_obj = lastJsonMessage.data;
          const filteredPlayers =  Object.fromEntries(
            Object.entries(players_obj).filter(([key, value]) => value.username !== username && value.alive)
          );
          setPlayers(filteredPlayers);
        }
        else if(lastJsonMessage.type === 'broadcastCooldown'){
          setCooldown(lastJsonMessage.data);
        }
    }
  }, [lastJsonMessage]);
  //function definitions
  function killPlayer(){
    const selectedPlayer = document.getElementById('player-to-kill').value;
    if(cooldown===0){
      sendJsonMessage({
        type:"killPlayer",
        data:selectedPlayer
      })
      sendJsonMessage({
        type: 'requestAllPlayers',
      });
    }
  }
  return(
    <div className="KillModal" onClick={closeModal}>
      <div className="players-to-kill" onClick={(e) => e.stopPropagation()}>
        <label htmlFor="player-to-kill">Select a player:</label><br/>
        <select id="player-to-kill">
          {Object.values(players).map((player, index) => (
            <option key={index} value={player.username}>{`${player.username} (${player.color})`}</option>
          ))}
        </select><br/>
        <button className="kill-button" onClick={killPlayer} disabled={cooldown>0}>Kill</button>
        {cooldown>0 && <p id="cooldown-timer">Cooldown: {cooldown} seconds</p>}
      </div>
    </div>
  )
}

function MapModal({closeModal}){
  return(
    <div className="MapModal" onClick={closeModal}>
      <img id="map" src={map} onClick={(e) => e.stopPropagation()}>

      </img>
    </div>
  )
}

function Game({afterEnd}){
    function secondsToMMSS(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
      
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');
      
        return `${formattedMinutes}:${formattedSeconds}`;
    }
    const navigate = useNavigate();
    //define states
    const [timer,setTimer] = useState("");
    const [killButtonEnabled,setKillButtonEnabled] = useState(false);
    const [isKillModalOpen, setIsKillModalOpen] = useState(false);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [playerDead,setPlayerDead] = useState(false);
    const [myUsername, setMyUsername] = useState('');
    //websocket connections
    const {sendJsonMessage,lastJsonMessage} = useWebSocket(wsurl,{
        share:true,
        filter:false,
    });
    // //request sending
    useEffect(() => {
      sendJsonMessage({
        type: 'requestRole'
      });
      sendJsonMessage({
        type: 'requestUsername'
      })
  },[sendJsonMessage]);
    //message handling
    useEffect(() => {
        if(lastJsonMessage){
            if (lastJsonMessage.type === 'broadcastTime') {
              setTimer(secondsToMMSS(lastJsonMessage.data));
            }
            else if(lastJsonMessage.type === 'gameEnded'){
              afterEnd && afterEnd(lastJsonMessage.data);
              navigate('/game-ended');
            }
            else if(lastJsonMessage.type === 'requestRole'){
              if(lastJsonMessage.data === 'imposter'){
                setKillButtonEnabled(true);
              }
            }
            else if(lastJsonMessage.type === 'killPlayer'){
              setPlayerDead(true);
            }
            else if(lastJsonMessage.type === 'allowVoting'){
                if(!playerDead){
                  navigate('/voting');
                }
            }
            else if(lastJsonMessage.type === 'requestUsername'){
              setMyUsername(lastJsonMessage.data);
              sendJsonMessage({
                type: 'requestAllPlayers'
              });
            }
            else if(lastJsonMessage.type === 'requestAllPlayers'){
              for(const player in lastJsonMessage.data){
                if(lastJsonMessage.data[player].username === myUsername && lastJsonMessage.data[player].hasOwnProperty('alive') && !lastJsonMessage.data[player].alive){
                  setPlayerDead(true);
                }
              }
            }
            else if(lastJsonMessage.type === 'endGame'){
              afterEnd && afterEnd("NONE (GAME FORCE STOPPED)");
              navigate('/game-ended');              
            }
        }
    }, [lastJsonMessage,timer,navigate]);
    //functions
    const openKillModal = () => {
      setIsKillModalOpen(true);
    };
    const closeKillModal = () => {
      setIsKillModalOpen(false);
    };
    const openMapModal = () => {
      setIsMapModalOpen(true);
    };
    const closeMapModal = () => {
      setIsMapModalOpen(false);
    };
    //html
    return(
        <div className='Game'>
            <p className="game-timer">{timer}</p>
            {playerDead?<p className="you-died-message">YOU DIED!</p>:<TaskBox />}
            {!playerDead?<div className='below-task-box'>
              <p id="planet">🪐</p>
              <button id='map_icon' onClick={openMapModal}/>
              <button id="spaceship" onClick={openKillModal} disabled={!killButtonEnabled}>🚀</button>
              {isKillModalOpen && (
                <KillModal closeModal={closeKillModal}/>
              )}
              {isMapModalOpen && (
                <MapModal closeModal={closeMapModal}/>
              )}
            </div>:<></>}
        </div>
    )
}

export default Game;