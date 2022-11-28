import MoreVert from "@mui/icons-material/MoreVert";
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import IconButton from "@mui/material/IconButton";

import { KeyboardEventHandler, MouseEventHandler, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useCollection } from "react-firebase-hooks/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import styled from "styled-components";

import { useRecipient } from "../hooks/useRecipient";
import { Conversation, IMessage } from "../types"
import { convertFirestoreTimestampToString, generateQueryGetMessages, transformMessage } from "../utils/getMessagesInConversation";
import RecipientAvatar from "./RecipientAvatar";
import { auth, db } from "../config/firebase";
import Message from "./Message";
import { async } from "@firebase/util";
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";

const StyledRecipientHeader = styled.div`
    position: sticky;
    background-color: white;
    z-index:100;
    top: 0;
    display: flex;
    align-items: center;
    padding: 11px;
    height: 80px;
    border-bottom: 1px solid whitesmoke;
`

const StyledHeaderInfo = styled.div`
    flex-grow: 1;

    > h3 {
        margin-top: 0;
        margin-bottom: 3px;
    }

    > span {
        font-size: 14px;
        color: gray;
    }
`

const StyledH3 = styled.h3`
    word-break: break-all;
`

const StyledHeaderIcon = styled.div`
    display: flex;
`

const StyledMessageContainer = styled.div`
    padding: 30px;
    background-color: #e5ded8;
    min-height: 90vh;
`

const StyledInputContainer = styled.form`
    display: flex;
    align-items: center;
    padding: 10px;
    position: sticky;
    bottom: 0;
    background-color: white;
    z-index: 100;
`
const StyledInput = styled.input`
    flex-grow: 1;
    outline: none;
    border: none;
    border-radius: 10px;
    background-color: whitesmoke;
    padding: 15px;
    margin-left: 15px;
    margin-right: 15px;
`

const EndOfMessagesForAutoScroll = styled.div`
    margin-bottom: 30px;
`

const ConversationScreen = ({ conversation, messages }: { conversation: Conversation; messages: IMessage[] }) => {
    const [newMessage, setNewMessage] = useState('')
    const conversationUsers = conversation.users
    const [loggedInUser, _loading, _error] = useAuthState(auth)
    const { recipientEmail, recipient } = useRecipient(conversationUsers)
    const endOfMessagesRef = useRef<HTMLDivElement>(null)

    const router = useRouter()
    const conversationId = router.query.id

    const queryGetMessages = generateQueryGetMessages(conversationId as string)

    const [messageSnapshot, messagesLoading, __error] = useCollection(queryGetMessages)

    const showMessages = () => {
        // if frontend is loading messages behind the scenes, display messages retrieved from Next SSR
        if (messagesLoading) {
            return messages.map((message, index) => <Message key={message.id} message={message} />)
        }
        // if frontend has finished loading messages, so now we have messageSnapshot
        if (messageSnapshot) {
            return messageSnapshot.docs.map((message) => <Message key={message.id} message={transformMessage(message)} />)
        }
        return null
    }

    const addMessageToDbAuthUpdateLastSeen = async () => {
        await setDoc(doc(db, 'users', loggedInUser?.email as string), {
            lastSeen: serverTimestamp(),
        }, { merge: true })

        await addDoc(collection(db, 'messages'), {
            conversation_id: conversationId,
            sent_at: serverTimestamp(),
            text: newMessage,
            user: loggedInUser?.email
        })

        setNewMessage('')

        scrollToBottom()
    }

    const sendMessageOnEnter: KeyboardEventHandler<HTMLInputElement> = e => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (!newMessage) return
            addMessageToDbAuthUpdateLastSeen();
        }
    }

    const sendMessageOnClick: MouseEventHandler<HTMLAnchorElement> = e => {
        e.preventDefault();
        if (!newMessage) return
        addMessageToDbAuthUpdateLastSeen()
    }

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
    }


    return (
        <>
            <StyledRecipientHeader>
                <RecipientAvatar
                    recipient={recipient}
                    recipientEmail={recipientEmail}
                />

                <StyledHeaderInfo>
                    <StyledH3>
                        {recipientEmail}
                    </StyledH3>
                    {recipient && <span>Last active: {convertFirestoreTimestampToString(recipient.lastSeen)}</span>}
                </StyledHeaderInfo>

                <StyledHeaderIcon>
                    <IconButton>
                        <AttachFileIcon />
                    </IconButton>
                    <IconButton>
                        <MoreVert />
                    </IconButton>
                </StyledHeaderIcon>
            </StyledRecipientHeader>

            <StyledMessageContainer>
                {showMessages()}
                <EndOfMessagesForAutoScroll ref={endOfMessagesRef} />
            </StyledMessageContainer>

            <StyledInputContainer>
                <InsertEmoticonIcon />
                <StyledInput
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={sendMessageOnEnter} />
                <IconButton onClick={sendMessageOnClick} disabled={!newMessage}>
                    <SendIcon />
                </IconButton>
                <IconButton>
                    <MicIcon />
                </IconButton>
            </StyledInputContainer>
        </>
    )
}

export default ConversationScreen