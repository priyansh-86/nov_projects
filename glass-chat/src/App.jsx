import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { db, rtdb } from './firebase'; 
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, getDocs, doc, deleteDoc, 
  setDoc, updateDoc, getDoc 
} from 'firebase/firestore';
import { 
  ref, set, onDisconnect, onValue, remove 
} from 'firebase/database';
import QRCode from 'react-qr-code';
import { 
  Send, LogOut, ShieldCheck, Users, Lock, Crown, 
  Trash2, QrCode, Mic, Paperclip, FileText, 
  StopCircle, Loader2, Edit2, Wifi, WifiOff, X, Check, ArrowRightLeft
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// --- CONFIGURATION FROM ENV ---
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// --- COMPONENTS ---

const AnimatedBackground = () => (
  <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 bg-gray-900">
    <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
    <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
    <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
  </div>
);

const sendSystemMessage = async (roomId, text) => {
  try {
    await addDoc(collection(db, `rooms/${roomId}/messages`), {
      text: text, type: 'system', createdAt: serverTimestamp(), uid: uuidv4()
    });
  } catch (err) { console.error(err); }
};

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  let resourceType = 'auto';
  if (file.type.includes('image')) resourceType = 'image';
  else if (file.type.includes('video')) resourceType = 'video';

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, { method: "POST", body: formData });
    const data = await res.json();
    return data.secure_url; 
  } catch (error) { throw error; }
};

