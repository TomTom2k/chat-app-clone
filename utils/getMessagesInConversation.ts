import { IMessage } from './../types/index';
import { Timestamp } from 'firebase/firestore';
import { collection, where, query, orderBy, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../config/firebase';

export const generateQueryGetMessages = (conversationId?: string) => 
    query(
        collection(db, 'messages'), 
        where('conversation_id', '==', conversationId), 
        orderBy("sent_at", 'asc')
    )


export const transformMessage =(message: QueryDocumentSnapshot<DocumentData>) => ({
    id: message.id,
    ...message.data(),
    sent_at: message.data().sent_at 
        ? convertFirestoreTimestampToString(message.data().sent_at as Timestamp)
        : null
} as IMessage)

export const convertFirestoreTimestampToString = (timestamp: Timestamp) => 
    new Date(timestamp.toDate().getTime()).toLocaleString()