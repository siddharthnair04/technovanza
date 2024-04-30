import logo from '../logo.png';
import React,{useEffect, useState} from "react";
import {useNavigate} from 'react-router-dom';
import useWebSocket from 'react-use-websocket';
import {wsurl} from '../App.js'

function Login({onLogin}){
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    const {sendJsonMessage,lastJsonMessage} = useWebSocket(wsurl,{
        onOpen: () => {
            console.log('Login: WebSocket connection established.');
        },
        share:true,
        filter:false,
    });
    useEffect(() => {
        const error_msg = document.getElementsByClassName('error-message')[0];
        if (lastJsonMessage) {
          if (lastJsonMessage.type === 'lobbyFull') {
            // Handle the logic here after receiving the server response
            if (lastJsonMessage.data) {
              error_msg.innerHTML = "Lobby is full! Please join later.";
            } else {
              onLogin && onLogin(username);
              navigate('/waiting');
            }
          }
        }
      }, [lastJsonMessage,navigate,onLogin,username]);
    
    const handleSubmit = (event) => {
        event.preventDefault();
        const error_msg = document.getElementsByClassName('error-message')[0];
        if (!username.trim()) {
          error_msg.innerHTML = "Please enter a valid username!";
          return;
        }
        sendJsonMessage({
          type: 'lobbyFull'
        });
        console.log("sent a check request!");
      };
      
    return(
        <div className="Login">
            <img src={logo} className="App-logo" alt="logo" />
            <br />
            <form onSubmit={handleSubmit} className='form'>
            <label htmlFor='uname'>Enter a username: </label>
            <br />
            <input type='text' id='uname' name='uname' placeholder='Eg:- HungoverKitten' onInput={(e) => setUsername(e.target.value)}/>
            <br />
            <input type='submit' value='PLAY'/>
            <p className='error-message'></p>
            </form>
        </div>  
    )
}

export default Login;