// --- HOME SCREEN ---
const Home = () => {
  const [username, setUsername] = useState('');
  const [createPin, setCreatePin] = useState('');
  const navigate = useNavigate();

  const createRoom = async () => {
    if (!username.trim()) return alert("Naam jaruri hai!");
    if (!createPin.trim() || createPin.length < 4) return alert("PIN 4 digit ka rakho.");

    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    await setDoc(doc(db, 'rooms', newRoomCode), {
      roomId: newRoomCode, createdAt: serverTimestamp(), host: username, pin: createPin
    });

    sessionStorage.setItem(`auth_${newRoomCode}`, 'true');
    sessionStorage.setItem('chat_user', username);
    navigate(`/room/${newRoomCode}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 select-none">
      <AnimatedBackground />
      <div className="glass rounded-2xl p-8 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
    <img 
      src="/logo.png" 
      alt="App Logo" 
      className="w-24 h-24 rounded-full object-cover border-4 border-white/10 shadow-2xl drop-shadow-lg animate-blob" 
    />
  </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-pink-200">Glass Chat</h1>
          <p className="text-gray-400 text-sm mt-2">Realtime Presence • Secure</p>
        </div>
        <div className="space-y-6">
          <input type="text" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your Name" />
          <input type="password" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none tracking-widest" value={createPin} onChange={(e) => setCreatePin(e.target.value)} maxLength={6} placeholder="SET PIN" />
          <button onClick={createRoom} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl shadow-lg">Create Room</button>
        </div>
      </div>
    </div>
  );
};

// --- CHAT ROOM SCREEN ---
const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authName, setAuthName] = useState(sessionStorage.getItem('chat_user') || '');
  const [authPin, setAuthPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [roomHost, setRoomHost] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState(null);
  
  const [showQR, setShowQR] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  
  const messagesEndRef = useRef(null);
  const prevParticipantsRef = useRef([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  useEffect(() => {
    const isAuth = sessionStorage.getItem(`auth_${roomId}`);
    if (isAuth === 'true') setIsAuthenticated(true);
    setLoading(false);

    const unsubRoom = onSnapshot(doc(db, 'rooms', roomId), (doc) => {
      if (!doc.exists()) {
        alert("Room destroyed.");
        sessionStorage.clear();
        navigate('/');
      } else {
        setRoomHost(doc.data().host);
      }
    });
    return () => unsubRoom();
  }, [roomId, authName]);

  useEffect(() => {
    if (!isAuthenticated || !authName) return;

    const userStatusRef = ref(rtdb, `rooms/${roomId}/users/${authName}`);
    set(userStatusRef, { name: authName, online: true });
    onDisconnect(userStatusRef).remove();

    const allUsersRef = ref(rtdb, `rooms/${roomId}/users`);
    const unsubRTDB = onValue(allUsersRef, (snapshot) => {
      const data = snapshot.val();
      const currentUsers = data ? Object.values(data) : [];
      setParticipants(currentUsers);

      if (prevParticipantsRef.current.length > 0) {
        const leftUsers = prevParticipantsRef.current.filter(prev => !currentUsers.find(curr => curr.name === prev.name));
        leftUsers.forEach(user => {
            if (authName === roomHost || (roomHost === user.name && authName === currentUsers[0]?.name)) {
                sendSystemMessage(roomId, `${user.name} left the room.`);
            }
        });
      }
      prevParticipantsRef.current = currentUsers;
    });

    if (!sessionStorage.getItem(`joined_msg_${roomId}`)) {
        sendSystemMessage(roomId, `${authName} joined the room.`);
        sessionStorage.setItem(`joined_msg_${roomId}`, 'true');
    }

    const unsubMessages = onSnapshot(query(collection(db, `rooms/${roomId}/messages`), orderBy('createdAt')), (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      if (!editingMsgId) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    return () => { remove(userStatusRef); unsubRTDB(); unsubMessages(); };
  }, [isAuthenticated, roomId, authName, roomHost]);

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); editingMsgId ? submitEdit() : sendMessage(e); }};
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await addDoc(collection(db, `rooms/${roomId}/messages`), { text: newMessage, sender: authName, type: 'text', createdAt: serverTimestamp(), uid: uuidv4() });
    setNewMessage('');
  };
  const deleteMessage = async (msgId) => { if(confirm("Delete?")) await deleteDoc(doc(db, `rooms/${roomId}/messages`, msgId)); };
  const startEdit = (msg) => { setNewMessage(msg.text); setEditingMsgId(msg.id); };
  const submitEdit = async () => { if (!newMessage.trim()) return cancelEdit(); await updateDoc(doc(db, `rooms/${roomId}/messages`, editingMsgId), { text: newMessage, isEdited: true }); cancelEdit(); };
  const cancelEdit = () => { setNewMessage(''); setEditingMsgId(null); };

  const destroyRoom = async () => {
    if (!confirm("Destroy Room?")) return;
    const msgSnap = await getDocs(collection(db, 'rooms', roomId, 'messages'));
    await Promise.all(msgSnap.docs.map(d => deleteDoc(d.ref)));
    await deleteDoc(doc(db, 'rooms', roomId));
    await remove(ref(rtdb, `rooms/${roomId}`));
    navigate('/');
  };
  const transferAdmin = async (newHostName) => {
    await updateDoc(doc(db, 'rooms', roomId), { host: newHostName });
    await sendSystemMessage(roomId, `Crown passed to ${newHostName}`);
    await remove(ref(rtdb, `rooms/${roomId}/users/${authName}`));
    sessionStorage.removeItem(`auth_${roomId}`);
    navigate('/'); 
  };
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      let type = 'file'; if (file.type.includes('image')) type='image'; else if (file.type.includes('video')) type='video'; else if (file.type.includes('audio')) type='audio';
      await addDoc(collection(db, `rooms/${roomId}/messages`), { text: file.name, mediaUrl: url, type: type, sender: authName, createdAt: serverTimestamp(), uid: uuidv4() });
    } catch (err) { alert("Upload Failed"); }
    setUploading(false);
  };
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], "voice.webm", { type: "audio/webm" });
        setUploading(true);
        try { const url = await uploadToCloudinary(file); await addDoc(collection(db, `rooms/${roomId}/messages`), { text: "Voice Note", mediaUrl: url, type: 'audio', sender: authName, createdAt: serverTimestamp(), uid: uuidv4() }); } catch (err) {}
        setUploading(false); stream.getTracks().forEach(t => t.stop());
      };
      recorder.start(); setMediaRecorder(recorder); setIsRecording(true);
    } catch (err) { alert("Mic Error"); }
  };
  const stopRecording = () => { if (mediaRecorder) { mediaRecorder.stop(); setIsRecording(false); setMediaRecorder(null); } };
  const isEditable = (msg) => { if (!msg.createdAt) return false; return (new Date() - msg.createdAt.toDate()) / 60000 < 5; };
  const renderMessageContent = (msg) => {
    if (msg.type === 'image') return <div className="mt-2"><img src={msg.mediaUrl} className="rounded-lg max-w-[200px] border border-white/20" /></div>;
    if (msg.type === 'video') return <div className="mt-2"><video src={msg.mediaUrl} controls className="rounded-lg max-w-[200px] border border-white/20" /></div>;
    if (msg.type === 'audio') return <div className="mt-2 flex items-center gap-2 bg-black/20 p-2 rounded-lg"><Mic className="w-4 h-4 text-blue-300"/><audio src={msg.mediaUrl} controls className="h-8 w-40" /></div>;
    if (msg.type === 'file') return <a href={msg.mediaUrl} target="_blank" className="mt-2 flex items-center gap-2 bg-white/10 p-2 rounded-lg underline"><FileText className="w-4 h-4" />{msg.text}</a>;
  };

  if (loading) return <div className="text-white text-center mt-20">Loading...</div>;

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center p-4 select-none">
      <AnimatedBackground />
      <div className="glass rounded-2xl p-8 w-full max-w-sm animate-fade-in z-50">
         <div className="flex justify-center mb-6"><div className="bg-red-500/20 p-4 rounded-full border border-red-500/30"><Lock className="w-8 h-8 text-red-400" /></div></div>
         <h2 className="text-xl font-bold text-center text-white mb-4">Locked Room</h2>
         <div className="space-y-4">
           <input type="text" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" placeholder="Name" value={authName} onChange={(e) => setAuthName(e.target.value)} />
           <input type="password" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none tracking-widest" placeholder="PIN" value={authPin} onChange={(e) => setAuthPin(e.target.value)} />
           {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
           <button onClick={async () => {
              const snap = await getDoc(doc(db, 'rooms', roomId));
              if(snap.exists() && snap.data().pin === authPin) {
                 sessionStorage.setItem(`auth_${roomId}`, 'true'); sessionStorage.setItem('chat_user', authName);
                 setIsAuthenticated(true);
              } else setErrorMsg('Invalid PIN');
           }} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl">Join</button>
         </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden relative select-none text-sm md:text-base">
      <AnimatedBackground />
      <header className="glass h-16 px-4 flex items-center justify-between shrink-0 z-10 m-2 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg"><ShieldCheck className="w-5 h-5" /></div>
          <div>
            <h2 className="font-bold text-white">Secure Channel</h2>
            <div className="flex items-center gap-3 text-[10px] text-gray-300">
               <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {participants.length}</span>
               <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-yellow-400" /> {roomHost}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center">
           <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${isOnline ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-red-500/20 border-red-500/30 text-red-300'}`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />} <span className="hidden sm:inline">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
           </div>
           <button onClick={() => setShowQR(!showQR)} className="p-2 hover:bg-white/10 rounded-full text-white"><QrCode className="w-5 h-5" /></button>
           <button onClick={() => authName === roomHost ? setShowAdminModal(true) : navigate('/')} className="p-2 hover:bg-red-500/20 text-red-300 rounded-full"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>
      {showAdminModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4 border border-red-500/30">
            <h3 className="font-bold text-lg text-red-400 flex items-center gap-2"><Crown className="w-5 h-5"/> Admin Zone</h3>
            <button onClick={destroyRoom} className="w-full p-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-left group">
              <span className="text-red-300 font-bold flex items-center justify-between">Destroy Room <Trash2 className="w-5 h-5"/></span>
            </button>
            <div className="space-y-2 mt-2 pt-2 border-t border-white/10">
              <p className="text-xs text-gray-500 uppercase font-bold ml-1">Pass the Crown:</p>
              <div className="max-h-40 overflow-y-auto scrollbar-hide space-y-2">
                {participants.filter(p => p.name !== authName).length === 0 ? (
                  <div className="bg-white/5 p-3 rounded-xl text-center"><p className="text-gray-500 text-xs italic">No other users online.</p></div>
                ) : (
                  participants.filter(p => p.name !== authName).map(user => (
                    <button key={user.name} onClick={() => transferAdmin(user.name)} className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                      <span className="text-white text-sm">{user.name}</span><ArrowRightLeft className="w-4 h-4 text-blue-300" />
                    </button>
                  ))
                )}
              </div>
            </div>
            <button onClick={() => setShowAdminModal(false)} className="text-gray-400 text-sm mt-2">Cancel</button>
          </div>
        </div>
      )}
      {showQR && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowQR(false)}><div className="glass p-6 rounded-2xl flex flex-col items-center gap-4"><div className="bg-white p-2 rounded"><QRCode value={window.location.href} size={150} /></div><p className="text-white font-mono">{roomId}</p></div></div>}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {messages.map((msg) => {
          if (msg.type === 'system') return <div key={msg.id} className="flex justify-center my-2"><span className="bg-yellow-500/10 text-yellow-200/80 text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">{msg.text}</span></div>;
          const isMe = msg.sender === authName;
          const canEdit = isMe && msg.type === 'text' && isEditable(msg);
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
              <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                   <span className="text-[10px] text-gray-400 opacity-70 ml-1">{msg.sender}</span>
                   {isMe && <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">{canEdit && <button onClick={() => startEdit(msg)} className="p-1 hover:bg-white/10 rounded text-blue-300"><Edit2 className="w-3 h-3"/></button>}<button onClick={() => deleteMessage(msg.id)} className="p-1 hover:bg-white/10 rounded text-red-300"><Trash2 className="w-3 h-3"/></button></div>}
                </div>
                <div className={`px-4 py-2 rounded-2xl backdrop-blur-md border border-white/5 shadow-sm relative ${isMe ? 'bg-blue-600/80 text-white rounded-tr-sm' : 'bg-white/10 text-gray-100 rounded-tl-sm'}`}>
                  {msg.type === 'text' ? (<div>{msg.text}{msg.isEdited && <span className="text-[9px] text-white/50 block text-right mt-1 ml-2 italic">(edited)</span>}</div>) : renderMessageContent(msg)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 shrink-0 z-10">
        {uploading && <div className="text-center text-xs text-blue-300 mb-2 flex items-center justify-center gap-2"><Loader2 className="w-3 h-3 animate-spin"/> Uploading...</div>}
        {editingMsgId && <div className="flex items-center justify-between bg-blue-500/20 border border-blue-500/30 text-blue-200 px-4 py-2 rounded-t-xl text-xs"><span>Editing...</span><button onClick={cancelEdit}><X className="w-4 h-4"/></button></div>}
        <div className={`glass p-2 pl-2 flex items-center gap-2 ${editingMsgId ? 'rounded-b-2xl rounded-t-none' : 'rounded-full'}`}>
          {!editingMsgId && <><input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} /><button onClick={() => fileInputRef.current.click()} className="p-2 hover:bg-white/10 rounded-full text-gray-300"><Paperclip className="w-5 h-5" /></button></>}
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder={isRecording ? "Recording..." : (editingMsgId ? "Update..." : "Message...")} disabled={isRecording} className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none min-w-0" />
          {!editingMsgId && <button onClick={isRecording ? stopRecording : startRecording} className={`p-2 rounded-full transition-all ${isRecording ? 'bg-red-500 animate-pulse text-white' : 'hover:bg-white/10 text-gray-300'}`}>{isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button>}
          {!isRecording && <button onClick={editingMsgId ? submitEdit : sendMessage} disabled={!newMessage.trim()} className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg disabled:opacity-50">{editingMsgId ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5" />}</button>}
        </div>
      </div>
    </div>
  );
};
function App() { return (<Router><Routes><Route path="/" element={<Home />} /><Route path="/room/:roomId" element={<ChatRoom />} /></Routes></Router>); }
export default App;