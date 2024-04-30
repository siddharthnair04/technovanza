import React,{useEffect, useState} from "react";
import {useNavigate} from 'react-router-dom';
import shh from '../amongus_shh.png'
import useWebSocket from 'react-use-websocket';
import {wsurl} from '../App.js'

function RoleReveal(){
    const [role,setRole] = useState('');
    const [timer,setTimer] = useState(5);
    const {sendJsonMessage,lastJsonMessage} = useWebSocket(wsurl,{
        share:true,
        filter:false,
    });
    const navigate = useNavigate();

    //request sending
    useEffect(() => {
        sendJsonMessage({
            type: 'requestRole'
        });
    },[sendJsonMessage]);
    //incoming
    useEffect(() => {
        if(lastJsonMessage){
            if (lastJsonMessage.type==='requestRole') {
                setRole(lastJsonMessage.data.toUpperCase());
            }
            else if (lastJsonMessage.type === 'broadcastTime') {
                setTimer(lastJsonMessage.data);
                if(timer===0){
                    navigate('/game');
                }
            }
        }
    }, [lastJsonMessage,timer,role,navigate]);

    return(
        <div className="RoleReveal">
        <div className="role-reveal-box">
            <p className="top-text">Your role:</p>
            <img src={shh} id="amongus-shh" alt=''/>
            <p className="bottom-text">{role}</p>
        </div>
        <p className="game-starting-in">Game starts in {timer}</p>
        </div>
    )
}

export default RoleReveal;