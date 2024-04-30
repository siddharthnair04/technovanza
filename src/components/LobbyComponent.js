    import React,{useEffect, useState} from 'react'
    import logo from '../logo.png'
    import { wsurl } from '../App';
    import useWebSocket from 'react-use-websocket';
    import {useNavigate} from 'react-router-dom';

    function Lobby(){
        const { lastJsonMessage,sendJsonMessage } = useWebSocket(wsurl, {
            onOpen: () => {
                console.log('Lobby: WebSocket connection established.');
            },
            share: true,
            filter: false
        });
        const [timer,setTimer] = useState(3);
        const [tableData, setTableData] = useState([]);
        const [playerCount, setPlayerCount] = useState(0);
        const [maxPlayers, setMaxPlayers] = useState(null);
        const navigate = useNavigate();
        const changePlayerCount = (players) => {
            setPlayerCount(Object.keys(players).length);
        };

        useEffect(() => {
            // Send a request for the variable from the server when the component mounts
            sendJsonMessage({
              type: 'checkMaxPlayers' // Define an appropriate message type
            });
          }, [sendJsonMessage]); // Remove sendJsonMessage from the dependency array
          
        useEffect(() => {
            if(lastJsonMessage){
                console.log("Client lobby: ",lastJsonMessage);
                if (lastJsonMessage.type==='playerEvent') {
                    setTableData(lastJsonMessage.data);
                    changePlayerCount(lastJsonMessage.data);
                }
                else if(lastJsonMessage.type==='checkMaxPlayers'){
                    setMaxPlayers(lastJsonMessage.data);
                }
                else if (lastJsonMessage.type === 'broadcastTime'){
                    setTimer(lastJsonMessage.data);
                    document.getElementsByClassName('waiting-message')[0].innerHTML = "Game starting in "+timer;
                    if(timer===0){
                        navigate('/pregame');
                    }                   
                }
            }
        }, [lastJsonMessage,navigate,sendJsonMessage,timer]);
        return(
            <div className="LobbyTable">
                <img src={logo} className="App-logo-small" alt="logo" />
                <br />
                <div id='table-body'>
                    <div className='message-container'>
                        <p className='number-of-players-message'>Number of Players: {playerCount}/{maxPlayers}</p>
                        <p className='waiting-message'>Waiting for more players to join...</p>
                    </div>
                    <table className='table'>
                        <thead>
                            <tr>
                                <th id='sno'>S.No. </th>
                                <th id='player'>Player</th>
                                <th id='color'>Color</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(tableData).map((key,index) => (
                                <tr key={key}>
                                    <td>{index+1}</td>
                                    <td>{tableData[key].username}</td>
                                    <td>{tableData[key].color}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    export default Lobby;