import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";

import { useState } from "react";
import styled from "styled-components"
import EmailValidator from 'email-validator'

import ChatIcon from '@mui/icons-material/Chat';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection } from 'react-firebase-hooks/firestore'
import { signOut } from "firebase/auth";
import { auth, db } from "../config/firebase";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import { addDoc, collection, query, where } from "firebase/firestore";
import { Conversation } from "../types";
import ConversationSelect from "./ConversationSelect";

const StyledContainer = styled.div`
    height: 100vh;
    min-width: 300px;
    max-width: 350px;
    overflow-y: scroll;
    border-right: 1px solid whitesmoke;

    ::-webkit-scrollbar {
    display: none;
    }

    -ms-overflow-style: none;
    scrollbar-width: none;
`;

const StyledHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    height: 80px;
    border-bottom: 1px solid whitesmoke;
    position: sticky;
    top: 0;
    background-color: white;
    z-index: 1;
`

const StyledSearch = styled.div`
    display: flex;
    align-items: center;
    padding: 15px;
    border-radius: 15px;
`

const StyledSearchInput = styled.input`
    outline: none;
    border: none;
    flex: 1;
`

const StyledSidebarButton = styled(Button)`
    width: 100%;
    border-top: 1px solid whitesmoke;
    border-bottom: 1px solid whitesmoke;

`

const StyledUserAvatar = styled(Avatar)`
    cursor: pointer;
    :hover {
        opacity: 0.8;
    }
`

const Sidebar = () => {
    const [loggedInUser, _loading, _error] = useAuthState(auth)

    const [isOpenNewConversationDialog, setIsOpenNewConversationDialog] = useState(false)

    const [recipientEmail, setRecipientEmail] = useState('')

    const toggleNewConversationDialog = (isOpen: boolean) => {
        setIsOpenNewConversationDialog(isOpen)

        if (!isOpen) setRecipientEmail('')
    }

    const closeNewConversationDialog = () => {
        toggleNewConversationDialog(false)
    }

    const queryGetConversationsForCurrentUser = query(collection(db, 'conversations'), where('users', 'array-contains', loggedInUser?.email))

    const [conversationsSnapshot, __loading, __error] = useCollection(queryGetConversationsForCurrentUser)

    const isConversationAlreadyExists = (recipientEmail: string) => conversationsSnapshot?.docs.find(conversation => (
        conversation.data() as Conversation
    ).users.includes(recipientEmail))


    const isInvitingSelf = recipientEmail === loggedInUser?.email

    const createConversation = async () => {
        if (!recipientEmail) return

        if (EmailValidator.validate(recipientEmail) && !isInvitingSelf && !isConversationAlreadyExists(recipientEmail)) {
            await addDoc(collection(db, 'conversations'), {
                users: [loggedInUser?.email, recipientEmail]
            })
        }

        closeNewConversationDialog()

    }

    const logout = async () => {
        try {
            await signOut(auth)
        } catch (error) {
            console.log("ERROR LOGGING OUT", error)
        }
    }



    return (
        <StyledContainer>
            <StyledHeader>
                <Tooltip title={loggedInUser?.email as string} placement="right">
                    <StyledUserAvatar src={loggedInUser?.photoURL || ""} />
                </Tooltip>

                <div>
                    <IconButton>
                        <ChatIcon />
                    </IconButton>
                    <IconButton>
                        <MoreVertIcon />
                    </IconButton>
                    <IconButton>
                        <LogoutIcon onClick={logout} />
                    </IconButton>
                </div>
            </StyledHeader>
            <StyledSearch>
                <SearchIcon />
                <StyledSearchInput placeholder="Search in conversations" />
            </StyledSearch>
            <StyledSidebarButton onClick={() => toggleNewConversationDialog(true)}>START A NEW CONVERSATIONS</StyledSidebarButton>

            {conversationsSnapshot?.docs.map(conversation => <ConversationSelect key={conversation.id} id={conversation.id} conversationUsers={(conversation.data() as Conversation).users} />)}

            <Dialog open={isOpenNewConversationDialog} onClose={closeNewConversationDialog}>
                <DialogTitle>New Conversation</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter a Google email address for the user you wish to chat with
                    </DialogContentText>
                    <TextField
                        autoFocus
                        label="Email Address"
                        type="email"
                        fullWidth
                        variant="standard"
                        value={recipientEmail}
                        onChange={event => setRecipientEmail(event.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeNewConversationDialog}>Cancel</Button>
                    <Button disabled={!recipientEmail} onClick={createConversation}>Create</Button>
                </DialogActions>
            </Dialog>

        </StyledContainer >
    )
}

export default Sidebar