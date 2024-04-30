import React, { useEffect, useState } from 'react';
import './App.css'
import Login from './components/LoginComponent.js'
import Lobby from './components/LobbyComponent.js'
import RoleReveal from './components/RoleRevealComponent.js';
import Game from './components/GameComponent.js';
import GameEnd from './components/EndComponent.js';
import {Routes,Route,Navigate,BrowserRouter} from 'react-router-dom'
import useWebSocket,{ReadyState} from 'react-use-websocket';
import Voting from './components/VotingComponent.js';

// const wsurl = 'ws://127.0.0.1:8000';
const wsurl = 'wss://among-us-web-socket-server.glitch.me/';

function App() {
  const [username, setUsername] = useState('');
  const [winner,setWinner] = useState('');
  const { sendJsonMessage, readyState} = useWebSocket(wsurl, {
    onOpen: () => {
      console.log('App: WebSocket connection established.');
    },
    share: true,
    filter: () => false,
    retryOnError: true,
    shouldReconnect: () => true,
  });

  useEffect(() => {
    if(username && readyState === ReadyState.OPEN) {
      sendJsonMessage({
        username,
        type: 'playerEvent'
      });
    }
  }, [username, sendJsonMessage, readyState]);

  return (
    <BrowserRouter>
        <Routes>
        <Route path='/play' element={<Login onLogin={setUsername}/>}/>
        <Route path='/Technovanza-AmongUs' element={<Navigate to ="/play" />} />
        <Route path='' element={<Navigate to ="/play" />} />
        <Route path='/waiting' element={<Lobby  />}/>
        <Route path='/pregame' element={<RoleReveal/>}></Route>
        <Route path='/game' element={<Game afterEnd={setWinner}/>}></Route>
        <Route path='/voting' element={<Voting afterEnd={setWinner}/>}></Route>
        <Route path='/game-ended' element={<GameEnd winner={winner}/>}></Route>
        </Routes>
    </BrowserRouter>
  );
}

export {wsurl, App as default};
