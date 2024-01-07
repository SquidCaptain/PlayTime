import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AssignmentIcon from "@material-ui/icons/Assignment"
import PhoneIcon from "@material-ui/icons/Phone"
import React, { useEffect, useRef, useState } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import io from "socket.io-client"
import "./App.css"

const socket = io.connect(`http://localhost:5000`)

function App() {
	const [ me, setMe ] = useState("")
	const [ stream, setStream ] = useState()
	const [ receivingInvite, setReceivingInvite ] = useState(false)
	const [ caller, setCaller ] = useState("")
	const [ callerSignal, setCallerSignal ] = useState()
	const [ inviteAccepted, setInviteAccepted ] = useState(false)
	const [ idToCall, setIdToCall ] = useState("")
	const [ callEnded, setCallEnded] = useState(false)
	const [ screenStreaming, setScreenStreaming] = useState(false)
	const [ isHost, setIsHost ] = useState(true)
	const [ name, setName ] = useState("")

	const myVideo = useRef(new MediaStream())
	const userVideo = useRef()
	const connectionRef = useRef([])

	const streamScreen = () => {
		navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).then((stream) => {
			setStream(stream)
			myVideo.current.srcObject = stream
		})
		setScreenStreaming(true)
	}
	const streamCam = () => {
		/* navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
			setStream(stream)
				myVideo.current.srcObject = stream
		})*/
		setScreenStreaming(false) 
	}

	useEffect(() => {

	  	socket.on("me", (id) => {
			setMe(id)
		})

		socket.on("inviteUser", (data) => {
			setIsHost(true)
			setReceivingInvite(true)
			setCaller(data.from)
			setName(data.name)
			setCallerSignal(data.signal)
		})
	}, [])

	const inviteUser = (id) => {
		setIsHost(true)
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("inviteUser", {
				userToCall: id,
				signalData: data,
				from: me,
				name: name
			})
		})
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream
		})
		socket.on("inviteAccepted", (signal) => {
			setInviteAccepted(true)
			peer.signal(signal)
		})

		connectionRef.current.push(peer)
	}

	const answerInvite =() =>  {
		setIsHost(false)
		setInviteAccepted(true)
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("answerInvite", { signal: data, to: caller })
		})
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream
		})

		peer.signal(callerSignal)
		connectionRef.current.push(peer)
	}

	const leaveCall = () => {
		setCallEnded(true)
		connectionRef.current.map((connections) => connections.destroy())
		connectionRef.current = []
		setIsHost(true)
	}

	return (
		<>
			<h1 style={{ textAlign: "center", color: '#fff' }}>PartyTime</h1>
			<div className="container">
				<div className="video-container">
					{isHost ? (
						<div className="video">
							{stream &&  <video playsInline muted ref={myVideo} autoPlay style={{ width: "300px" }} />}
						</div>
					) : (
						<div className="video">
							{inviteAccepted && !callEnded ?
							<video playsInline ref={userVideo} autoPlay style={{ width: "300px"}} />:
							null}
						</div>
					)}
				</div>
				<div className="myId">
					{isHost ? (
						<div>
							<TextField
								id="filled-basic"
								label="Name"
								variant="filled"
								value={name}
								onChange={(e) => setName(e.target.value)}
								style={{ marginBottom: "20px" }}
							/>
							<CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
								<Button variant="contained" color="primary" startIcon={<AssignmentIcon fontSize="large" />}>
									Copy ID
								</Button>
							</CopyToClipboard>

							<TextField
								id="filled-basic"
								label="ID to call"
								variant="filled"
								value={idToCall}
								onChange={(e) => setIdToCall(e.target.value)}
							/>
						</div>
					):(<div></div>)}
					<div className="call-button">
						{inviteAccepted && !isHost ? (
							<Button variant="contained" color="secondary" onClick={leaveCall}>
								End Call
							</Button>
						) : (
							<IconButton color="primary" aria-label="call" onClick={() => inviteUser(idToCall)}>
								<PhoneIcon fontSize="large" />
							</IconButton>
						)}
						{idToCall}
					</div>
					<div className="stream-button">
						{screenStreaming ? (
							<Button variant="contained" color="secondary" onClick={streamCam}>
								Stop Stream
							</Button>
						) : (
							<Button variant="contained" color="primary" onClick={streamScreen}>
								Stream Tab
							</Button>
						)}
					</div>
				
				</div>
				<div>
					{receivingInvite && !inviteAccepted ? (
							<div className="caller">
							<h1 >{name} is inviting you...</h1>
							<Button variant="contained" color="primary" onClick={answerInvite}>
								Answer
							</Button>
						</div>
					) : null}
				</div>
			</div>
		</>
	)
}

export default App